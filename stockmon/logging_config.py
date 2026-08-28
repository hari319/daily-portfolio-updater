"""Central logging configuration.

Both entry points (``app.py`` and ``scheduled_run.py``) call
:func:`configure_logging` once with their own log file so web activity and
scheduled runs stay in separate, rotating files.
"""

from __future__ import annotations

import logging
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path

from .paths import ADDITIONS_LOG_FILE, APP_LOG_FILE, ensure_directories

_CONFIGURED = False
_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"


def configure_logging(
    log_file: str | Path = APP_LOG_FILE,
    level: int = logging.INFO,
    console: bool = True,
) -> None:
    """Attach a rotating file handler (and optionally a console handler)."""
    global _CONFIGURED
    if _CONFIGURED:
        return

    ensure_directories()
    formatter = logging.Formatter(_FORMAT)
    root = logging.getLogger()
    root.setLevel(level)

    file_handler = RotatingFileHandler(
        Path(log_file), maxBytes=2_000_000, backupCount=5, encoding="utf-8"
    )
    file_handler.setFormatter(formatter)
    root.addHandler(file_handler)

    if console:
        stream_handler = logging.StreamHandler(sys.stdout)
        stream_handler.setFormatter(formatter)
        root.addHandler(stream_handler)

    # yfinance/urllib3 are extremely chatty at DEBUG/INFO level.
    logging.getLogger("yfinance").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("peewee").setLevel(logging.WARNING)

    _CONFIGURED = True


def get_additions_logger() -> logging.Logger:
    """Dedicated audit log of tickers added through the UI."""
    logger = logging.getLogger("stockmon.additions")
    if not logger.handlers:
        ensure_directories()
        handler = RotatingFileHandler(
            ADDITIONS_LOG_FILE, maxBytes=500_000, backupCount=3, encoding="utf-8"
        )
        handler.setFormatter(logging.Formatter("%(asctime)s | %(message)s"))
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger
