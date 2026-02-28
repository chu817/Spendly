"""
Impulse risk score (0-100) from behavioural features.
Weighted composite of normalized components; risk band; breakdown for explainability.
"""
from typing import Dict, Any, Optional, Tuple

from src.utils import COMPONENT_WEIGHTS, get_risk_band


def _normalize(x: float, low: float, high: float) -> float:
    """Clamp and scale to [0, 1]."""
    if high <= low:
        return 0.0
    return max(0.0, min(1.0, (x - low) / (high - low)))


def compute_score(
    features: Dict[str, Any],
    calibration: Optional[Dict[str, float]] = None,
) -> Tuple[float, Dict[str, float], str]:
    """
    Compute impulse risk score (0-100), component breakdown (name -> 0-1 contribution), and risk_band.
    Uses fixed normalization bounds so scores are interpretable.
    """
    # Normalize each component to 0-1 (higher = more impulsive)
    cal = calibration or {}
    spike_hi = float(cal.get("spike_p95", 5.0))
    burst_max2h_hi = float(cal.get("max_tx_in_2h_p95", 20.0))
    eom_hi = float(cal.get("eom_ratio_p95", 3.0))
    entropy_hi = float(cal.get("hour_entropy_p95", 4.0))
    diversity_hi = float(cal.get("category_diversity_p95", 10.0))

    # Spike: 0 to p95 spike intensity -> 0-1
    spike_n = _normalize(float(features.get("spike_intensity", 0) or 0), 0, spike_hi)
    # Burst: ratio 0-1, and max_tx_in_2h e.g. 0-20 -> 0-1
    burst_ratio = features.get("burst_ratio_30min", 0) or 0
    max_2h = float(features.get("max_tx_in_2h", 0) or 0)
    burst_n = 0.6 * min(1.0, float(burst_ratio)) + 0.4 * _normalize(min(max_2h, burst_max2h_hi), 0, burst_max2h_hi)
    # EOM: ratio 0 to p95 -> 0-1
    eom_spend = features.get("eom_spend_ratio", 0) or 0
    eom_count = features.get("eom_count_ratio", 0) or 0
    eom_n = _normalize(float(max(eom_spend, eom_count)), 0, eom_hi)
    # Timing: late_night 0-1, weekend 0-1, low entropy = more impulsive (1 - entropy/entropy_hi)
    late = features.get("late_night_ratio", 0) or 0
    weekend = features.get("weekend_ratio", 0) or 0
    ent = min(entropy_hi, float(features.get("hour_entropy", 0) or 0))
    timing_n = (float(late) * 0.4 + float(weekend) * 0.3 + (1 - ent / max(entropy_hi, 1e-9)) * 0.3)
    # Category: high concentration + low diversity = impulsive
    conc = features.get("category_concentration", 0) or 0
    div = features.get("category_diversity", 0) or 0
    div_cap = max(3.0, diversity_hi)
    low_div_score = _normalize(div_cap - min(float(div), div_cap), 0, div_cap)
    category_n = float(conc) * 0.6 + low_div_score * 0.4

    weights = COMPONENT_WEIGHTS
    breakdown = {
        "spike": spike_n,
        "burst": burst_n,
        "eom": eom_n,
        "timing": timing_n,
        "category": category_n,
    }
    score = (
        weights["spike"] * breakdown["spike"]
        + weights["burst"] * breakdown["burst"]
        + weights["eom"] * breakdown["eom"]
        + weights["timing"] * breakdown["timing"]
        + weights["category"] * breakdown["category"]
    ) * 100
    score = max(0.0, min(100.0, score))
    risk_band = get_risk_band(score)
    return round(score, 1), breakdown, risk_band
