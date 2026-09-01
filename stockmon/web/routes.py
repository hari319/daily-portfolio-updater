"""HTTP routes for the portfolio monitor UI and its JSON/SSE endpoints."""

from __future__ import annotations

import json
import logging
import threading
import time
from typing import Any

from flask import (
    Blueprint,
    Response,
    jsonify,
    render_template,
    request,
    send_from_directory,
    stream_with_context,
)

from .. import status as status_store
from ..config_manager import get_run_times, load_settings, set_run_times
from ..errors import ValidationError
from ..data_fetcher import fetch_ticker_quote
from ..paths import BASE_DIR
from ..portfolio import (
    PORTFOLIO_NAMES,
    add_ticker,
    load_portfolios,
    normalize_symbol,
    record_addition,
    remove_ticker,
    validate_portfolio,
)
from concurrent.futures import ThreadPoolExecutor
from ..service import build_row, drop_row, load_snapshot, refresh_portfolios, upsert_row
from ..stock_status import add_stock_status, delete_stock_status, load_stock_statuses, update_stock_status

logger = logging.getLogger(__name__)

bp = Blueprint("main", __name__)

# Guards against overlapping refreshes triggered by impatient clicking.
_REFRESH_LOCK = threading.Lock()

SSE_MAX_SECONDS = 300
SSE_TICK_SECONDS = 2


def _render_tables(snapshot: dict[str, Any]) -> str:
    try:
        return render_template(
            "_tables.html",
            snapshot=snapshot,
            portfolio_names=PORTFOLIO_NAMES,
            periods=snapshot.get("ema_periods", load_settings()["data"]["ema_periods"]),
        )
    except Exception:
        return ""


def _tables_payload(snapshot: dict[str, Any] | None = None, message: str = "") -> dict[str, Any]:
    snapshot = snapshot if snapshot is not None else load_snapshot()
    status = status_store.read_status()
    return {
        "ok": True,
        "message": message,
        "html": _render_tables(snapshot),
        "generated_at": snapshot.get("generated_at"),
        "source": snapshot.get("source"),
        "stats": snapshot.get("stats", {}),
        "errors": snapshot.get("errors", []),
        "version": status["version"],
        "status": status,
        "snapshot": snapshot,
    }


@bp.app_errorhandler(ValidationError)
def _handle_validation_error(exc: ValidationError):
    return jsonify({"ok": False, "error": str(exc)}), 400


@bp.route("/")
def index():
    dist_index = BASE_DIR / "frontend" / "dist" / "index.html"
    if dist_index.exists():
        return send_from_directory(str(BASE_DIR / "frontend" / "dist"), "index.html")

    settings = load_settings()
    snapshot = load_snapshot()
    return render_template(
        "index.html",
        snapshot=snapshot,
        settings=settings,
        portfolio_names=PORTFOLIO_NAMES,
        periods=snapshot.get("ema_periods", settings["data"]["ema_periods"]),
        run_times=get_run_times(),
        status=status_store.read_status(),
        poll_seconds=int(settings["ui"].get("status_poll_seconds", 5)),
    )


@bp.get("/api/data")
def api_data():
    """Raw snapshot, useful for debugging or external tooling."""
    return jsonify(load_snapshot())


@bp.get("/api/tables")
def api_tables():
    return jsonify(_tables_payload())


@bp.get("/api/status")
def api_status():
    return jsonify(status_store.read_status())


@bp.post("/api/refresh")
def api_refresh():
    if not _REFRESH_LOCK.acquire(blocking=False):
        return jsonify({"ok": False, "error": "A refresh is already running. Please wait."}), 409
    try:
        snapshot = refresh_portfolios(source="manual")
    except Exception as exc:
        logger.exception("Manual refresh failed")
        return jsonify({"ok": False, "error": f"Refresh failed: {exc}"}), 500
    finally:
        _REFRESH_LOCK.release()

    stats = snapshot["stats"]
    message = f"Refreshed {stats['ok']}/{stats['total']} ticker(s)."
    if stats["failed"]:
        message += f" {stats['failed']} failed - see the errors panel."
    return jsonify(_tables_payload(snapshot, message))


@bp.post("/api/tickers")
def api_add_ticker():
    payload = request.get_json(silent=True) or request.form
    portfolio = validate_portfolio(payload.get("portfolio", ""))
    symbol = normalize_symbol(payload.get("symbol", ""))

    if symbol in load_portfolios()[portfolio]:
        raise ValidationError(f"{symbol} is already in the {portfolio} portfolio.")

    # Fetch immediately so the row appears without waiting for a scheduled run.
    row = build_row(symbol)
    if row["error"]:
        raise ValidationError(
            f"Could not fetch data for {symbol} ({row['error']}). The ticker was not added."
        )

    add_ticker(portfolio, symbol)
    record_addition(portfolio, symbol)
    snapshot = upsert_row(portfolio, row)

    return jsonify(_tables_payload(snapshot, f"{symbol} added to {portfolio} and fetched live."))


@bp.delete("/api/tickers")
def api_remove_ticker():
    payload = request.get_json(silent=True) or request.form
    portfolio = validate_portfolio(payload.get("portfolio", ""))
    symbol = remove_ticker(portfolio, payload.get("symbol", ""))
    snapshot = drop_row(portfolio, symbol)
    return jsonify(_tables_payload(snapshot, f"{symbol} removed from {portfolio}."))


@bp.get("/api/schedule")
def api_get_schedule():
    settings = load_settings()
    return jsonify(
        {
            "ok": True,
            "run_times": get_run_times(),
            "task_name": settings["schedule"].get("task_name"),
            "timezone": settings["schedule"].get("timezone"),
        }
    )


@bp.post("/api/schedule")
def api_set_schedule():
    payload = request.get_json(silent=True) or request.form
    times = payload.get("run_times")
    if times is None:
        times = [payload.get("run_time_1"), payload.get("run_time_2")]
    if isinstance(times, str):
        times = [part.strip() for part in times.split(",") if part.strip()]

    run_times = set_run_times(times)
    return jsonify(
        {
            "ok": True,
            "run_times": run_times,
            "message": f"Scheduled run times updated to {', '.join(run_times)} and synced with Windows Task Scheduler.",
        }
    )


@bp.get("/api/stream")
def api_stream():
    """Server-Sent Events feed that fires whenever the status version changes."""

    @stream_with_context
    def event_source():
        last_version = request.args.get("version", type=int)
        if last_version is None:
            last_version = status_store.read_status()["version"]
        deadline = time.monotonic() + SSE_MAX_SECONDS
        yield f"retry: {SSE_TICK_SECONDS * 1000}\n\n"
        while time.monotonic() < deadline:
            status = status_store.read_status()
            if status["version"] != last_version:
                last_version = status["version"]
                yield f"event: update\ndata: {json.dumps(status)}\n\n"
            else:
                yield ": keep-alive\n\n"
            time.sleep(SSE_TICK_SECONDS)

    return Response(
        event_source(),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@bp.get("/api/stock-info")
def api_stock_info():
    symbol = request.args.get("symbol", "").strip()
    if not symbol:
        return jsonify({"ok": False, "error": "Symbol query parameter is required."}), 400
    try:
        normalized = normalize_symbol(symbol)
        quote = fetch_ticker_quote(normalized)
        return jsonify({"ok": True, **quote})
    except Exception as exc:
        logger.warning("Failed to fetch stock info for %s: %s", symbol, exc)
        return jsonify({"ok": False, "error": str(exc)}), 400


@bp.get("/api/stock-status")
def api_get_stock_status():
    items = load_stock_statuses()
    return jsonify({"ok": True, "items": items})


@bp.post("/api/stock-status")
def api_add_stock_status():
    payload = request.get_json(silent=True) or request.form
    if not payload:
        return jsonify({"ok": False, "error": "Invalid request payload."}), 400
    try:
        entry = add_stock_status(payload)
        items = load_stock_statuses()
        return jsonify(
            {
                "ok": True,
                "entry": entry,
                "items": items,
                "message": f"Stock status for {entry['symbol']} saved successfully.",
            }
        )
    except ValidationError as exc:
        return jsonify({"ok": False, "error": str(exc)}), 400
    except Exception as exc:
        logger.exception("Failed to save stock status")
        return jsonify({"ok": False, "error": f"Failed to save stock status: {exc}"}), 500


@bp.delete("/api/stock-status/<item_id>")
def api_delete_stock_status(item_id: str):
    try:
        items = delete_stock_status(item_id)
        return jsonify({"ok": True, "items": items, "message": "Stock status removed."})
    except Exception as exc:
        logger.exception("Failed to delete stock status %s", item_id)
        return jsonify({"ok": False, "error": f"Failed to delete stock status: {exc}"}), 500


@bp.put("/api/stock-status/<item_id>")
def api_update_stock_status(item_id: str):
    payload = request.get_json(silent=True) or request.form
    if not payload:
        return jsonify({"ok": False, "error": "Invalid request payload."}), 400
    try:
        entry = update_stock_status(item_id, payload)
        items = load_stock_statuses()
        return jsonify(
            {
                "ok": True,
                "entry": entry,
                "items": items,
                "message": f"Stock status for {entry.get('symbol')} updated successfully.",
            }
        )
    except ValidationError as exc:
        return jsonify({"ok": False, "error": str(exc)}), 400
    except Exception as exc:
        logger.exception("Failed to update stock status %s", item_id)
        return jsonify({"ok": False, "error": f"Failed to update stock status: {exc}"}), 500


@bp.post("/api/stock-quotes")
def api_stock_quotes():
    """Fetch live quotes in parallel for a list of symbols."""
    payload = request.get_json(silent=True) or {}
    raw_symbols = payload.get("symbols", [])
    if isinstance(raw_symbols, str):
        raw_symbols = [s.strip() for s in raw_symbols.split(",") if s.strip()]

    symbols = [normalize_symbol(s) for s in raw_symbols if s]
    if not symbols:
        return jsonify({"ok": True, "quotes": {}})

    results = {}
    unique_symbols = sorted(set(symbols))
    with ThreadPoolExecutor(max_workers=min(8, len(unique_symbols))) as executor:
        futures = {executor.submit(fetch_ticker_quote, sym): sym for sym in unique_symbols}
        for future in futures:
            sym = futures[future]
            try:
                quote = future.result()
                results[sym] = quote
            except Exception as exc:
                logger.info("Quote fetch failed for %s: %s", sym, exc)
                results[sym] = {"symbol": sym, "error": str(exc), "price": None}

    return jsonify({"ok": True, "quotes": results})


