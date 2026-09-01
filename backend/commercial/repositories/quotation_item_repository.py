from uuid import UUID

from ..models import QuotationItem


class QuotationItemRepository:
    def add(
        self,
        quotation_item: QuotationItem,
    ) -> QuotationItem:
        quotation_item.save(force_insert=True)
        return quotation_item

    def get_by_id(
        self,
        quotation_item_id: UUID,
    ) -> QuotationItem:
        return QuotationItem.objects.get(
            id=quotation_item_id
        )
