from abc import ABC, abstractmethod


class UnitOfWork(ABC):
    """
    Transaction boundary for UI-CADO application services.

    Implementations are responsible for controlling the transaction
    lifecycle and coordinating persistence operations.
    """

    @abstractmethod
    def __enter__(self):
        """
        Open the unit of work.
        """
        raise NotImplementedError

    @abstractmethod
    def __exit__(
        self,
        exc_type,
        exc_value,
        traceback,
    ):
        """
        Close the unit of work.
        """
        raise NotImplementedError

    @abstractmethod
    def commit(self) -> None:
        """
        Commit the current transaction.
        """
        raise NotImplementedError

    @abstractmethod
    def rollback(self) -> None:
        """
        Roll back the current transaction.
        """
        raise NotImplementedError