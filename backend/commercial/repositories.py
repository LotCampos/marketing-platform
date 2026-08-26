from typing import Optional
from uuid import UUID

from core.repositories.base import Repository

from .models import ServiceRequest


class ServiceRequestRepository(
    Repository[ServiceRequest, UUID]
):
    """
    Persistence repository for Commercial ServiceRequest entities.

    Persistence concerns remain isolated from the application
    and domain layers.
    """

    def get_by_id(
        self,
        entity_id: UUID,
    ) -> Optional[ServiceRequest]:
        return (
            ServiceRequest.objects
            .filter(id=entity_id)
            .first()
        )

    def add(
        self,
        entity: ServiceRequest,
    ) -> ServiceRequest:
        entity.save(force_insert=True)
        return entity

    def update(
        self,
        entity: ServiceRequest,
    ) -> ServiceRequest:
        raise NotImplementedError(
            "Service requests are not updated through "
            "the initial Commercial creation flow."
        )

    def delete(
        self,
        entity: ServiceRequest,
    ) -> None:
        raise NotImplementedError(
            "Service requests are not physically deleted."
        )