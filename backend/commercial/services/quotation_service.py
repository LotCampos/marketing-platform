from dataclasses import dataclass
from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from uuid import UUID

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import F

from ..models import Opportunity, Prospect, ProspectStatus, Quotation, QuotationItem
from ..repositories import QuotationItemRepository, QuotationRepository


MONEY_QUANTUM = Decimal("0.01")
IVA_PERCENTAGE = Decimal("16.00")


@dataclass(frozen=True)
class QuotationItemCreateData:
    service_catalog_id: UUID
    description: str
    quantity: int
    unit_price: int


@dataclass(frozen=True)
class QuotationCreateData:
    quotation_number: str
    opportunity_id: UUID
    client_id: UUID | None
    issued_by: UUID | None
    valid_until: date | None = None
    currency: str = "MXN"
    notes: str | None = None
    items: tuple[QuotationItemCreateData, ...] = ()


class QuotationService:
    def __init__(self, repository: QuotationRepository | None = None, item_repository: QuotationItemRepository | None = None) -> None:
        self.repository = repository or QuotationRepository()
        self.item_repository = item_repository or QuotationItemRepository()

    @staticmethod
    def _money(value: Decimal) -> Decimal:
        return value.quantize(MONEY_QUANTUM, rounding=ROUND_HALF_UP)

    @classmethod
    def _calculate_item_total(cls, quantity: int, unit_price: int) -> Decimal:
        return cls._money(Decimal(quantity) * Decimal(unit_price))

    @classmethod
    def _calculate_subtotal(cls, items: tuple[QuotationItemCreateData, ...]) -> Decimal:
        return cls._money(sum((cls._calculate_item_total(item.quantity, item.unit_price) for item in items), Decimal("0")))

    @classmethod
    def _calculate_tax(cls, subtotal: Decimal) -> Decimal:
        return cls._money(subtotal * IVA_PERCENTAGE / Decimal("100"))

    @classmethod
    def _calculate_total(cls, subtotal: Decimal, tax_amount: Decimal) -> Decimal:
        return cls._money(subtotal + tax_amount)

    @transaction.atomic
    def create(self, data: QuotationCreateData) -> Quotation:
        quotation_number = data.quotation_number.strip()
        currency = data.currency.strip().upper()

        if not quotation_number:
            raise ValidationError({"quotation_number": "Quotation number is required."})
        if not currency:
            raise ValidationError({"currency": "Currency is required."})
        if currency != "MXN":
            raise ValidationError({"currency": "Currency must be MXN."})
        if not data.items:
            raise ValidationError({"items": "At least one quotation item is required."})
        for index, item in enumerate(data.items):
            if item.quantity <= 0:
                raise ValidationError({f"items[{index}].quantity": "Quantity must be greater than zero."})
            if item.unit_price < 0:
                raise ValidationError({f"items[{index}].unit_price": "Unit price cannot be negative."})
            if not item.description.strip():
                raise ValidationError({f"items[{index}].description": "Description is required."})

        try:
            opportunity = Opportunity.objects.select_for_update().get(id=data.opportunity_id)
        except Opportunity.DoesNotExist as exc:
            raise ValidationError({"opportunity_id": "Opportunity does not exist."}) from exc

        prospect = None
        if opportunity.prospect_id is not None:
            try:
                prospect = Prospect.objects.select_for_update().get(id=opportunity.prospect_id)
            except Prospect.DoesNotExist as exc:
                raise ValidationError({"opportunity_id": "Opportunity references a prospect that does not exist."}) from exc

            if prospect.status not in {ProspectStatus.QUALIFIED, ProspectStatus.QUOTED}:
                raise ValidationError({"opportunity_id": "A prospect must be qualified before receiving a quotation."})

        # A prospect-origin opportunity may receive a quotation before conversion.
        # Until WON performs the conversion, the quotation must remain without a client.
        if opportunity.client_id is None and data.client_id is not None:
            raise ValidationError({"client_id": "A quotation for an unconverted prospect cannot have a client."})

        if opportunity.client_id is not None and data.client_id is not None and opportunity.client_id != data.client_id:
            raise ValidationError({"client_id": "Quotation client must match the opportunity client."})

        effective_client_id = opportunity.client_id

        if Quotation.objects.filter(quotation_number=quotation_number).exists():
            raise ValidationError({"quotation_number": "A quotation with this number already exists."})

        subtotal = self._calculate_subtotal(data.items)
        tax_amount = self._calculate_tax(subtotal)
        total_amount = self._calculate_total(subtotal, tax_amount)
        notes = data.notes.strip() if data.notes is not None else None
        if notes == "":
            notes = None

        quotation = self.repository.add(Quotation(
            quotation_number=quotation_number,
            opportunity_id=data.opportunity_id,
            client_id=effective_client_id,
            issued_by=data.issued_by,
            valid_until=data.valid_until,
            subtotal=subtotal,
            tax_amount=tax_amount,
            total_amount=total_amount,
            currency=currency,
            notes=notes,
            version_lock=1,
        ))

        for item in data.items:
            self.item_repository.add(QuotationItem(
                quotation_id=quotation.id,
                service_catalog_id=item.service_catalog_id,
                description=item.description.strip(),
                quantity=item.quantity,
                unit_price=item.unit_price,
                line_total=self._calculate_item_total(item.quantity, item.unit_price),
                version_lock=1,
            ))

        if prospect is not None and prospect.status == ProspectStatus.QUALIFIED:
            Prospect.objects.filter(id=prospect.id, version_lock=prospect.version_lock).update(
                status=ProspectStatus.QUOTED,
                version_lock=F("version_lock") + 1,
            )

        return quotation
