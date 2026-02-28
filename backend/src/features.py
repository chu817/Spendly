"""
Per-user behavioural feature computation from transaction DataFrame.
Input: single user's transactions (card_id filtered). Output: dict of feature name -> value.
"""
import numpy as np
import pandas as pd
from typing import Dict, Any


def _hour_entropy(hours: pd.Series) -> float:
    """Entropy of hour-of-day distribution (0-23). Higher = more spread out."""
    if hours is None or len(hours) < 2:
        return 0.0
    counts = hours.value_counts(normalize=True)
    p = counts.values
    p = p[p > 0]
    return float(-np.sum(p * np.log2(p + 1e-10)))


def compute_features(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Compute all behavioural features for one user's transactions.
    df must have: purchase_date (datetime), purchase_amount, category_1, category_2, category_3.
    """
    if df is None or len(df) == 0:
        return _empty_features()

    df = df.sort_values("purchase_date").reset_index(drop=True)
    dates = pd.to_datetime(df["purchase_date"])
    amounts = pd.to_numeric(df["purchase_amount"], errors="coerce").fillna(0).abs()

    # --- Timing ---
    hours = dates.dt.hour
    late_night = ((hours >= 22) | (hours < 5)).sum()
    late_night_ratio = late_night / len(df)

    weekday = dates.dt.dayofweek  # 5,6 = weekend
    weekend_ratio = (weekday >= 5).sum() / len(df)

    hour_entropy_val = _hour_entropy(hours)

    # --- Daily aggregates for spikes ---
    df_day = df.copy()
    df_day["date"] = dates.dt.date
    daily = df_day.groupby("date").agg(
        daily_tx_count=("purchase_date", "count"),
        daily_spend=("purchase_amount", lambda x: pd.to_numeric(x, errors="coerce").abs().sum()),
    ).reset_index()

    if len(daily) < 2:
        spike_intensity_count = 0.0
        spike_intensity_spend = 0.0
    else:
        count_mean = daily["daily_tx_count"].mean()
        count_std = daily["daily_tx_count"].std()
        spend_mean = daily["daily_spend"].mean()
        spend_std = daily["daily_spend"].std()
        spike_intensity_count = float(
            ((daily["daily_tx_count"] - count_mean) / (count_std + 1e-10)).abs().max()
        )
        spike_intensity_spend = float(
            ((daily["daily_spend"] - spend_mean) / (spend_std + 1e-10)).abs().max()
        )
    spike_intensity = max(spike_intensity_count, spike_intensity_spend)

    # --- Burst: consecutive gaps <= 30 min, max tx in 2h ---
    diffs = dates.diff().dt.total_seconds() / 60  # minutes
    gaps_30min = (diffs <= 30) & (diffs > 0)
    n_consecutive_30 = gaps_30min.sum()
    n_gaps = (diffs > 0).sum()
    burst_ratio_30min = float(n_consecutive_30 / (n_gaps + 1e-10))

    # Max transactions in any 2-hour window
    ts = dates.astype(np.int64) // 10**9  # seconds
    window_2h = 2 * 3600
    max_tx_in_2h = 0
    for i in range(len(ts)):
        window_end = ts.iloc[i] + window_2h
        count = (ts >= ts.iloc[i]) & (ts <= window_end)
        max_tx_in_2h = max(max_tx_in_2h, count.sum())
    max_tx_in_2h = int(max_tx_in_2h)

    # --- EOM: last 5 days of calendar month vs rest of month ---
    month_end = dates + pd.offsets.MonthEnd(0)
    last_5_days_of_month = dates >= (month_end - pd.Timedelta(days=4))
    last_5_spend = amounts[last_5_days_of_month].sum()
    last_5_count = last_5_days_of_month.sum()
    rest_spend = amounts[~last_5_days_of_month].sum()
    rest_count = (~last_5_days_of_month).sum()
    eom_spend_ratio = float(last_5_spend / (rest_spend + 1e-10))
    eom_count_ratio = float(last_5_count / (rest_count + 1e-10))

    # --- Category ---
    cat3 = df["category_3"].astype(str)
    n_distinct = cat3.nunique()
    category_diversity = int(n_distinct)
    counts = cat3.value_counts(normalize=True)
    category_concentration = float(counts.max()) if len(counts) else 0.0

    return {
        "late_night_ratio": late_night_ratio,
        "weekend_ratio": weekend_ratio,
        "hour_entropy": hour_entropy_val,
        "spike_intensity": spike_intensity,
        "burst_ratio_30min": burst_ratio_30min,
        "max_tx_in_2h": max_tx_in_2h,
        "eom_spend_ratio": eom_spend_ratio,
        "eom_count_ratio": eom_count_ratio,
        "category_diversity": category_diversity,
        "category_concentration": category_concentration,
        "tx_count": len(df),
        "total_spend": float(amounts.sum()),
    }


def _empty_features() -> Dict[str, Any]:
    """Return default feature dict when there are no transactions."""
    return {
        "late_night_ratio": 0.0,
        "weekend_ratio": 0.0,
        "hour_entropy": 0.0,
        "spike_intensity": 0.0,
        "burst_ratio_30min": 0.0,
        "max_tx_in_2h": 0,
        "eom_spend_ratio": 0.0,
        "eom_count_ratio": 0.0,
        "category_diversity": 0,
        "category_concentration": 0.0,
        "tx_count": 0,
        "total_spend": 0.0,
    }
