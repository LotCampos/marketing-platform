from __future__ import annotations

from contextvars import ContextVar
from dataclasses import dataclass
from uuid import UUID


@dataclass(frozen=True, slots=True)
class RequestContext:
    """
    Immutable execution context propagated through the application layer.

    This context does not grant authorization and does not replace
    authenticated identity. It only carries execution metadata.
    """

    correlation_id: UUID
    request_id: UUID | None = None
    actor_id: UUID | None = None


_current_context: ContextVar[RequestContext | None] = ContextVar(
    "ui_cado_request_context",
    default=None,
)


def set_request_context(context: RequestContext) -> None:
    _current_context.set(context)


def get_request_context() -> RequestContext | None:
    return _current_context.get()


def clear_request_context() -> None:
    _current_context.set(None)