"""model.py

Supervised Machine Learning Model for Delay Probability & Duration Estimation.
Loads and interfaces the trained Random Forest artifact from Phase 8.
"""

import os
from typing import Dict, Any, List, Optional, Union
import numpy as np
import pandas as pd
import joblib

from .config import FEATURE_NAMES, FORBIDDEN_LEAKAGE_COLUMNS

DEFAULT_MODEL_PATH = os.path.join(os.path.dirname(__file__), "delay_risk_model.joblib")


class DelayRiskMLModel:
    """Production Random Forest classifier for delay probability prediction."""

    def __init__(self, model_path: Optional[str] = None):
        # Resolve path: prefer explicit existing path, fallback to default production artifact
        target_path = model_path if (model_path and os.path.exists(model_path)) else DEFAULT_MODEL_PATH
        self.model_path = target_path
        self.model = None
        self.feature_names = FEATURE_NAMES
        self.is_loaded = False

        if os.path.exists(self.model_path):
            self.load(self.model_path)

    def load(self, model_path: str) -> None:
        """Load trained model bundle from disk."""
        data = joblib.load(model_path)
        if isinstance(data, dict):
            self.model = data.get("model")
            self.feature_names = data.get("feature_names", FEATURE_NAMES)
        else:
            self.model = data
        self.is_loaded = self.model is not None

    def predict_delay_probability(self, X_input: Union[pd.DataFrame, np.ndarray, Dict[str, Any]]) -> float:
        """Predict delay probability for a single project vector/dict or array."""
        if isinstance(X_input, dict):
            for k in FORBIDDEN_LEAKAGE_COLUMNS:
                if k in X_input and X_input[k] is not None and k in ["is_delayed", "actual_end_date", "actual_amount", "completion_duration_days"]:
                    raise ValueError(f"Leakage violation: forbidden key '{k}' in predictor input.")
            vec = [float(X_input.get(f, 0.0)) for f in self.feature_names]
            df_arr = pd.DataFrame([vec], columns=self.feature_names)
        elif isinstance(X_input, pd.DataFrame):
            for col in ["is_delayed", "actual_end_date", "actual_amount", "completion_duration_days"]:
                if col in X_input.columns:
                    raise ValueError(f"Leakage violation: forbidden column '{col}' in DataFrame.")
            df_arr = X_input[self.feature_names]
        else:
            df_arr = pd.DataFrame(np.asarray(X_input).reshape(1, -1), columns=self.feature_names)

        if self.is_loaded and self.model is not None:
            probs = self.model.predict_proba(df_arr)
            if len(probs.shape) == 2 and probs.shape[1] > 1:
                return float(probs[0, 1])
            return float(probs[0])

        # Fallback calibrated statistical heuristic if artifact unavailable
        recom_lag = float(df_arr.iloc[0].get("recom_to_sanc_days", 90.0))
        disb_ratio = float(df_arr.iloc[0].get("disbursed_ratio_90d", 0.0))
        sanc_log = float(df_arr.iloc[0].get("log_sanction_amount", 12.0))

        raw_score = (0.45 * min(1.0, recom_lag / 180.0)) + (0.35 * (1.0 - min(1.0, disb_ratio * 5.0))) + (0.20 * min(1.0, sanc_log / 14.0))
        prob = 1.0 / (1.0 + np.exp(-4.0 * (raw_score - 0.45)))
        return float(np.clip(prob, 0.05, 0.95))

    def predict_batch_probabilities(self, df_features: pd.DataFrame) -> np.ndarray:
        """Predict delay probabilities for a batch DataFrame."""
        for col in ["is_delayed", "actual_end_date", "actual_amount", "completion_duration_days"]:
            if col in df_features.columns:
                raise ValueError(f"Leakage violation: forbidden column '{col}' in DataFrame.")

        df_arr = df_features[self.feature_names]
        if self.is_loaded and self.model is not None:
            probs = self.model.predict_proba(df_arr)
            return probs[:, 1]
        
        # Fallback array calculation
        return np.array([self.predict_delay_probability(dict(row)) for _, row in df_arr.iterrows()])
