from dataclasses import dataclass
from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from uuid import UUID

from core.exceptions import ValidationError
from django.db import transaction
from django.db.models import F

from ..models import (
    CommercialClauseTemplate,
    CommercialComponentType,
    Opportunity,
    Prospect,
    ProspectStatus,
    Quotation,
    QuotationComponent,
    QuotationItem,
)
from ..repositories import (
    QuotationComponentRepository,
    QuotationItemRepository,
    QuotationRepository,
)


MONEY_QUANTUM = Decimal("0.01")
IVA_PERCENTAGE = Decimal("16.00")


@dataclass(frozen=True)
class QuotationItemCreateData:
    service_catalog_id: UUID
    description: str
    quantity: int
    unit_price: int


@dataclass(frozen=True)
class QuotationComponentCreateData:
    component_type_code: str
    treatment: str
    amount: Decimal = Decimal("0")
    display_mode: str = "HIDDEN"
    clause_code: str | None = None


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
    components: tuple[QuotationComponentCreateData, ...] = ()


class QuotationService:
    def __init__(
        self,
        repository: QuotationRepository | None = None,
        item_repository: QuotationItemRepository | None = None,
        component_repository: QuotationComponentRepository | None = None,
    ) -> None:
        self.repository = repository or QuotationRepository()
        self.item_repository = item_repository or QuotationItemRepository()
        self.component_repository = component_repository or QuotationComponentRepository()

    @staticmethod
    def _resolve_component(
        component: QuotationComponentCreateData,
    ) -> tuple[CommercialComponentType, CommercialClauseTemplate | None, Decimal]:
        component_type_code = component.component_type_code.strip().upper()
        treatment = component.treatment.strip().upper()
        display_mode = component.display_mode.strip().upper()
        amount = QuotationService._money(component.amount)

        if not component_type_code:
            raise ValidationError({"components": "Component type code is required."})

        if treatment not in {"INCLUDED", "ADDITIONAL", "INFORMATIVE"}:
            raise ValidationError({"components": "Invalid commercial component treatment."})

        if display_mode not in {"LINE_ITEM", "CLAUSE", "HIDDEN"}:
            raise ValidationError({"components": "Invalid commercial component display mode."})

        if amount < Decimal("0"):
            raise ValidationError({"components": "Component amount cannot be negative."})

        try:
            component_type = CommercialComponentType.objects.get(
                code=component_type_code,
                is_active=True,
            )
        except CommercialComponentType.DoesNotExist as exc:
            raise ValidationError(
                {"components": f"Active component type '{component_type_code}' does not exist."}
            ) from exc

        clause_template = None

        if display_mode == "CLAUSE":
            clause_code = (component.clause_code or "").strip().upper()

            if not clause_code:
                raise ValidationError(
                    {"components": "A clause code is required when display_mode is CLAUSE."}
                )

            try:
                clause_template = (
                    CommercialClauseTemplate.objects
                    .select_for_update()
                    .get(
                        code=clause_code,
                        is_active=True,
                    )
                )
            except CommercialClauseTemplate.DoesNotExist as exc:
                raise ValidationError(
                    {"components": f"Active clause '{clause_code}' does not exist."}
                ) from exc

            if clause_template.component_type_id != component_type.id:
                raise ValidationError(
                    {"components": "Clause template component type does not match the quotation component type."}
                )

            if clause_template.treatment != treatment:
                raise ValidationError(
                    {"components": "Clause template treatment does not match the quotation component treatment."}
                )

        elif component.clause_code:
            raise ValidationError(
                {"components": "A clause code is only valid when display_mode is CLAUSE."}
            )

        return component_type, clause_template, amount

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

        resolved_components = tuple(
            (
                component,
                *self._resolve_component(component),
            )
            for component in data.components
        )

        component_additions = self._money(
            sum(
                (
                    amount
                    for component, _component_type, _clause_template, amount
                    in resolved_components
                    if component.treatment.strip().upper() == "ADDITIONAL"
                ),
                Decimal("0"),
            )
        )

        subtotal = self._money(
            self._calculate_subtotal(data.items) + component_additions
        )
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

        for component, component_type, clause_template, amount in resolved_components:
            self.component_repository.add(QuotationComponent(
                quotation_id=quotation.id,
                component_type=component_type,
                treatment=component.treatment.strip().upper(),
                amount=amount,
                display_mode=component.display_mode.strip().upper(),
                clause_template=clause_template,
                clause_version=(
                    clause_template.version
                    if clause_template is not None
                    else None
                ),
                clause_text_snapshot=(
                    clause_template.template_text
                    if clause_template is not None
                    else None
                ),
                version_lock=1,
            ))

        if prospect is not None and prospect.status == ProspectStatus.QUALIFIED:
            Prospect.objects.filter(id=prospect.id, version_lock=prospect.version_lock).update(
                status=ProspectStatus.QUOTED,
                version_lock=F("version_lock") + 1,
            )

        return quotation
