import os
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier

PROJECT_ROOT = os.path.dirname(os.path.dirname(__file__))
PARQUET_DIR = os.path.join(PROJECT_ROOT, "data", "parquet")
MODEL_PATH = os.path.join(os.path.dirname(__file__), "stall_predictor.joblib")

def train_stall_model():
    """Trains a quick Random Forest classifier to predict project stall probability."""
    path = os.path.join(PARQUET_DIR, "analytical_features.parquet")
    if not os.path.exists(path):
        raise FileNotFoundError(f"Analytical features parquet not found at {path}")
    
    df = pd.read_parquet(path)
    
    # Define Target: Stalled = delay > 365 days OR (lifetime > 365 days and disbursement_ratio < 0.4)
    # Filter only for projects that are Completed or have run long enough to evaluate
    df['is_stalled'] = (
        (df['completion_delay_days'] > 365) |
        ((df['project_lifetime_days'] > 365) & (df['disbursement_ratio'].fillna(0) < 0.4))
    ).astype(int)
    
    # Features (carefully selected to avoid leakage)
    features = [
        'sanction_amount', 'sanction_delay_days', 'utilization_rate', 'desc_word_count'
    ]
    
    # Fill missing values
    df_clean = df[features + ['is_stalled']].dropna().copy()
    
    X = df_clean[features]
    y = df_clean['is_stalled']
    
    if len(df_clean) < 100:
        # Fallback if too few records (e.g. in test db)
        model = None
        print("Not enough data to train RandomForest stall predictor.")
        return model
    
    model = RandomForestClassifier(n_estimators=30, max_depth=8, random_state=42, n_jobs=-1)
    model.fit(X, y)
    
    # Save the model
    import joblib
    joblib.dump(model, MODEL_PATH)
    print(f"Stall predictor model trained and saved to {MODEL_PATH}")
    return model

def predict_stall_probabilities(df_input: pd.DataFrame) -> np.ndarray:
    """Predict stall probabilities (0.0 to 1.0) for a batch of projects."""
    features = ['sanction_amount', 'sanction_delay_days', 'utilization_rate', 'desc_word_count']
    X = df_input[features].copy()
    
    # Fill missing features with reasonable defaults
    X['sanction_amount'] = pd.to_numeric(X['sanction_amount'], errors='coerce').fillna(350000.0)
    X['sanction_delay_days'] = pd.to_numeric(X['sanction_delay_days'], errors='coerce').fillna(90.0)
    X['utilization_rate'] = pd.to_numeric(X['utilization_rate'], errors='coerce').fillna(0.1)
    X['desc_word_count'] = pd.to_numeric(X['desc_word_count'], errors='coerce').fillna(15.0)
    
    import joblib
    model = None
    if os.path.exists(MODEL_PATH):
        try:
            model = joblib.load(MODEL_PATH)
        except Exception:
            pass
            
    if model is None:
        # Train dynamically if not exists
        try:
            model = train_stall_model()
        except Exception:
            model = None
            
    if model is not None:
        probs = model.predict_proba(X)
        return probs[:, 1]
    
    # Calibrated statistical heuristic if model is unavailable
    sanc_delay = X['sanction_delay_days']
    util = X['utilization_rate']
    
    score = (0.50 * np.clip(sanc_delay / 365.0, 0.0, 1.0)) + (0.50 * (1.0 - np.clip(util, 0.0, 1.0)))
    return np.clip(score, 0.0, 1.0).values
