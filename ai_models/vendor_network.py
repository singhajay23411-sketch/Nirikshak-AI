import os
import logging
import warnings
from typing import Dict, Any, Tuple, List
import pandas as pd
import networkx as nx
import psycopg2

log = logging.getLogger("vendor_network")
warnings.filterwarnings("ignore", category=UserWarning)

PROJECT_ROOT = os.path.dirname(os.path.dirname(__file__))
DATA_DIR = os.path.join(PROJECT_ROOT, "data")
LIVE_EXPORTS_DIR = os.path.join(DATA_DIR, "live_exports")

def get_db_connection():
    from dotenv import load_dotenv
    load_dotenv(os.path.join(PROJECT_ROOT, "backend", ".env"))
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", 5432)),
        dbname=os.getenv("DB_NAME", "nirikshak"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "postgres"),
    )

def fetch_vendor_edges() -> pd.DataFrame:
    log.info("Fetching vendor edges from PostgreSQL...")
    query = """
        SELECT
            w.constituency_id,
            c.constituency_name,
            s.state_name,
            v.vendor_name,
            SUM(e.fund_disbursed_amount) as total_disbursed
        FROM works w
        JOIN expenditures e ON w.work_id = e.work_id
        JOIN vendors v ON e.vendor_id = v.vendor_id
        JOIN constituencies c ON w.constituency_id = c.constituency_id
        JOIN states s ON w.state_id = s.state_id
        GROUP BY w.constituency_id, c.constituency_name, s.state_name, v.vendor_name
        HAVING SUM(e.fund_disbursed_amount) > 0
    """
    conn = get_db_connection()
    df = pd.read_sql(query, conn)
    conn.close()
    return df

def generate_hhi_metrics(df: pd.DataFrame) -> Tuple[List[Dict[str, Any]], pd.DataFrame]:
    """Calculates HHI for each constituency."""
    log.info("Calculating HHI metrics...")
    
    # Calculate total funds per constituency
    const_totals = df.groupby('constituency_id')['total_disbursed'].sum().reset_index()
    const_totals.rename(columns={'total_disbursed': 'constituency_total_funds'}, inplace=True)
    
    # Merge and calculate market share squared
    df_merged = df.merge(const_totals, on='constituency_id')
    df_merged['market_share'] = (df_merged['total_disbursed'] / df_merged['constituency_total_funds']) * 100
    df_merged['market_share_sq'] = df_merged['market_share'] ** 2
    
    # Aggregate HHI per constituency
    hhi_df = df_merged.groupby(['constituency_id', 'constituency_name', 'state_name']).agg(
        hhi=('market_share_sq', 'sum'),
        total_vendors=('vendor_name', 'count'),
        total_funds=('constituency_total_funds', 'first')
    ).reset_index()
    
    # Flag Monopolies
    hhi_df['is_monopoly'] = hhi_df['hhi'] > 2500
    hhi_df['hhi'] = hhi_df['hhi'].round(2)
    
    # Top vendor per constituency
    top_vendors = df_merged.loc[df_merged.groupby('constituency_id')['market_share'].idxmax()]
    top_vendors = top_vendors[['constituency_id', 'vendor_name', 'market_share']]
    top_vendors.rename(columns={'vendor_name': 'dominant_vendor', 'market_share': 'dominant_vendor_share'}, inplace=True)
    
    hhi_df = hhi_df.merge(top_vendors, on='constituency_id', how='left')
    hhi_df['dominant_vendor_share'] = hhi_df['dominant_vendor_share'].round(2)
    
    hhi_records = hhi_df.to_dict(orient='records')
    return hhi_records, hhi_df

def generate_vendor_cartel_network(df: pd.DataFrame, hhi_df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Builds NetworkX graph and computes vendor centrality/cartel risk."""
    log.info("Building Vendor NetworkX graph...")
    
    B = nx.Graph()
    
    # Nodes
    constituencies = df['constituency_name'].unique()
    vendors = df['vendor_name'].unique()
    
    B.add_nodes_from(constituencies, bipartite=0)
    B.add_nodes_from(vendors, bipartite=1)
    
    # Edges
    for _, row in df.iterrows():
        B.add_edge(row['vendor_name'], row['constituency_name'], weight=row['total_disbursed'])
        
    # Calculate degree centrality for vendors in bipartite graph
    vendor_degrees = {}
    for v in vendors:
        # Number of constituencies this vendor operates in
        vendor_degrees[v] = B.degree(v)
        
    # Find High Risk Vendors
    # Definition: Operates in >1 constituency, AND holds dominant share in monopolies
    monopoly_consts = hhi_df[hhi_df['is_monopoly']]['constituency_name'].tolist()
    
    vendor_risk = []
    for vendor in vendors:
        neighbors = list(B.neighbors(vendor))
        monopoly_count = sum(1 for n in neighbors if n in monopoly_consts)
        total_funds = sum(B[vendor][n]['weight'] for n in neighbors)
        
        if vendor_degrees[vendor] > 0 and monopoly_count > 0:
            vendor_risk.append({
                "vendor_name": str(vendor),
                "constituencies_operated": int(vendor_degrees[vendor]),
                "monopolies_controlled": int(monopoly_count),
                "total_funds_captured": float(total_funds),
                "risk_score": round((monopoly_count / vendor_degrees[vendor]) * 100, 2),
                "regions": neighbors
            })
            
    # Sort by total funds captured and risk score
    vendor_risk.sort(key=lambda x: (x['monopolies_controlled'], x['total_funds_captured']), reverse=True)
    return vendor_risk

def run_full_analysis():
    df = fetch_vendor_edges()
    hhi_records, hhi_df = generate_hhi_metrics(df)
    cartels = generate_vendor_cartel_network(df, hhi_df)
    return hhi_records, cartels
