"""
Dataset-level training:
- Fit score calibration bounds (normalization) from sampled users.
- Fit KMeans behaviour profiling model.

This is unsupervised training: Elo has no impulse labels.
"""

import time
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd

from src.data_loader import get_artifacts, set_artifacts
from src.features import compute_features
from src.profiling import fit_profiler, MAX_USERS_FOR_FIT


def _percentile(values: List[float], q: float, default: float) -> float:
    arr = np.array([v for v in values if np.isfinite(v)], dtype=float)
    if arr.size == 0:
        return default
    return float(np.percentile(arr, q))


def fit_score_calibration(features_list: List[Dict[str, Any]]) -> Dict[str, float]:
    """
    Fit normalization bounds from feature distributions.
    Uses 95th percentile as a robust high bound (reduces outlier impact).
    """
    spike = [float(f.get("spike_intensity", 0) or 0) for f in features_list]
    burst_max2h = [float(f.get("max_tx_in_2h", 0) or 0) for f in features_list]
    eom = [float(max(f.get("eom_spend_ratio", 0) or 0, f.get("eom_count_ratio", 0) or 0)) for f in features_list]
    entropy = [float(f.get("hour_entropy", 0) or 0) for f in features_list]
    diversity = [float(f.get("category_diversity", 0) or 0) for f in features_list]

    return {
        "spike_p95": max(1.0, _percentile(spike, 95, 5.0)),
        "max_tx_in_2h_p95": max(3.0, _percentile(burst_max2h, 95, 20.0)),
        "eom_ratio_p95": max(0.5, _percentile(eom, 95, 3.0)),
        "hour_entropy_p95": max(1.0, _percentile(entropy, 95, 4.0)),
        "category_diversity_p95": max(3.0, _percentile(diversity, 95, 10.0)),
    }


def _sample_card_ids(df: pd.DataFrame, max_users: int) -> List[str]:
    card_ids = df["card_id"].astype(str).unique().tolist()
    if len(card_ids) <= max_users:
        return card_ids
    rng = np.random.default_rng(42)
    idx = rng.choice(len(card_ids), max_users, replace=False)
    return [card_ids[i] for i in idx]


def ensure_trained(dataset_id: str, df: pd.DataFrame) -> Dict[str, Any]:
    """
    Ensure dataset_id has trained artifacts. Returns artifacts dict.
    Trains on a sample of users (up to MAX_USERS_FOR_FIT).
    """
    artifacts = get_artifacts(dataset_id) or {"trained": False, "calibration": None}
    if artifacts.get("trained") and artifacts.get("calibration"):
        return artifacts

    start = time.time()
    card_ids = _sample_card_ids(df, MAX_USERS_FOR_FIT)
    features_list: List[Dict[str, Any]] = []
    for cid in card_ids:
        user_df = df[df["card_id"].astype(str) == str(cid)]
        features_list.append(compute_features(user_df))

    calibration = fit_score_calibration(features_list)
    fit_profiler(dataset_id, features_list)

    artifacts = {
        "trained": True,
        "trained_users": len(features_list),
        "trained_seconds": round(time.time() - start, 2),
        "calibration": calibration,
    }
    set_artifacts(dataset_id, artifacts)
    return artifacts


def get_calibration(dataset_id: str) -> Optional[Dict[str, float]]:
    artifacts = get_artifacts(dataset_id) or {}
    cal = artifacts.get("calibration")
    return cal if isinstance(cal, dict) else None

