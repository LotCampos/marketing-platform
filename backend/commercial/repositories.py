from typing import Optional
from uuid import UUID

from core.repositories.base import Repository

from .models import (
    Quotation,
    QuotationItem,
    ServiceRequest,
)


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


class QuotationRepository(
    Repository[Quotation, UUID]
):
    """
    Persistence repository for Commercial Quotation entities.

    Handles persistence of quotation headers only.
    Business rules remain in QuotationService.
    """

    def get_by_id(
        self,
        entity_id: UUID,
    ) -> Optional[Quotation]:
        return (
            Quotation.objects
            .filter(id=entity_id)
            .first()
        )

    def add(
        self,
        entity: Quotation,
    ) -> Quotation:
        entity.save(force_insert=True)
        return entity

    def update(
        self,
        entity: Quotation,
    ) -> Quotation:
        entity.save(
            force_update=True
        )
        return entity

    def delete(
        self,
        entity: Quotation,
    ) -> None:
        raise NotImplementedError(
            "Quotations are not physically deleted."
        )


class QuotationItemRepository(
    Repository[QuotationItem, UUID]
):
    """
    Persistence repository for Commercial QuotationItem entities.

    Handles persistence of quotation line items.
    Business rules remain in QuotationService.
    """

    def get_by_id(
        self,
        entity_id: UUID,
    ) -> Optional[QuotationItem]:
        return (
            QuotationItem.objects
            .filter(id=entity_id)
            .first()
        )

    def add(
        self,
        entity: QuotationItem,
    ) -> QuotationItem:
        entity.save(force_insert=True)
        return entity

    def update(
        self,
        entity: QuotationItem,
    ) -> QuotationItem:
        entity.save(
            force_update=True
        )
        return entity

    def delete(
        self,
        entity: QuotationItem,
    ) -> None:
        raise NotImplementedError(
            "Quotation items are not physically deleted."
        )