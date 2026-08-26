from django.db import transaction

from core.services.unit_of_work import UnitOfWork


class DjangoUnitOfWork(UnitOfWork):
    """
    Django implementation of the UI-CADO Unit of Work.

    The transaction boundary is owned by the application service layer.
    """

    def __init__(self) -> None:
        self._transaction = None

    def __enter__(self) -> "DjangoUnitOfWork":
        self._transaction = transaction.atomic()
        self._transaction.__enter__()
        return self

    def __exit__(
        self,
        exc_type,
        exc_value,
        traceback,
    ):
        return self._transaction.__exit__(
            exc_type,
            exc_value,
            traceback,
        )

    def commit(self) -> None:
        """
        Commit is controlled by the atomic transaction context.

        Explicit commit is therefore intentionally unsupported.
        """
        raise RuntimeError(
            "DjangoUnitOfWork.commit() is managed by transaction.atomic()."
        )

    def rollback(self) -> None:
        """
        Rollback is controlled by the atomic transaction context.

        Explicit rollback is therefore intentionally unsupported.
        """
        raise RuntimeError(
            "DjangoUnitOfWork.rollback() is managed by transaction.atomic()."
        )