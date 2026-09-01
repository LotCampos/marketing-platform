from dataclasses import dataclass
from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from uuid import UUID

from django.core.exceptions import ValidationError
from django.db import transaction

from ..models import Quotation, QuotationItem
from ..repositories import (
    QuotationItemRepository,
    QuotationRepository,
)


MONEY_QUANTUM = Decimal("0.01")


@dataclass(frozen=True)
class QuotationItemCreateData:
    service_catalog_id: UUID
    description: str
    quantity: Decimal
    unit_price: Decimal


@dataclass(frozen=True)
class QuotationCreateData:
    quotation_number: str
    opportunity_id: UUID
    client_id: UUID
    issued_by: UUID | None
    valid_until: date | None = None
    currency: str = "MXN"
    notes: str | None = None
    tax_percentage: Decimal = Decimal("16.00")
    items: tuple[QuotationItemCreateData, ...] = ()


class QuotationService:
    def __init__(
        self,
        repository: QuotationRepository | None = None,
        item_repository: QuotationItemRepository | None = None,
    ) -> None:
        self.repository = (
            repository or QuotationRepository()
        )
        self.item_repository = (
            item_repository or QuotationItemRepository()
        )

    @staticmethod
    def _money(
        value: Decimal,
    ) -> Decimal:
        return value.quantize(
            MONEY_QUANTUM,
            rounding=ROUND_HALF_UP,
        )

    @classmethod
    def _calculate_item_total(
        cls,
        quantity: Decimal,
        unit_price: Decimal,
    ) -> Decimal:
        return cls._money(
            quantity * unit_price
        )

    @classmethod
    def _calculate_subtotal(
        cls,
        items: tuple[QuotationItemCreateData, ...],
    ) -> Decimal:
        return cls._money(
            sum(
                (
                    cls._calculate_item_total(
                        item.quantity,
                        item.unit_price,
                    )
                    for item in items
                ),
                Decimal("0"),
            )
        )

    @classmethod
    def _calculate_tax(
        cls,
        subtotal: Decimal,
        tax_percentage: Decimal,
    ) -> Decimal:
        return cls._money(
            subtotal
            * tax_percentage
            / Decimal("100")
        )

    @classmethod
    def _calculate_total(
        cls,
        subtotal: Decimal,
        tax_amount: Decimal,
    ) -> Decimal:
        return cls._money(
            subtotal + tax_amount
        )

    @transaction.atomic
    def create(
        self,
        data: QuotationCreateData,
    ) -> Quotation:
        quotation_number = (
            data.quotation_number.strip()
        )

        currency = (
            data.currency.strip().upper()
        )

        if not quotation_number:
            raise ValidationError(
                {
                    "quotation_number": (
                        "Quotation number is required."
                    )
                }
            )

        if not currency:
            raise ValidationError(
                {
                    "currency": (
                        "Currency is required."
                    )
                }
            )

        if len(currency) != 3:
            raise ValidationError(
                {
                    "currency": (
                        "Currency must contain exactly 3 characters."
                    )
                }
            )

        if not data.items:
            raise ValidationError(
                {
                    "items": (
                        "At least one quotation item is required."
                    )
                }
            )

        if data.tax_percentage < 0:
            raise ValidationError(
                {
                    "tax_percentage": (
                        "Tax percentage cannot be negative."
                    )
                }
            )

        for index, item in enumerate(data.items):
            if item.quantity <= 0:
                raise ValidationError(
                    {
                        f"items[{index}].quantity": (
                            "Quantity must be greater than zero."
                        )
                    }
                )

            if item.unit_price < 0:
                raise ValidationError(
                    {
                        f"items[{index}].unit_price": (
                            "Unit price cannot be negative."
                        )
                    }
                )

            if not item.description.strip():
                raise ValidationError(
                    {
                        f"items[{index}].description": (
                            "Description is required."
                        )
                    }
                )

        if Quotation.objects.filter(
            quotation_number=quotation_number,
        ).exists():
            raise ValidationError(
                {
                    "quotation_number": (
                        "A quotation with this number already exists."
                    )
                }
            )

        subtotal = self._calculate_subtotal(
            data.items
        )

        tax_amount = self._calculate_tax(
            subtotal,
            data.tax_percentage,
        )

        total_amount = self._calculate_total(
            subtotal,
            tax_amount,
        )

        notes = (
            data.notes.strip()
            if data.notes is not None
            else None
        )

        if notes == "":
            notes = None

        quotation = Quotation(
            quotation_number=quotation_number,
            opportunity_id=data.opportunity_id,
            client_id=data.client_id,
            issued_by=data.issued_by,
            valid_until=data.valid_until,
            subtotal=subtotal,
            tax_amount=tax_amount,
            total_amount=total_amount,
            currency=currency,
            notes=notes,
            version_lock=1,
        )

        quotation = self.repository.add(
            quotation
        )

        for item in data.items:
            line_total = (
                self._calculate_item_total(
                    item.quantity,
                    item.unit_price,
                )
            )

            quotation_item = QuotationItem(
                quotation_id=quotation.id,
                service_catalog_id=(
                    item.service_catalog_id
                ),
                description=(
                    item.description.strip()
                ),
                quantity=item.quantity,
                unit_price=item.unit_price,
                line_total=line_total,
                version_lock=1,
            )

            self.item_repository.add(
                quotation_item
            )

        return quotation