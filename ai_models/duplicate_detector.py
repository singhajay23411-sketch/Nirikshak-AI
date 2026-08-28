"""duplicate_detector.py

Multi-Signal Duplicate Project Detection Engine for Nirikshak AI.

Pipeline:
  1. Load analytical_features.parquet
  2. Partition by (constituency_id, work_category) to avoid O(N^2) blowup
  3. Compute sentence embeddings (all-MiniLM-L6-v2) for descriptions
  4. Filter candidate pairs with cosine similarity > 0.85
  5. Verify each candidate against 3 supporting signals:
     - Financial Proximity  (sanction_amount within 5%)
     - Agency Match          (ida_name exact or fuzzy match)
     - Temporal Proximity    (sanction_date within 180 days)
  6. Flag as duplicate only if text sim AND >=2 verification signals
  7. Insert into PostgreSQL `duplicate_alerts` table
  8. Export snapshot to data/parquet/duplicate_alerts.parquet
"""

import os
import sys
import warnings
import logging
from datetime import datetime
from typing import List, Tuple, Optional, Generator

import numpy as np
import pandas as pd
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=FutureWarning)

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("duplicate_detector")

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
PROJECT_ROOT = os.path.dirname(os.path.dirname(__file__))
PARQUET_DIR = os.path.join(PROJECT_ROOT, "data", "parquet")
INPUT_PATH = os.path.join(PARQUET_DIR, "analytical_features.parquet")
OUTPUT_PATH = os.path.join(PARQUET_DIR, "duplicate_alerts.parquet")

# Load .env from the backend directory
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
TEXT_SIM_THRESHOLD = 0.85       # Minimum cosine similarity to consider a pair
MAX_ALERTS_PER_PARTITION = 500  # Cap alerts per partition to keep output meaningful
FINANCIAL_TOLERANCE = 0.05      # 5% relative difference in sanction_amount
AGENCY_FUZZY_THRESHOLD = 85     # thefuzz token_sort_ratio threshold
TEMPORAL_MAX_DAYS = 180         # Maximum days apart for temporal proximity
MIN_VERIFICATION_SIGNALS = 2    # At least 2 of 3 signals must be True
EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
CHUNK_SIZE = 5000               # Max partition size for dense similarity
EMBEDDING_BATCH_SIZE = 512      # Batch size for encoding

# Risk confidence weights
W_TEXT = 0.40
W_FINANCIAL = 0.20
W_AGENCY = 0.20
W_TEMPORAL = 0.20


# ===========================================================================
# 1. DATA LOADING
# ===========================================================================

REQUIRED_COLUMNS = [
    "work_id", "clean_description", "activity_name", "work_category",
    "constituency_id", "sanction_amount", "ida_name", "sanction_date",
]


def load_features() -> pd.DataFrame:
    """Load analytical_features.parquet and validate required columns."""
    log.info("Loading %s ...", INPUT_PATH)
    if not os.path.exists(INPUT_PATH):
        raise FileNotFoundError(f"Input file not found: {INPUT_PATH}")

    df = pd.read_parquet(INPUT_PATH)
    log.info("  -> Loaded %s rows x %s cols", f"{df.shape[0]:,}", df.shape[1])

    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    # Ensure sanction_date is datetime
    df["sanction_date"] = pd.to_datetime(df["sanction_date"], errors="coerce")

    # Extract short title from activity_name (text after last '-')
    # e.g. "WS/MP519/2023-2024/60423-Construction of ..." -> "Construction of ..."
    df["work_short_title"] = (
        df["activity_name"]
        .fillna("")
        .str.extract(r"-([^-]+)$", expand=False)
        .fillna("")
        .str.strip()
        .str.lower()
    )

    log.info("  -> Extracted work_short_title from activity_name")
    return df


# ===========================================================================
# 2. PARTITIONING
# ===========================================================================

def partition_dataset(
    df: pd.DataFrame,
) -> Generator[Tuple[str, pd.DataFrame], None, None]:
    """
    Yield (partition_key, partition_df) grouped by
    (constituency_id, work_category).

    Only yields partitions with >= 2 rows (need at least a pair).
    """
    grouped = df.groupby(["constituency_id", "work_category"], sort=False)
    total_partitions = len(grouped)
    viable = 0

    for (const_id, category), group_df in grouped:
        if len(group_df) < 2:
            continue
        viable += 1
        key = f"const_{const_id}|{category}"
        yield key, group_df.reset_index(drop=True)

    log.info(
        "  -> %s viable partitions (>= 2 rows) out of %s total",
        viable, total_partitions,
    )


# ===========================================================================
# 3. EMBEDDING COMPUTATION
# ===========================================================================

def load_embedding_model():
    """Load the sentence-transformers model."""
    # pyrefly: ignore [missing-import]
    from sentence_transformers import SentenceTransformer

    log.info("Loading embedding model: %s", EMBEDDING_MODEL_NAME)
    model = SentenceTransformer(EMBEDDING_MODEL_NAME)
    log.info("  -> Model loaded (dimension: %s)", model.get_sentence_embedding_dimension())
    return model


def build_combined_text(df: pd.DataFrame) -> List[str]:
    """
    Concatenate clean_description and work_short_title into a single
    text field for embedding. This captures both the detailed description
    and the categorical title signal.
    """
    texts = []
    for _, row in df.iterrows():
        desc = str(row.get("clean_description", "")).strip()
        title = str(row.get("work_short_title", "")).strip()
        combined = f"{title} {desc}".strip()
        if not combined:
            combined = "empty"
        texts.append(combined)
    return texts


def compute_embeddings(texts: List[str], model) -> np.ndarray:
    """Batch-encode texts using the sentence-transformer model."""
    embeddings = model.encode(
        texts,
        batch_size=EMBEDDING_BATCH_SIZE,
        show_progress_bar=False,
        normalize_embeddings=True,  # Pre-normalize for fast cosine sim
    )
    return embeddings


# ===========================================================================
# 4. COSINE SIMILARITY CANDIDATE EXTRACTION
# ===========================================================================

def find_text_candidates_dense(
    embeddings: np.ndarray,
    work_ids: np.ndarray,
    threshold: float = TEXT_SIM_THRESHOLD,
) -> List[Tuple[int, int, float]]:
    """
    Compute the full cosine similarity matrix and extract pairs above threshold.
    Used for partitions with <= CHUNK_SIZE rows.

    Since embeddings are L2-normalized, cosine sim = dot product.
    """
    sim_matrix = embeddings @ embeddings.T
    # Zero out the diagonal and lower triangle to avoid self-pairs and duplicates
    n = sim_matrix.shape[0]
    sim_matrix[np.tril_indices(n)] = 0.0

    # Find indices where similarity exceeds threshold
    row_idx, col_idx = np.where(sim_matrix > threshold)

    candidates = []
    for r, c in zip(row_idx, col_idx):
        wid_a = int(work_ids[r])
        wid_b = int(work_ids[c])
        score = float(sim_matrix[r, c])
        # Always store as (min_id, max_id) for deduplication
        candidates.append((min(wid_a, wid_b), max(wid_a, wid_b), score))

    return candidates


def find_text_candidates_chunked(
    embeddings: np.ndarray,
    work_ids: np.ndarray,
    threshold: float = TEXT_SIM_THRESHOLD,
    chunk_size: int = CHUNK_SIZE,
) -> List[Tuple[int, int, float]]:
    """
    Process large partitions in chunks to keep memory bounded.
    Computes similarity in (chunk_size x N) blocks.
    """
    n = embeddings.shape[0]
    candidates = []

    for i_start in range(0, n, chunk_size):
        i_end = min(i_start + chunk_size, n)
        chunk_emb = embeddings[i_start:i_end]

        # Only compare with rows that come AFTER i_start to avoid duplicates
        for j_start in range(i_start, n, chunk_size):
            j_end = min(j_start + chunk_size, n)
            target_emb = embeddings[j_start:j_end]

            sim_block = chunk_emb @ target_emb.T

            # Mask out self-comparisons and lower triangle within same block
            if i_start == j_start:
                block_n = sim_block.shape[0]
                sim_block[np.tril_indices(block_n)] = 0.0

            row_idx, col_idx = np.where(sim_block > threshold)

            for r, c in zip(row_idx, col_idx):
                abs_r = i_start + r
                abs_c = j_start + c
                if abs_r >= abs_c:
                    continue  # Skip lower triangle globally
                wid_a = int(work_ids[abs_r])
                wid_b = int(work_ids[abs_c])
                score = float(sim_block[r, c])
                candidates.append((min(wid_a, wid_b), max(wid_a, wid_b), score))

    return candidates


def find_text_candidates(
    embeddings: np.ndarray,
    work_ids: np.ndarray,
    threshold: float = TEXT_SIM_THRESHOLD,
) -> List[Tuple[int, int, float]]:
    """
    Router: pick dense or chunked strategy based on partition size.
    """
    n = embeddings.shape[0]
    if n <= CHUNK_SIZE:
        return find_text_candidates_dense(embeddings, work_ids, threshold)
    else:
        log.info("    -> Using chunked similarity for %s rows", f"{n:,}")
        return find_text_candidates_chunked(embeddings, work_ids, threshold)


# ===========================================================================
# 5. MULTI-SIGNAL VERIFICATION
# ===========================================================================

def check_financial_proximity(
    amt_a: Optional[float],
    amt_b: Optional[float],
    tolerance: float = FINANCIAL_TOLERANCE,
) -> bool:
    """
    Returns True if the absolute difference in sanction_amount
    between two works is less than `tolerance` (5% by default).
    """
    if amt_a is None or amt_b is None:
        return False
    if pd.isna(amt_a) or pd.isna(amt_b):
        return False

    denominator = max(abs(amt_a), abs(amt_b), 1.0)
    relative_diff = abs(amt_a - amt_b) / denominator
    return relative_diff < tolerance


def check_agency_match(
    ida_a: Optional[str],
    ida_b: Optional[str],
    fuzzy_threshold: int = AGENCY_FUZZY_THRESHOLD,
) -> bool:
    """
    Returns True if ida_name (Implementing Agency) is an exact match
    or has a high fuzzy match (token_sort_ratio > threshold).
    """
    if not ida_a or not ida_b:
        return False
    if not isinstance(ida_a, str) or not isinstance(ida_b, str):
        return False

    ida_a_clean = ida_a.strip().lower()
    ida_b_clean = ida_b.strip().lower()

    if not ida_a_clean or not ida_b_clean:
        return False

    # Fast exact match
    if ida_a_clean == ida_b_clean:
        return True

    # Fuzzy fallback
    # pyrefly: ignore [missing-import]
    from thefuzz import fuzz
    return fuzz.token_sort_ratio(ida_a_clean, ida_b_clean) >= fuzzy_threshold


def check_temporal_proximity(
    date_a, date_b, max_days: int = TEMPORAL_MAX_DAYS,
) -> bool:
    """
    Returns True if the difference between sanction_dates
    is less than `max_days` (180 by default).
    """
    if date_a is None or date_b is None:
        return False
    if pd.isna(date_a) or pd.isna(date_b):
        return False

    try:
        delta = abs((pd.Timestamp(date_a) - pd.Timestamp(date_b)).days)
        return delta < max_days
    except Exception:
        return False


def compute_risk_confidence(
    text_sim: float,
    financial: bool,
    agency: bool,
    temporal: bool,
) -> int:
    """
    Weighted risk confidence score (0 to 100).

    Weights: text=0.40, financial=0.20, agency=0.20, temporal=0.20
    """
    score = (
        W_TEXT * text_sim
        + W_FINANCIAL * (1.0 if financial else 0.0)
        + W_AGENCY * (1.0 if agency else 0.0)
        + W_TEMPORAL * (1.0 if temporal else 0.0)
    )
    return int(round(min(score, 1.0) * 100))


# ===========================================================================
# 6. COMPOSITE ALERT THRESHOLD
# ===========================================================================

def verify_candidate_pair(
    row_a: pd.Series,
    row_b: pd.Series,
    text_sim: float,
) -> Optional[dict]:
    """
    Evaluate a candidate pair against the multi-signal verification.
    Returns an alert dict if the composite threshold is met, else None.

    Rule: text_sim > 0.85 AND at least 2 of 3 verification signals.
    """
    financial = check_financial_proximity(
        row_a.get("sanction_amount"), row_b.get("sanction_amount")
    )
    agency = check_agency_match(
        row_a.get("ida_name"), row_b.get("ida_name")
    )
    temporal = check_temporal_proximity(
        row_a.get("sanction_date"), row_b.get("sanction_date")
    )

    # Count verification signals
    signal_count = sum([financial, agency, temporal])

    if signal_count < MIN_VERIFICATION_SIGNALS:
        return None

    risk_score = compute_risk_confidence(text_sim, financial, agency, temporal)

    return {
        "work_id_A": int(min(row_a["work_id"], row_b["work_id"])),
        "work_id_B": int(max(row_a["work_id"], row_b["work_id"])),
        "text_similarity_score": round(text_sim, 4),
        "financial_match_flag": financial,
        "agency_match_flag": agency,
        "temporal_match_flag": temporal,
        "risk_confidence_score": risk_score,
    }


# ===========================================================================
# 7. DATABASE OPERATIONS
# ===========================================================================

def get_connection():
    """Create a PostgreSQL connection using .env credentials."""
    params = {
        "host": os.getenv("DB_HOST", "localhost"),
        "port": int(os.getenv("DB_PORT", 5432)),
        "dbname": os.getenv("DB_NAME", "nirikshak"),
        "user": os.getenv("DB_USER", "postgres"),
        "password": os.getenv("DB_PASSWORD", "postgres"),
    }
    conn = psycopg2.connect(**params)
    conn.autocommit = False
    return conn


def create_duplicate_alerts_table(conn) -> None:
    """Create the duplicate_alerts table if it doesn't exist."""
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS duplicate_alerts (
            alert_id              SERIAL PRIMARY KEY,
            "work_id_A"             BIGINT NOT NULL,
            "work_id_B"             BIGINT NOT NULL,
            text_similarity_score DOUBLE PRECISION NOT NULL,
            financial_match_flag  BOOLEAN NOT NULL DEFAULT FALSE,
            agency_match_flag     BOOLEAN NOT NULL DEFAULT FALSE,
            temporal_match_flag   BOOLEAN NOT NULL DEFAULT FALSE,
            risk_confidence_score DOUBLE PRECISION NOT NULL,
            partition_key         TEXT,
            detected_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE ("work_id_A", "work_id_B")
        );
    """)

    # Indexes for fast querying
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_dup_work_a
        ON duplicate_alerts ("work_id_A");
    """)
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_dup_work_b
        ON duplicate_alerts ("work_id_B");
    """)
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_dup_risk
        ON duplicate_alerts (risk_confidence_score DESC);
    """)

    conn.commit()
    cur.close()
    log.info("  -> duplicate_alerts table ready")


def insert_alerts_to_db(conn, alerts_df: pd.DataFrame) -> int:
    """Batch-insert alerts into the duplicate_alerts table."""
    if alerts_df.empty:
        log.info("  -> No alerts to insert")
        return 0

    cur = conn.cursor()

    # Truncate existing data for a clean run
    cur.execute("TRUNCATE TABLE duplicate_alerts RESTART IDENTITY;")

    columns = [
        "work_id_A", "work_id_B", "text_similarity_score",
        "financial_match_flag", "agency_match_flag", "temporal_match_flag",
        "risk_confidence_score", "partition_key",
    ]
    
    db_columns = [
        '"work_id_A"', '"work_id_B"', "text_similarity_score",
        "financial_match_flag", "agency_match_flag", "temporal_match_flag",
        "risk_confidence_score", "partition_key",
    ]

    rows = []
    for _, row in alerts_df.iterrows():
        rows.append(tuple(
            row[c] if not (isinstance(row[c], float) and np.isnan(row[c])) else None
            for c in columns
        ))

    col_names = ", ".join(db_columns)
    psycopg2.extras.execute_values(
        cur,
        f"""INSERT INTO duplicate_alerts ({col_names})
            VALUES %s
            ON CONFLICT ("work_id_A", "work_id_B") DO UPDATE SET
                text_similarity_score = EXCLUDED.text_similarity_score,
                financial_match_flag  = EXCLUDED.financial_match_flag,
                agency_match_flag     = EXCLUDED.agency_match_flag,
                temporal_match_flag   = EXCLUDED.temporal_match_flag,
                risk_confidence_score = EXCLUDED.risk_confidence_score,
                partition_key         = EXCLUDED.partition_key,
                detected_at           = CURRENT_TIMESTAMP
        """,
        rows,
        page_size=1000,
    )

    conn.commit()
    cur.close()
    log.info("  -> Inserted %s alerts into PostgreSQL", f"{len(rows):,}")
    return len(rows)


# ===========================================================================
# 8. PARQUET EXPORT
# ===========================================================================

def export_alerts_parquet(alerts_df: pd.DataFrame) -> str:
    """Save the alerts DataFrame to a Parquet snapshot."""
    os.makedirs(PARQUET_DIR, exist_ok=True)
    alerts_df.to_parquet(OUTPUT_PATH, engine="pyarrow", compression="snappy", index=False)
    log.info("  -> Saved %s (%s rows)", OUTPUT_PATH, f"{len(alerts_df):,}")
    return OUTPUT_PATH


# ===========================================================================
# MAIN PIPELINE
# ===========================================================================

def process_partition(
    partition_key: str,
    partition_df: pd.DataFrame,
    model,
    work_id_to_row: dict,
) -> List[dict]:
    """Process a single partition: embed -> filter -> verify -> return alerts."""
    effective_threshold = TEXT_SIM_THRESHOLD
    effective_min_signals = MIN_VERIFICATION_SIGNALS

    # Build combined text for embeddings
    texts = build_combined_text(partition_df)

    # Compute embeddings
    embeddings = compute_embeddings(texts, model)
    work_ids = partition_df["work_id"].values

    # Find text similarity candidates with the effective threshold
    candidates = find_text_candidates(embeddings, work_ids, threshold=effective_threshold)

    if not candidates:
        return []

    # Sort candidates by text similarity (highest first) for quality ranking
    candidates.sort(key=lambda x: x[2], reverse=True)

    # Verify each candidate pair
    alerts = []
    for wid_a, wid_b, text_sim in candidates:
        row_a = work_id_to_row.get(wid_a)
        row_b = work_id_to_row.get(wid_b)

        if row_a is None or row_b is None:
            continue

        financial = check_financial_proximity(
            row_a.get("sanction_amount"), row_b.get("sanction_amount")
        )
        agency = check_agency_match(
            row_a.get("ida_name"), row_b.get("ida_name")
        )
        temporal = check_temporal_proximity(
            row_a.get("sanction_date"), row_b.get("sanction_date")
        )

        signal_count = sum([financial, agency, temporal])

        if signal_count < effective_min_signals:
            continue

        risk_score = compute_risk_confidence(text_sim, financial, agency, temporal)

        alerts.append({
            "work_id_A": int(min(row_a["work_id"], row_b["work_id"])),
            "work_id_B": int(max(row_a["work_id"], row_b["work_id"])),
            "text_similarity_score": round(text_sim, 4),
            "financial_match_flag": financial,
            "agency_match_flag": agency,
            "temporal_match_flag": temporal,
            "risk_confidence_score": risk_score,
            "partition_key": partition_key,
        })

        # Cap alerts per partition to prevent runaway output
        if len(alerts) >= MAX_ALERTS_PER_PARTITION:
            log.info("    -> Alert cap reached (%s), keeping top %s by score",
                     MAX_ALERTS_PER_PARTITION, MAX_ALERTS_PER_PARTITION)
            break

    return alerts


def main():
    """Orchestrate the full duplicate detection pipeline."""
    print("=" * 72)
    print("NIRIKSHAK AI -- DUPLICATE PROJECT DETECTION ENGINE")
    print("=" * 72)
    start_time = datetime.now()

    # -- Step 1: Load data --
    log.info("STEP 1/6: Loading data")
    df = load_features()

    # Build a fast work_id -> row lookup (as Series)
    log.info("  -> Building work_id lookup index ...")
    df_indexed = df.set_index("work_id", drop=False)
    work_id_to_row = {wid: row for wid, row in df_indexed.iterrows()}
    log.info("  -> Indexed %s works", f"{len(work_id_to_row):,}")

    # -- Step 2: Load model --
    log.info("STEP 2/6: Loading embedding model")
    model = load_embedding_model()

    # -- Step 3: Partition and process --
    log.info("STEP 3/6: Partitioning dataset by (constituency_id, work_category)")

    # We need to collect partition info first
    partitions = []
    grouped = df.groupby(["constituency_id", "work_category"], sort=False)
    for (const_id, category), group_df in grouped:
        if len(group_df) < 2:
            continue
        key = f"const_{const_id}|{category}"
        partitions.append((key, group_df.reset_index(drop=True)))

    total_partitions = len(partitions)
    log.info("  -> %s viable partitions to process", total_partitions)

    # -- Step 4 & 5: Process each partition --
    log.info("STEP 4/6: Processing partitions (embed -> filter -> verify)")
    all_alerts = []
    total_candidates = 0

    for idx, (partition_key, partition_df) in enumerate(partitions, 1):
        n = len(partition_df)

        if idx % 20 == 0 or idx == 1 or idx == total_partitions:
            log.info(
                "  [%s/%s] %s (%s rows)",
                idx, total_partitions, partition_key, f"{n:,}",
            )

        partition_alerts = process_partition(
            partition_key, partition_df, model, work_id_to_row,
        )

        if partition_alerts:
            all_alerts.extend(partition_alerts)
            log.info(
                "    -> %s alerts from %s",
                len(partition_alerts), partition_key,
            )

    log.info("  -> Total flagged alerts: %s", f"{len(all_alerts):,}")

    # -- Step 5: Build alerts DataFrame --
    log.info("STEP 5/6: Building alerts DataFrame")
    if all_alerts:
        alerts_df = pd.DataFrame(all_alerts)
        # Drop exact duplicates (same pair flagged in unlikely edge cases)
        alerts_df = alerts_df.drop_duplicates(
            subset=["work_id_A", "work_id_B"], keep="first"
        )
        alerts_df = alerts_df.sort_values(
            "risk_confidence_score", ascending=False
        ).reset_index(drop=True)
    else:
        alerts_df = pd.DataFrame(columns=[
            "work_id_A", "work_id_B", "text_similarity_score",
            "financial_match_flag", "agency_match_flag",
            "temporal_match_flag", "risk_confidence_score",
            "partition_key",
        ])

    log.info("  -> Final alerts: %s", f"{len(alerts_df):,}")

    # Print top alerts preview
    if not alerts_df.empty:
        print("\n" + "-" * 72)
        print("TOP 10 HIGHEST-RISK DUPLICATE ALERTS")
        print("-" * 72)
        preview_cols = [
            "work_id_A", "work_id_B", "text_similarity_score",
            "financial_match_flag", "agency_match_flag",
            "temporal_match_flag", "risk_confidence_score",
        ]
        print(alerts_df[preview_cols].head(10).to_string(index=False))
        print("-" * 72)

        # Signal distribution
        print("\nSIGNAL DISTRIBUTION:")
        print(f"  Financial matches:  {alerts_df['financial_match_flag'].sum():,}")
        print(f"  Agency matches:     {alerts_df['agency_match_flag'].sum():,}")
        print(f"  Temporal matches:   {alerts_df['temporal_match_flag'].sum():,}")
        print(f"  Avg risk score:     {alerts_df['risk_confidence_score'].mean():.4f}")
        print(f"  Max risk score:     {alerts_df['risk_confidence_score'].max():.4f}")
        print()

    # -- Step 6: Export --
    log.info("STEP 6/6: Exporting results")

    # 6a. Parquet
    export_alerts_parquet(alerts_df)

    # 6b. PostgreSQL
    try:
        conn = get_connection()
        create_duplicate_alerts_table(conn)
        inserted = insert_alerts_to_db(conn, alerts_df)
        conn.close()
        log.info("  -> PostgreSQL export complete (%s rows)", f"{inserted:,}")
    except Exception as e:
        log.error("  -> PostgreSQL export FAILED: %s", e)
        log.error("  -> Parquet snapshot is still available at %s", OUTPUT_PATH)

    # -- Summary --
    elapsed = (datetime.now() - start_time).total_seconds()
    print("\n" + "=" * 72)
    print(f"PIPELINE COMPLETE in {elapsed:.1f}s")
    print(f"  Total records analysed:   {len(df):,}")
    print(f"  Partitions processed:     {total_partitions:,}")
    print(f"  Duplicate alerts flagged: {len(alerts_df):,}")
    print(f"  Output parquet:           {OUTPUT_PATH}")
    print("=" * 72)


if __name__ == "__main__":
    main()
