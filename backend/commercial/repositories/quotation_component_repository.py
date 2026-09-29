from uuid import UUID

from ..models import QuotationComponent


class QuotationComponentRepository:

    def add(
        self,
        component: QuotationComponent,
    ) -> QuotationComponent:
        component.save(force_insert=True)
        return component

    def list_by_quotation(
        self,
        quotation_id: UUID,
    ):
        return (
            QuotationComponent.objects
            .filter(quotation_id=quotation_id)
            .order_by("created_at", "id")
        )
