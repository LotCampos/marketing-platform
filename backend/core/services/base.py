from abc import ABC, abstractmethod
from typing import Generic, TypeVar


RequestDTO = TypeVar("RequestDTO")
ResponseDTO = TypeVar("ResponseDTO")


class ApplicationService(
    ABC,
    Generic[RequestDTO, ResponseDTO],
):
    """
    Base contract for UI-CADO application services.

    Services contain application orchestration and domain coordination.
    They must not depend on HTTP, serializers, views, or presentation logic.
    """

    @abstractmethod
    def execute(self, request: RequestDTO) -> ResponseDTO:
        """
        Execute the application service operation.
        """
        raise NotImplementedError