"""Application specific exceptions."""

from __future__ import annotations


class StockMonError(Exception):
    """Base class for all application errors."""


class ValidationError(StockMonError):
    """Raised when user supplied input (ticker, time, portfolio) is invalid."""


class DataFetchError(StockMonError):
    """Raised when market data cannot be retrieved for a ticker or service."""

    def __init__(self, symbol_or_message: str, message: str | None = None) -> None:
        if message is not None:
            self.symbol = symbol_or_message
            self.message = message
            super().__init__(f"{symbol_or_message}: {message}")
        else:
            self.symbol = ""
            self.message = symbol_or_message
            super().__init__(symbol_or_message)
