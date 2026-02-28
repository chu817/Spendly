"""Shared helpers: validation, safe parse, constants."""
import logging
from typing import List, Optional

import pandas as pd

logger = logging.getLogger(__name__)

REQUIRED_COLUMNS = [
    "card_id",
    "purchase_date",
    "purchase_amount",
    "category_1",
    "category_2",
    "category_3",
]
OPTIONAL_COLUMNS = ["authorized_flag"]

# Risk bands: (min_score_inclusive, max_score_inclusive, label)
RISK_BANDS = [
    (0, 25, "Low"),
    (26, 50, "Medium"),
    (51, 75, "High"),
    (76, 100, "Critical"),
]

# Cluster id -> profile label for display
PROFILE_LABELS = {
    0: "Steady spender",
    1: "Late-night spender",
    2: "Impulse burst buyer",
    3: "End-of-month splurger",
    4: "Category-loyal spender",
}

# Component names for scoring (must match keys used in scoring.py)
COMPONENT_WEIGHTS = {
    "spike": 0.25,
    "burst": 0.25,
    "eom": 0.20,
    "timing": 0.15,
    "category": 0.15,
}


def validate_required_columns(df: pd.DataFrame) -> None:
    """Raise ValueError if required columns are missing."""
    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")


def validate_date_range(dates: pd.Series) -> tuple:
    """Return (min_date, max_date) from a datetime series. Handles empty/invalid."""
    if dates is None or len(dates) == 0:
        raise ValueError("No valid dates in dataset")
    valid = pd.to_datetime(dates, errors="coerce").dropna()
    if len(valid) == 0:
        raise ValueError("No valid dates after parsing")
    return valid.min(), valid.max()


def safe_parse_date(series: pd.Series) -> pd.Series:
    """Parse to datetime with coerce for invalid values."""
    return pd.to_datetime(series, errors="coerce")


def safe_numeric(series: pd.Series) -> pd.Series:
    """Convert to numeric with coerce for invalid values."""
    return pd.to_numeric(series, errors="coerce")


def get_risk_band(score: float) -> str:
    """Map numeric score (0-100) to risk band label."""
    score = max(0, min(100, score))
    for lo, hi, label in RISK_BANDS:
        if lo <= score <= hi:
            return label
    return "Low"
