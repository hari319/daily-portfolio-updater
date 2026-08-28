"""Small JSON helpers with atomic writes.

The Flask app and the scheduled task both touch the same files, so writes go to
a temporary file first and are then moved into place with ``os.replace`` (atomic
on Windows and POSIX). A readers-never-see-a-half-written-file guarantee is
enough here; the two processes never write the same file concurrently in normal
operation.
"""

from __future__ import annotations

import json
import logging
import os
import tempfile
import threading
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

_WRITE_LOCK = threading.Lock()


def read_json(path: str | Path, default: Any = None) -> Any:
    """Return the parsed JSON at ``path`` or ``default`` when unreadable."""
    path = Path(path)
    try:
        # utf-8-sig tolerates the BOM that Notepad and PowerShell like to add.
        with path.open("r", encoding="utf-8-sig") as handle:
            return json.load(handle)
    except FileNotFoundError:
        return default
    except json.JSONDecodeError:
        logger.error("Corrupt JSON file %s - falling back to defaults", path)
        _quarantine(path)
        return default
    except OSError as exc:
        logger.error("Could not read %s: %s", path, exc)
        return default


def write_json(path: str | Path, payload: Any) -> None:
    """Atomically write ``payload`` as pretty printed JSON to ``path``."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with _WRITE_LOCK:
        handle_fd, tmp_name = tempfile.mkstemp(dir=str(path.parent), suffix=".tmp")
        tmp_path = Path(tmp_name)
        try:
            with os.fdopen(handle_fd, "w", encoding="utf-8") as handle:
                json.dump(payload, handle, indent=2, ensure_ascii=False, default=str)
                handle.flush()
                os.fsync(handle.fileno())
            os.replace(tmp_path, path)
        except BaseException:
            tmp_path.unlink(missing_ok=True)
            raise


def _quarantine(path: Path) -> None:
    """Move a corrupt file aside so the app can regenerate a clean one."""
    try:
        path.replace(path.with_suffix(path.suffix + ".corrupt"))
    except OSError as exc:  # pragma: no cover - best effort only
        logger.warning("Could not quarantine corrupt file %s: %s", path, exc)
