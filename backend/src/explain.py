"""
Explainability: top drivers, evidence text, and chart-ready series.
"""
from typing import Dict, Any, List

import pandas as pd

# Human-readable labels for components
COMPONENT_LABELS = {
    "spike": "Spending spikes",
    "burst": "Burst buying",
    "eom": "End-of-month surge",
    "timing": "Timing triggers",
    "category": "Category concentration",
}


def top_drivers(breakdown: Dict[str, float], n: int = 5) -> List[str]:
    """Return top N driver labels by contribution (descending)."""
    sorted_components = sorted(
        breakdown.items(),
        key=lambda x: x[1],
        reverse=True,
    )
    return [COMPONENT_LABELS.get(k, k) for k, _ in sorted_components[:n]]


def evidence_text(
    features: Dict[str, Any],
    breakdown: Dict[str, float],
) -> List[str]:
    """Short evidence sentences grounded in feature values."""
    lines: List[str] = []
    if features.get("late_night_ratio", 0) and features["late_night_ratio"] > 0.15:
        pct = round(features["late_night_ratio"] * 100)
        lines.append(f"{pct}% of transactions occurred late at night (22:00–04:59).")
    if features.get("burst_ratio_30min", 0) and features["burst_ratio_30min"] > 0.2:
        pct = round(features["burst_ratio_30min"] * 100)
        lines.append(f"{pct}% of transaction gaps were under 30 minutes (burst pattern).")
    if features.get("max_tx_in_2h", 0) and features["max_tx_in_2h"] >= 5:
        lines.append(f"Largest 2-hour window had {features['max_tx_in_2h']} transactions.")
    if features.get("eom_spend_ratio", 0) and features["eom_spend_ratio"] > 0.5:
        r = round(features["eom_spend_ratio"], 1)
        lines.append(f"Last-5-days-of-month spend was {r}x the rest-of-month spend.")
    if features.get("category_concentration", 0) and features["category_concentration"] > 0.5:
        pct = round(features["category_concentration"] * 100)
        lines.append(f"Spending was concentrated in few categories ({pct}% in top category).")
    if features.get("spike_intensity", 0) and features["spike_intensity"] > 2:
        lines.append("Daily spend or transaction count showed notable spikes.")
    return lines[:5]  # Cap at 5


def build_chart_series(df: pd.DataFrame, features: Dict[str, Any]) -> Dict[str, Any]:
    """Build chart-ready series from user transactions: daily_spend, hourly_counts, category_distribution, eom_comparison."""
    out: Dict[str, Any] = {}
    if df is None or len(df) == 0:
        return {"daily_spend": [], "hourly_counts": [], "category_distribution": [], "eom_comparison": {"last_5_days": 0, "rest_of_month": 0}}

    dates = pd.to_datetime(df["purchase_date"])
    amounts = pd.to_numeric(df["purchase_amount"], errors="coerce").fillna(0).abs()

    # Daily spend (with spike marker: day is spike if z-score > 2)
    df_day = df.copy()
    df_day["date"] = dates.dt.date
    daily = df_day.groupby("date").agg(
        value=("purchase_amount", lambda x: pd.to_numeric(x, errors="coerce").abs().sum()),
    ).reset_index()
    daily["date"] = daily["date"].astype(str)
    if len(daily) >= 2:
        mean_s, std_s = daily["value"].mean(), daily["value"].std()
        daily["is_spike"] = (std_s > 0) & ((daily["value"] - mean_s) / (std_s + 1e-10) > 2)
    else:
        daily["is_spike"] = False
    out["daily_spend"] = [
        {"date": r["date"], "value": float(r["value"]), "is_spike": bool(r["is_spike"])}
        for r in daily[["date", "value", "is_spike"]].to_dict("records")
    ]

    # Hourly counts
    hours = dates.dt.hour
    hour_counts = hours.value_counts().sort_index()
    out["hourly_counts"] = [{"hour": int(h), "count": int(c)} for h, c in hour_counts.items()]

    # Category distribution (category_3 share)
    cat3 = df["category_3"].astype(str)
    cat_counts = cat3.value_counts(normalize=True)
    out["category_distribution"] = [{"category": str(k), "share": float(v)} for k, v in cat_counts.items()]

    # EOM: last 5 days of month vs rest (aggregate spend)
    month_end = dates + pd.offsets.MonthEnd(0)
    last_5 = (dates >= (month_end - pd.Timedelta(days=4)))
    out["eom_comparison"] = {
        "last_5_days": float(amounts[last_5].sum()),
        "rest_of_month": float(amounts[~last_5].sum()),
    }
    return out
