class UICadoError(Exception):
    """Base exception for UI CADO."""


class DomainError(UICadoError):
    """Business/domain rule violation."""


class InvariantViolation(DomainError):
    """A system invariant has been violated."""


class ApplicationError(UICadoError):
    """Application/service-layer failure."""


class ConcurrencyError(ApplicationError):
    """Optimistic concurrency conflict."""


class IdempotencyError(ApplicationError):
    """Idempotency contract violation."""


class AuthorizationError(ApplicationError):
    """Authorization failure."""


class ValidationError(ApplicationError):
    """Application-level validation failure."""