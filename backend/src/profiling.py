"""
Spending behaviour profile via KMeans clustering on behavioural features.
Cache fitted model per dataset; assign profile label and interpretation per user.
"""
import logging
from typing import Dict, Any, List, Optional, Tuple

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

from src.utils import PROFILE_LABELS

logger = logging.getLogger(__name__)

# Features used for clustering (must exist in feature dict)
CLUSTER_FEATURES = [
    "late_night_ratio",
    "weekend_ratio",
    "spike_intensity",
    "burst_ratio_30min",
    "eom_spend_ratio",
    "category_concentration",
]
N_CLUSTERS = 5
MAX_USERS_FOR_FIT = 50_000  # Sample if more users

_cache: Dict[str, Tuple[Any, Any, Optional[np.ndarray]]] = {}  # dataset_id -> (kmeans, scaler, centroids_metadata)


def _get_feature_matrix(features_list: List[Dict[str, Any]]) -> np.ndarray:
    """Build matrix of shape (n_users, n_features) from list of feature dicts."""
    rows = []
    for f in features_list:
        row = [float(f.get(k, 0) or 0) for k in CLUSTER_FEATURES]
        rows.append(row)
    return np.array(rows)


def fit_profiler(dataset_id: str, features_list: List[Dict[str, Any]]) -> None:
    """Fit KMeans and scaler on features from all (or sampled) users; cache by dataset_id."""
    if len(features_list) < N_CLUSTERS:
        logger.warning("Not enough users to fit %s clusters", N_CLUSTERS)
        return
    X = _get_feature_matrix(features_list)
    if len(features_list) > MAX_USERS_FOR_FIT:
        rng = np.random.default_rng(42)
        idx = rng.choice(len(X), MAX_USERS_FOR_FIT, replace=False)
        X = X[idx]
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    kmeans = KMeans(n_clusters=N_CLUSTERS, random_state=42, n_init=10)
    kmeans.fit(X_scaled)
    _cache[dataset_id] = (kmeans, scaler, None)


def ensure_profiler_fitted(dataset_id: str, df: pd.DataFrame, feature_fn) -> None:
    """If profiler not cached for dataset_id, compute features for a sample of users from df and fit."""
    if dataset_id in _cache:
        return
    card_ids = df["card_id"].astype(str).unique()
    if len(card_ids) > MAX_USERS_FOR_FIT:
        rng = np.random.default_rng(42)
        card_ids = rng.choice(card_ids, MAX_USERS_FOR_FIT, replace=False).tolist()
    features_list = []
    for cid in card_ids:
        user_df = df[df["card_id"].astype(str) == str(cid)]
        features_list.append(feature_fn(user_df))
    fit_profiler(dataset_id, features_list)


def get_profile(
    dataset_id: str,
    user_features: Dict[str, Any],
    all_features_list: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Return profile for one user: cluster_id, profile_label, interpretation, key_stats.
    If dataset not in cache and all_features_list provided, fit first then predict.
    """
    if dataset_id in _cache:
        kmeans, scaler, _ = _cache[dataset_id]
    elif all_features_list is not None and len(all_features_list) >= N_CLUSTERS:
        fit_profiler(dataset_id, all_features_list)
        kmeans, scaler, _ = _cache[dataset_id]
    else:
        # No clustering: assign default "Steady spender" (0)
        return {
            "cluster_id": 0,
            "profile_label": PROFILE_LABELS.get(0, "Steady spender"),
            "interpretation": "Insufficient data for behaviour profile.",
            "key_stats": dict(user_features),
        }

    row = np.array([[float(user_features.get(k, 0) or 0) for k in CLUSTER_FEATURES]])
    X = scaler.transform(row)
    label = int(kmeans.predict(X)[0])
    profile_label = PROFILE_LABELS.get(label, f"Profile {label}")

    # Heuristic interpretation from feature values
    if user_features.get("late_night_ratio", 0) and user_features["late_night_ratio"] > 0.2:
        interp = "More transactions occur late at night."
    elif user_features.get("burst_ratio_30min", 0) and user_features["burst_ratio_30min"] > 0.25:
        interp = "Frequent short-interval (burst) purchases."
    elif user_features.get("eom_spend_ratio", 0) and user_features["eom_spend_ratio"] > 0.8:
        interp = "Spending tends to rise at end of month."
    elif user_features.get("category_concentration", 0) and user_features["category_concentration"] > 0.5:
        interp = "Spending concentrated in few categories."
    else:
        interp = "Relatively steady spending pattern across time and categories."

    key_stats = {k: user_features.get(k) for k in CLUSTER_FEATURES if k in user_features}
    return {
        "cluster_id": label,
        "profile_label": profile_label,
        "interpretation": interp,
        "key_stats": key_stats,
    }
