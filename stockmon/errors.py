"""Application specific exceptions."""

from __future__ import annotations


class StockMonError(Exception):
    """Base class for all application errors."""


class ValidationError(StockMonError):
    """Raised when user supplied input (ticker, time, portfolio) is invalid."""


class DataFetchError(StockMonError):
    """Raised when market data cannot be retrieved for a ticker."""

    def __init__(self, symbol: str, message: str) -> None:
        super().__init__(f"{symbol}: {message}")
        self.symbol = symbol
        self.message = message
