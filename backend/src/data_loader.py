"""CSV validation, chunked ingestion, and dataset storage keyed by dataset_id."""
import logging
import tempfile
import uuid
from pathlib import Path
from typing import Any, List, Optional, Tuple, Union

import pandas as pd

from src.utils import (
    REQUIRED_COLUMNS,
    safe_numeric,
    safe_parse_date,
    validate_required_columns,
    validate_date_range,
)

logger = logging.getLogger(__name__)

# In-memory store: dataset_id -> { "df": DataFrame, "summary": {...} }
_datasets: dict[str, dict[str, Any]] = {}

# Max rows to load per dataset (avoid OOM on huge CSV)
MAX_ROWS_DEFAULT = 500_000


def _ensure_columns_and_parse(df: pd.DataFrame) -> pd.DataFrame:
    """Ensure required columns exist and parse dates/amounts. Drops rows with invalid dates."""
    validate_required_columns(df)
    out = df.copy()
    out["purchase_date"] = safe_parse_date(out["purchase_date"])
    out["purchase_amount"] = safe_numeric(out["purchase_amount"])
    out = out.dropna(subset=["purchase_date"])
    return out


def load_csv_chunked(
    file_path: Union[str, Path],
    chunk_size: int = 100_000,
    max_rows: Optional[int] = None,
) -> Tuple[pd.DataFrame, int, List[str], Tuple[str, str]]:
    """
    Load CSV in chunks. Returns (df, total_rows, unique_card_ids, (min_date, max_date)).
    If max_rows is set, stops after that many rows.
    """
    max_rows = max_rows or MAX_ROWS_DEFAULT
    chunks: List[pd.DataFrame] = []
    total = 0
    for chunk in pd.read_csv(file_path, chunksize=chunk_size, low_memory=False):
        chunk = chunk[[c for c in REQUIRED_COLUMNS if c in chunk.columns]]
        if chunk.empty:
            continue
        chunk = _ensure_columns_and_parse(chunk)
        chunks.append(chunk)
        total += len(chunk)
        if total >= max_rows:
            break
    if not chunks:
        raise ValueError("No valid rows after parsing")
    df = pd.concat(chunks, ignore_index=True)
    if total > max_rows:
        df = df.iloc[:max_rows]
    dates = df["purchase_date"]
    validate_date_range(dates)
    min_d, max_d = dates.min(), dates.max()
    date_range = (min_d.strftime("%Y-%m-%d"), max_d.strftime("%Y-%m-%d"))
    card_ids = df["card_id"].astype(str).unique().tolist()
    return df, len(df), card_ids, date_range


def load_upload(
    file_path: Union[str, Path],
    chunk_size: int = 100_000,
    max_rows: Optional[int] = None,
) -> Tuple[str, int, int, Tuple[str, str], pd.DataFrame]:
    """
    Load CSV from path, store in _datasets, return (dataset_id, rows, n_users, date_range, df).
    """
    df, rows, card_ids, date_range = load_csv_chunked(file_path, chunk_size=chunk_size, max_rows=max_rows)
    n_users = len(card_ids)
    dataset_id = str(uuid.uuid4())
    _datasets[dataset_id] = {
        "df": df,
        "summary": {"rows": rows, "users": n_users, "date_range": date_range, "card_ids": card_ids},
    }
    return dataset_id, rows, n_users, date_range, df


def load_demo(demo_path: str, max_rows: Optional[int] = None) -> Tuple[str, int, int, Tuple[str, str]]:
    """Load demo dataset from path. Returns (dataset_id, rows, n_users, date_range)."""
    path = Path(demo_path)
    if not path.exists():
        raise FileNotFoundError(f"Demo dataset not found: {demo_path}")
    dataset_id, rows, n_users, date_range, _ = load_upload(path, max_rows=max_rows or MAX_ROWS_DEFAULT)
    return dataset_id, rows, n_users, date_range


def get_dataset(dataset_id: str) -> Optional[pd.DataFrame]:
    """Return the DataFrame for dataset_id or None."""
    entry = _datasets.get(dataset_id)
    if entry is None:
        return None
    return entry["df"]


def get_summary(dataset_id: str) -> Optional[dict]:
    """Return summary dict for dataset_id or None."""
    entry = _datasets.get(dataset_id)
    if entry is None:
        return None
    return entry["summary"]


def get_user_transactions(dataset_id: str, card_id: str) -> Optional[pd.DataFrame]:
    """Return transactions for one card_id in the dataset."""
    df = get_dataset(dataset_id)
    if df is None:
        return None
    return df[df["card_id"].astype(str) == str(card_id)].copy()


def get_users_list(dataset_id: str) -> Optional[List[dict]]:
    """Return list of { card_id, tx_count, date_range } for the dataset."""
    summary = get_summary(dataset_id)
    if summary is None:
        return None
    df = get_dataset(dataset_id)
    if df is None:
        return None
    agg = df.groupby("card_id").agg(
        tx_count=("purchase_date", "count"),
        min_date=("purchase_date", "min"),
        max_date=("purchase_date", "max"),
    ).reset_index()
    users = []
    for _, row in agg.iterrows():
        users.append({
            "card_id": str(row["card_id"]),
            "tx_count": int(row["tx_count"]),
            "date_range": (row["min_date"].strftime("%Y-%m-%d"), row["max_date"].strftime("%Y-%m-%d")),
        })
    return users
