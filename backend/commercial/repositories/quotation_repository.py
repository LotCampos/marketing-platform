from uuid import UUID

from ..models import Quotation


class QuotationRepository:
    def add(
        self,
        quotation: Quotation,
    ) -> Quotation:
        quotation.save(force_insert=True)
        return quotation

    def get_by_id(
        self,
        quotation_id: UUID,
    ) -> Quotation:
        return Quotation.objects.get(
            id=quotation_id
        )
