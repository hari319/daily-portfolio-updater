"""Shared status file used to signal "new data available".

The scheduled task and the Flask app are separate processes, so they coordinate
through ``data/status.json``. Every successful refresh increments ``version``;
the browser watches that number over SSE (or polling) and reloads the tables
when it changes.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from .jsonstore import read_json, write_json
from .paths import STATUS_FILE

logger = logging.getLogger(__name__)

_EMPTY_STATUS: dict[str, Any] = {
    "version": 0,
    "updated_at": None,
    "source": None,
    "message": "No refresh has run yet.",
    "summary": {},
}


def read_status() -> dict[str, Any]:
    status = read_json(STATUS_FILE, default=None)
    if not isinstance(status, dict):
        return dict(_EMPTY_STATUS)
    merged = dict(_EMPTY_STATUS)
    merged.update(status)
    try:
        merged["version"] = int(merged.get("version") or 0)
    except (TypeError, ValueError):
        merged["version"] = 0
    return merged


def bump(source: str, message: str = "", summary: dict[str, Any] | None = None) -> dict[str, Any]:
    """Publish a new data version. Returns the written status document."""
    current = read_status()
    status = {
        "version": current["version"] + 1,
        "updated_at": datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds"),
        "source": source,
        "message": message,
        "summary": summary or {},
    }
    write_json(STATUS_FILE, status)
    logger.info("Status v%s published (source=%s) %s", status["version"], source, message)
    return status
