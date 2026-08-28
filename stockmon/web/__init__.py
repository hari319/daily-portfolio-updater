"""Flask application factory."""

from __future__ import annotations

import logging

from flask import Flask

from ..paths import BASE_DIR, ensure_directories

logger = logging.getLogger(__name__)


def create_app(config: dict | None = None) -> Flask:
    ensure_directories()

    app = Flask(
        __name__,
        template_folder=str(BASE_DIR / "templates"),
        static_folder=str(BASE_DIR / "static"),
    )
    app.config.update(JSON_SORT_KEYS=False, TEMPLATES_AUTO_RELOAD=True)
    if config:
        app.config.update(config)

    from .routes import bp  # imported here to avoid a circular import

    app.register_blueprint(bp)
    logger.info("Flask app created (templates=%s)", app.template_folder)
    return app
