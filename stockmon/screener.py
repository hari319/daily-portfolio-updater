"""Screener service for fetching and caching bigbreakingwire market screener data."""

from __future__ import annotations

import datetime
import json
import logging
import re
from pathlib import Path
from typing import Any

import requests

from .errors import DataFetchError, ValidationError
from .jsonstore import read_json, write_json
from .paths import DATA_DIR, SCREENER_CACHE_FILE, SCREENER_DIR

logger = logging.getLogger(__name__)

SCREENER_URL = "https://bigbreakingwire.in/wp-json/bbw/v1/screener/run"
SCREENER_PAGE_URL = "https://bigbreakingwire.in/screener/"
DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)
REQUEST_TIMEOUT_SECONDS = 90


def get_screener_file_for_date(date_str: str) -> Path:
    """Return the Path to the local JSON file for a given trading date."""
    safe_date = re.sub(r"[^0-9\-]", "_", date_str.strip())
    return SCREENER_DIR / f"screener_{safe_date}.json"


def auto_detect_nonce() -> str | None:
    """Attempt to extract current X-WP-Nonce from the live screener webpage."""
    try:
        resp = requests.get(
            SCREENER_PAGE_URL,
            headers={"User-Agent": DEFAULT_USER_AGENT},
            timeout=15,
        )
        if resp.status_code == 200:
            match = re.search(r"const\s+NONCE\s*=\s*['\"]([a-zA-Z0-9]+)['\"]", resp.text)
            if match:
                return match.group(1)
    except Exception as exc:
        logger.debug("Could not auto-detect nonce: %s", exc)
    return None


def get_or_refresh_nonce(forced: bool = False, manual_nonce: str = "") -> str:
    """Retrieve the active nonce for today, or auto-detect a fresh one and cache it."""
    today_str = datetime.date.today().isoformat()
    now_iso = datetime.datetime.now().astimezone().isoformat()
    index_meta = read_json(SCREENER_CACHE_FILE, default={})
    nonce_info = index_meta.get("nonce_info", {})

    if manual_nonce.strip():
        detected = manual_nonce.strip()
        index_meta["nonce_info"] = {
            "nonce": detected,
            "date": today_str,
            "timestamp": now_iso,
            "source": "manual",
        }
        write_json(SCREENER_CACHE_FILE, index_meta)
        return detected

    # If already cached for today and not forced, reuse it
    if not forced and nonce_info.get("nonce") and nonce_info.get("date") == today_str:
        logger.debug("Using cached nonce '%s' for today (%s)", nonce_info["nonce"], today_str)
        return nonce_info["nonce"]

    # Otherwise auto-detect from the screener site
    logger.info("Auto-detecting fresh X-WP-Nonce from %s...", SCREENER_PAGE_URL)
    detected = auto_detect_nonce()
    if detected:
        index_meta["nonce_info"] = {
            "nonce": detected,
            "date": today_str,
            "timestamp": now_iso,
            "source": "auto",
        }
        write_json(SCREENER_CACHE_FILE, index_meta)
        logger.info("Stored fresh nonce '%s' for %s", detected, today_str)
        return detected

    # Fallback to previously stored nonce if auto-detect was unreachable
    if nonce_info.get("nonce"):
        logger.warning("Auto-detection failed; falling back to previous nonce '%s'", nonce_info["nonce"])
        return nonce_info["nonce"]

    raise ValidationError(
        "Could not auto-detect X-WP-Nonce from https://bigbreakingwire.in/screener/. "
        "Please verify your internet connection or enter the nonce manually."
    )



def list_saved_screener_dates() -> list[dict[str, Any]]:
    """List all locally saved screener dates and their metadata."""
    SCREENER_DIR.mkdir(parents=True, exist_ok=True)
    index_meta = read_json(SCREENER_CACHE_FILE, default={"history": {}})
    history = index_meta.get("history", {})

    saved = []
    for f in SCREENER_DIR.glob("screener_*.json"):
        date_key = f.stem.replace("screener_", "")
        meta = history.get(date_key, {})
        try:
            stat = f.stat()
            file_mtime = datetime.datetime.fromtimestamp(stat.st_mtime).isoformat()
            size = stat.st_size
        except OSError:
            file_mtime = None
            size = 0

        saved.append({
            "date": date_key,
            "filename": f.name,
            "total": meta.get("total", 0),
            "fetched_at": meta.get("fetched_at", file_mtime),
            "file_size": size,
        })

    saved.sort(key=lambda x: x["date"], reverse=True)
    return saved


def load_cached_screener(date_str: str = "") -> dict[str, Any] | None:
    """Load screener data from disk for a given date, or the latest available."""
    SCREENER_DIR.mkdir(parents=True, exist_ok=True)
    index_meta = read_json(SCREENER_CACHE_FILE, default={})

    target_date = date_str.strip() if date_str else index_meta.get("latest_date")
    if not target_date:
        saved_dates = list_saved_screener_dates()
        if saved_dates:
            target_date = saved_dates[0]["date"]

    if not target_date:
        return None

    date_file = get_screener_file_for_date(target_date)
    if not date_file.exists():
        return None

    try:
        data = read_json(date_file)
        if data:
            data["last_fetched_at"] = index_meta.get("history", {}).get(target_date, {}).get(
                "fetched_at", index_meta.get("last_fetched_at")
            )
            data["saved_dates"] = list_saved_screener_dates()
            data["nonce_info"] = index_meta.get("nonce_info", {})
        return data
    except Exception as exc:
        logger.warning("Failed reading screener file %s: %s", date_file, exc)
        return None


def fetch_screener_data(
    nonce: str = "",
    date: str = "",
    search: str = "",
    per_page: int = 5000,
) -> dict[str, Any]:
    """Execute manual POST fetch to bigbreakingwire screener and persist locally."""
    active_nonce = nonce.strip() or get_or_refresh_nonce()
    cleaned_date = (date or "").strip()

    payload = {
        "logic": "ALL",
        "conditions": [],
        "groups": [],
        "date": cleaned_date,
        "search": (search or "").strip(),
        "sort": "symbol",
        "order": "ASC",
        "page": 1,
        "per_page": per_page,
        "companies_only": True,
        "filters": {
            "price_min": "",
            "price_max": "",
            "min_volume": "",
            "min_rvol": "",
            "series": "",
        },
        "preset": "",
        "timeframe": "daily",
        "execution_id": "",
        "intentional_execution": True,
    }

    headers = {
        "Content-Type": "application/json",
        "User-Agent": DEFAULT_USER_AGENT,
        "X-WP-Nonce": active_nonce,
    }

    logger.info(
        "Fetching screener data from %s (date='%s', per_page=%d)",
        SCREENER_URL,
        cleaned_date,
        per_page,
    )

    try:
        response = requests.post(
            SCREENER_URL,
            headers=headers,
            json=payload,
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
    except requests.exceptions.Timeout:
        raise DataFetchError(
            f"The screener request timed out after {REQUEST_TIMEOUT_SECONDS}s. "
            "The external server may be slow or overloaded. Please try again."
        )
    except requests.exceptions.ConnectionError as exc:
        raise DataFetchError(
            f"Could not connect to screener server (bigbreakingwire.in): {exc}"
        )
    except Exception as exc:
        raise DataFetchError(f"Network error during screener fetch: {exc}")

    # Check for authentication / nonce failure and auto-retry once with forced refresh
    if response.status_code in (401, 403) or "rest_cookie_invalid_nonce" in response.text:
        logger.warning(
            "Screener request failed with status %d (nonce invalid/expired). Attempting auto-refresh...",
            response.status_code,
        )
        try:
            active_nonce = get_or_refresh_nonce(forced=True)
            headers["X-WP-Nonce"] = active_nonce
            response = requests.post(
                SCREENER_URL,
                headers=headers,
                json=payload,
                timeout=REQUEST_TIMEOUT_SECONDS,
            )
        except Exception as retry_exc:
            logger.warning("Nonce auto-refresh retry failed: %s", retry_exc)

    if response.status_code in (401, 403) or "rest_cookie_invalid_nonce" in response.text:
        raise ValidationError(
            f"Invalid or expired X-WP-Nonce (HTTP {response.status_code}). "
            "Could not refresh the nonce automatically from the website."
        )

    if response.status_code != 200:
        raise DataFetchError(
            f"Screener request failed with HTTP {response.status_code}: {response.text[:300]}"
        )

    try:
        data = response.json()
    except Exception as exc:
        raise DataFetchError(f"Failed to parse screener JSON response: {exc}")

    if not isinstance(data, dict):
        raise DataFetchError("Unexpected response shape from screener API.")

    effective_date = data.get("date") or cleaned_date or datetime.date.today().isoformat()
    now_iso = datetime.datetime.now().astimezone().isoformat()

    items = data.get("items", [])
    total_count = data.get("total", len(items))

    # Persist the date-specific dataset locally
    SCREENER_DIR.mkdir(parents=True, exist_ok=True)
    date_file = get_screener_file_for_date(effective_date)
    write_json(date_file, data)

    # Update index metadata
    index_meta = read_json(SCREENER_CACHE_FILE, default={"history": {}})
    history = index_meta.get("history", {})
    history[effective_date] = {
        "total": total_count,
        "fetched_at": now_iso,
        "file": date_file.name,
    }

    index_meta["last_fetched_at"] = now_iso
    index_meta["latest_date"] = effective_date
    index_meta["available_dates"] = data.get("dates", [])
    index_meta["history"] = history
    write_json(SCREENER_CACHE_FILE, index_meta)

    logger.info(
        "Successfully fetched and cached %d screener stocks for date %s",
        total_count,
        effective_date,
    )

    data["last_fetched_at"] = now_iso
    data["saved_dates"] = list_saved_screener_dates()
    data["nonce_info"] = index_meta.get("nonce_info", {})
    return data
