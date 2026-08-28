"""EMA calculation on daily and weekly timeframes.

Weekly candles are derived by resampling the daily series instead of issuing a
second network request; the values match a Friday-anchored weekly chart and the
in-progress week is included so the weekly EMA reflects the live price.
"""

from __future__ import annotations

import logging
from typing import Any, Sequence

import pandas as pd

logger = logging.getLogger(__name__)

# Number of bars, as a multiple of the EMA period, below which the value is
# still returned but flagged as computed on a short history.
RELIABLE_HISTORY_FACTOR = 2

_WEEKLY_AGG = {
    "Open": "first",
    "High": "max",
    "Low": "min",
    "Close": "last",
    "Volume": "sum",
}


def resample_weekly(daily: pd.DataFrame) -> pd.DataFrame:
    """Convert a daily OHLCV frame into Friday-anchored weekly candles."""
    if daily is None or daily.empty:
        return pd.DataFrame()
    columns = {key: how for key, how in _WEEKLY_AGG.items() if key in daily.columns}
    weekly = daily.resample("W-FRI").agg(columns)
    return weekly.dropna(subset=["Close"]) if "Close" in weekly.columns else weekly.dropna(how="all")


def ema_series(close: pd.Series, period: int) -> pd.Series:
    """Standard smoothed EMA (``adjust=False``), matching charting platforms."""
    return close.ewm(span=period, adjust=False, min_periods=period).mean()


def latest_ema(close: pd.Series, period: int, timeframe: str, symbol: str) -> tuple[float | None, str | None]:
    """Return the most recent EMA value and an optional data-quality note.

    When there are fewer bars than *period*, returns ``(None, note)`` — the
    caller renders this as "N/A".  When there are enough bars but fewer than
    ``period * RELIABLE_HISTORY_FACTOR``, the value is still returned normally
    (no indicative flag).
    """
    close = close.dropna() if close is not None else pd.Series(dtype="float64")
    available = len(close)
    if available < period:
        note = (
            f"{period} EMA ({timeframe}) unavailable: only {available} bars, "
            f"{period} required."
        )
        logger.info("%s - %s", symbol, note)
        return None, note

    value = ema_series(close, period).iloc[-1]
    if pd.isna(value):
        note = f"{period} EMA ({timeframe}) could not be computed from the available data."
        logger.warning("%s - %s", symbol, note)
        return None, note

    if available < period * RELIABLE_HISTORY_FACTOR:
        logger.info(
            "%s - %s EMA (%s) computed on limited history (%s bars)",
            symbol, period, timeframe, available,
        )
    return float(value), None


def build_ema_matrix(
    symbol: str,
    price: float | None,
    daily_close: pd.Series,
    weekly_close: pd.Series,
    periods: Sequence[int],
    decimals: int = 2,
) -> tuple[dict[str, Any], list[str]]:
    """Build the per-period daily/weekly cell payload used by the table.

    A value is only marked ``below`` (and therefore rendered in red) when the
    current price sits below that EMA on that timeframe.  When data is
    insufficient to compute an EMA, the cell displays ``"N/A"`` in muted grey.
    """
    matrix: dict[str, Any] = {}
    notes: list[str] = []

    for period in periods:
        cell: dict[str, Any] = {}
        for timeframe, close in (("daily", daily_close), ("weekly", weekly_close)):
            value, note = latest_ema(close, period, timeframe, symbol)
            # Notes from unavailable EMAs are informational only (already logged)
            # and are NOT surfaced as row-level warnings.
            below = value is not None and price is not None and price < value
            cell[timeframe] = {
                "value": round(value, decimals) if value is not None else None,
                "below": bool(below),
                "display": (
                    f"{value:,.{decimals}f}" if below and value is not None
                    else "N/A" if value is None
                    else ""
                ),
                "available": value is not None,
            }
        matrix[str(period)] = cell

    return matrix, notes
