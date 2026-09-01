"""Stock Status data storage and management.

Persists analysis records (Ticker, Date of Analysis, Price, Base/Bull/Bear targets, Remarks)
into data/stock_status.json.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime
from typing import Any

from .errors import ValidationError
from .jsonstore import read_json, write_json
from .paths import STOCK_STATUS_FILE
from .portfolio import normalize_symbol

logger = logging.getLogger(__name__)


def load_stock_statuses() -> list[dict[str, Any]]:
    """Return the list of saved stock status entries."""
    data = read_json(STOCK_STATUS_FILE, default=[])
    if isinstance(data, list):
        return data
    return []


def save_stock_statuses(items: list[dict[str, Any]]) -> None:
    """Save the list of stock status entries atomically."""
    write_json(STOCK_STATUS_FILE, items)


def add_stock_status(payload: dict[str, Any]) -> dict[str, Any]:
    """Add a new stock status entry and persist it."""
    raw_symbol = payload.get("symbol", "").strip()
    if not raw_symbol:
        raise ValidationError("Ticker symbol is required.")

    symbol = normalize_symbol(raw_symbol)
    name = payload.get("name", "").strip()
    price = payload.get("price_of_analysis")

    try:
        price_val = float(price) if price is not None and price != "" else None
    except (ValueError, TypeError):
        price_val = None

    date_str = payload.get("date_of_analysis")
    if not date_str or not str(date_str).strip():
        date_str = datetime.now().strftime("%Y-%m-%d")
    else:
        date_str = str(date_str).strip()

    base = payload.get("base") or ["", ""]
    bull = payload.get("bull") or ["", ""]
    bear = payload.get("bear") or ["", ""]

    if not isinstance(base, list):
        base = [str(base), ""]
    if not isinstance(bull, list):
        bull = [str(bull), ""]
    if not isinstance(bear, list):
        bear = [str(bear), ""]

    base = [str(base[0]) if len(base) > 0 else "", str(base[1]) if len(base) > 1 else ""]
    bull = [str(bull[0]) if len(bull) > 0 else "", str(bull[1]) if len(bull) > 1 else ""]
    bear = [str(bear[0]) if len(bear) > 0 else "", str(bear[1]) if len(bear) > 1 else ""]

    entry: dict[str, Any] = {
        "id": uuid.uuid4().hex[:12],
        "symbol": symbol,
        "name": name,
        "date_of_analysis": date_str,
        "price_of_analysis": price_val,
        "currency": payload.get("currency", "INR"),
        "base": base,
        "bull": bull,
        "bear": bear,
        "remarks": str(payload.get("remarks", "")).strip(),
        "created_at": datetime.now().isoformat(),
    }

    items = load_stock_statuses()
    items.insert(0, entry)  # Prepend new entries to the top
    save_stock_statuses(items)
    logger.info("Added stock status entry for %s (id=%s)", symbol, entry["id"])
    return entry


def delete_stock_status(item_id: str) -> list[dict[str, Any]]:
    """Delete a stock status entry by id."""
    items = load_stock_statuses()
    new_items = [item for item in items if item.get("id") != item_id]
    save_stock_statuses(new_items)
    logger.info("Deleted stock status entry with id=%s", item_id)
    return new_items


def update_stock_status(item_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    """Update an existing stock status entry by id."""
    items = load_stock_statuses()
    target_item = None
    for item in items:
        if item.get("id") == item_id:
            target_item = item
            break

    if target_item is None:
        raise ValidationError(f"Stock status entry with id '{item_id}' not found.")

    if "name" in payload and payload["name"]:
        target_item["name"] = str(payload["name"]).strip()

    if "price_of_analysis" in payload and payload["price_of_analysis"] is not None and payload["price_of_analysis"] != "":
        try:
            target_item["price_of_analysis"] = float(payload["price_of_analysis"])
        except (ValueError, TypeError):
            pass

    if "date_of_analysis" in payload and payload["date_of_analysis"]:
        target_item["date_of_analysis"] = str(payload["date_of_analysis"]).strip()

    for key in ("base", "bull", "bear"):
        if key in payload:
            val = payload[key]
            if not isinstance(val, list):
                val = [str(val), ""]
            target_item[key] = [
                str(val[0]) if len(val) > 0 else "",
                str(val[1]) if len(val) > 1 else "",
            ]

    if "remarks" in payload:
        target_item["remarks"] = str(payload.get("remarks", "")).strip()

    target_item["updated_at"] = datetime.now().isoformat()
    save_stock_statuses(items)
    logger.info("Updated stock status entry for %s (id=%s)", target_item.get("symbol"), item_id)
    return target_item

