"""Portfolio membership: validation, persistence and TradingView links."""

from __future__ import annotations

import logging
import re
from datetime import datetime, timezone
from typing import Any
from urllib.parse import quote

from .config_manager import load_settings
from .errors import ValidationError
from .jsonstore import read_json, write_json
from .logging_config import get_additions_logger
from .paths import PENDING_ADDITIONS_FILE, PORTFOLIOS_FILE, ensure_directories

logger = logging.getLogger(__name__)

PORTFOLIO_NAMES = ("BAPA", "MADI")

DEFAULT_PORTFOLIOS: dict[str, list[str]] = {
    "BAPA": ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS"],
    "MADI": ["INFY.NS", "ITC.NS", "CARTRADE.NS"],
}

# NSE/BSE tickers such as M&M.NS, BAJAJ-AUTO.NS, 500325.BO or the index ^NSEI.
SYMBOL_PATTERN = re.compile(r"^\^?[A-Z0-9][A-Z0-9&\-_]{0,19}(\.(NS|BO))?$")

EXCHANGE_BY_SUFFIX = {".NS": "NSE", ".BO": "BSE"}


def normalize_symbol(raw: str) -> str:
    """Upper-case a ticker and append the default exchange suffix if missing."""
    if raw is None:
        raise ValidationError("Ticker symbol is required.")
    symbol = str(raw).strip().upper().replace(" ", "")
    if not symbol:
        raise ValidationError("Ticker symbol is required.")
    if not SYMBOL_PATTERN.match(symbol):
        raise ValidationError(
            f"'{symbol}' is not a valid ticker. Use letters/digits, e.g. RELIANCE or RELIANCE.NS."
        )
    if not symbol.startswith("^") and "." not in symbol:
        suffix = load_settings()["data"].get("default_exchange_suffix", ".NS")
        symbol = f"{symbol}{suffix}"
    return symbol


def validate_portfolio(name: str) -> str:
    portfolio = str(name or "").strip().upper()
    if portfolio not in PORTFOLIO_NAMES:
        raise ValidationError(
            f"Unknown portfolio '{name}'. Expected one of: {', '.join(PORTFOLIO_NAMES)}."
        )
    return portfolio


def display_name(symbol: str) -> str:
    """Ticker without the exchange suffix, for table display."""
    for suffix in EXCHANGE_BY_SUFFIX:
        if symbol.endswith(suffix):
            return symbol[: -len(suffix)]
    return symbol


def tradingview_url(symbol: str) -> str:
    """Chart URL for the ticker on TradingView."""
    base = display_name(symbol).lstrip("^")
    exchange = next(
        (name for suffix, name in EXCHANGE_BY_SUFFIX.items() if symbol.endswith(suffix)),
        "NSE",
    )
    return f"https://www.tradingview.com/chart/?symbol={quote(f'{exchange}:{base}')}"


def load_portfolios() -> dict[str, list[str]]:
    """Return both portfolios, creating the file with defaults when absent."""
    ensure_directories()
    stored = read_json(PORTFOLIOS_FILE, default=None)
    if stored is None:
        logger.info("No portfolio file found, seeding defaults at %s", PORTFOLIOS_FILE)
        write_json(PORTFOLIOS_FILE, DEFAULT_PORTFOLIOS)
        return {name: list(tickers) for name, tickers in DEFAULT_PORTFOLIOS.items()}

    if not isinstance(stored, dict):
        logger.error("Malformed portfolio file %s - using defaults", PORTFOLIOS_FILE)
        return {name: list(tickers) for name, tickers in DEFAULT_PORTFOLIOS.items()}

    portfolios: dict[str, list[str]] = {}
    for name in PORTFOLIO_NAMES:
        raw = stored.get(name, [])
        if not isinstance(raw, list):
            logger.warning("Portfolio %s is not a list in config - treating as empty", name)
            raw = []
        cleaned: list[str] = []
        for item in raw:
            try:
                symbol = normalize_symbol(item)
            except ValidationError as exc:
                logger.warning("Dropping invalid ticker in %s: %s", name, exc)
                continue
            if symbol not in cleaned:
                cleaned.append(symbol)
        portfolios[name] = cleaned
    return portfolios


def save_portfolios(portfolios: dict[str, list[str]]) -> None:
    write_json(PORTFOLIOS_FILE, portfolios)


def add_ticker(portfolio_name: str, raw_symbol: str) -> str:
    """Validate and append a ticker. Raises :class:`ValidationError` on duplicates."""
    portfolio = validate_portfolio(portfolio_name)
    symbol = normalize_symbol(raw_symbol)

    portfolios = load_portfolios()
    if symbol in portfolios[portfolio]:
        raise ValidationError(f"{symbol} is already in the {portfolio} portfolio.")

    portfolios[portfolio].append(symbol)
    save_portfolios(portfolios)
    logger.info("Added %s to %s", symbol, portfolio)
    return symbol


def remove_ticker(portfolio_name: str, raw_symbol: str) -> str:
    portfolio = validate_portfolio(portfolio_name)
    symbol = normalize_symbol(raw_symbol)

    portfolios = load_portfolios()
    if symbol not in portfolios[portfolio]:
        raise ValidationError(f"{symbol} is not in the {portfolio} portfolio.")

    portfolios[portfolio].remove(symbol)
    save_portfolios(portfolios)
    _forget_pending_addition(portfolio, symbol)
    logger.info("Removed %s from %s", symbol, portfolio)
    return symbol


def _forget_pending_addition(portfolio_name: str, symbol: str) -> None:
    """Drop a queued addition so the next scheduled run does not report it."""
    pending = peek_pending_additions()
    remaining = [
        entry
        for entry in pending
        if not (entry.get("symbol") == symbol and entry.get("portfolio") == portfolio_name)
    ]
    if len(remaining) != len(pending):
        write_json(PENDING_ADDITIONS_FILE, remaining)


def record_addition(portfolio_name: str, symbol: str) -> None:
    """Log an addition so the next scheduled run can report what it picked up."""
    entry = {
        "portfolio": portfolio_name,
        "symbol": symbol,
        "added_at": datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds"),
    }
    pending = read_json(PENDING_ADDITIONS_FILE, default=[])
    if not isinstance(pending, list):
        pending = []
    pending.append(entry)
    write_json(PENDING_ADDITIONS_FILE, pending)
    get_additions_logger().info("ADDED %s to %s", symbol, portfolio_name)


def consume_pending_additions() -> list[dict[str, Any]]:
    """Return and clear the tickers added since the previous scheduled run."""
    pending = read_json(PENDING_ADDITIONS_FILE, default=[])
    if not isinstance(pending, list):
        pending = []
    if pending:
        write_json(PENDING_ADDITIONS_FILE, [])
    return pending


def peek_pending_additions() -> list[dict[str, Any]]:
    pending = read_json(PENDING_ADDITIONS_FILE, default=[])
    return pending if isinstance(pending, list) else []
