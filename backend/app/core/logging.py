"""
app/core/logging.py
Structured logging configuration using structlog.
All modules should call `get_logger(__name__)` instead of stdlib logging.
"""

import logging
import sys

import structlog


def configure_logging(debug: bool = False) -> None:
    """Configure structlog + stdlib logging integration."""
    level = logging.DEBUG if debug else logging.INFO

    # Configure Python stdlib logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=level,
    )

    # Shared processors for both development and production
    shared_processors: list[structlog.types.Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
    ]

    structlog.configure(
        processors=[
            *shared_processors,
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        wrapper_class=structlog.make_filtering_bound_logger(level),
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str) -> structlog.BoundLogger:
    """Return a bound structlog logger with the given name."""
    return structlog.get_logger(name)
