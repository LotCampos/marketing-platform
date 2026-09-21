from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

from django.core.exceptions import ValidationError
from django.db import transaction

from ..models import Agreement, AgreementStatus, Opportunity, Prospect, Quotation, QuotationItem


@dataclass(frozen=True)
class AgreementCreateData:
    agreement_number: str
    quotation_id: UUID
    opportunity_id: UUID
    client_id: UUID
    status: str = AgreementStatus.DRAFT
    signed_by: UUID | None = None
    signed_at: object | None = None
    effective_from: object | None = None
    effective_until: object | None = None
    terms_hash: str | None = None
    notes: str | None = None
    pet_number: str | None = None
    legal_representative: str | None = None
    legal_representative_rfc: str | None = None
    technical_responsible: str | None = None
    urgent_work: bool = False
    special_conditions: bool = False


class AgreementService:
    """Creates agreements only from a consistent, already-converted commercial deal."""

    @classmethod
    @transaction.atomic
    def create(cls, data: AgreementCreateData) -> Agreement:
        agreement_number = data.agreement_number.strip()
        if not agreement_number:
            raise ValidationError({"agreement_number": "Agreement number is required."})

        if data.status not in {choice for choice, _ in AgreementStatus.choices}:
            raise ValidationError({"status": f"Invalid Agreement status: {data.status}"})

        try:
            quotation = Quotation.objects.select_for_update().get(id=data.quotation_id)
        except Quotation.DoesNotExist as exc:
            raise ValidationError({"quotation_id": "Quotation does not exist."}) from exc

        if quotation.client_id is None:
            raise ValidationError(
                {"quotation_id": "An agreement requires a quotation belonging to a converted Client."}
            )
        if quotation.opportunity_id != data.opportunity_id:
            raise ValidationError(
                {"opportunity_id": "Agreement opportunity must match the quotation opportunity."}
            )
        if quotation.client_id != data.client_id:
            raise ValidationError(
                {"client_id": "Agreement client must match the quotation client."}
            )

        if not QuotationItem.objects.filter(quotation_id=quotation.id).exists():
            raise ValidationError({"quotation_id": "The quotation must contain at least one service item."})

        try:
            opportunity = Opportunity.objects.select_for_update().get(id=data.opportunity_id)
        except Opportunity.DoesNotExist as exc:
            raise ValidationError({"opportunity_id": "Opportunity does not exist."}) from exc

        if opportunity.client_id != data.client_id:
            raise ValidationError(
                {"client_id": "Agreement client must match the opportunity client."}
            )

        if opportunity.prospect_id is None:
            raise ValidationError({"opportunity_id": "The opportunity must originate from a prospect."})
        prospect = Prospect.objects.select_related("installation").get(id=opportunity.prospect_id)
        if prospect.converted_client_id != data.client_id:
            raise ValidationError({"client_id": "The prospect must be converted to the selected client before an agreement can be created."})
        if prospect.installation_id is None or prospect.installation is None:
            raise ValidationError({"opportunity_id": "The prospect must have an installation before an agreement can be created."})
        required_fields = {
            "pet_number": data.pet_number,
            "legal_representative": data.legal_representative,
            "legal_representative_rfc": data.legal_representative_rfc,
            "technical_responsible": data.technical_responsible,
        }
        missing = [name for name, value in required_fields.items() if not value or not str(value).strip()]
        if missing:
            raise ValidationError({name: "This field is required to issue the FOR-G-016 PET." for name in missing})

        if Agreement.objects.filter(agreement_number=agreement_number).exists():
            raise ValidationError({"agreement_number": "An agreement with this number already exists."})
        if Agreement.objects.filter(quotation_id=data.quotation_id).exists():
            raise ValidationError({"quotation_id": "An agreement already exists for this quotation."})

        notes = data.notes.strip() if data.notes is not None else None
        terms_hash = data.terms_hash.strip() if data.terms_hash is not None else None

        return Agreement.objects.create(
            agreement_number=agreement_number,
            quotation_id=data.quotation_id,
            opportunity_id=data.opportunity_id,
            client_id=data.client_id,
            status=data.status,
            signed_by=data.signed_by,
            signed_at=data.signed_at,
            effective_from=data.effective_from,
            effective_until=data.effective_until,
            terms_hash=terms_hash or None,
            notes=notes or None,
            pet_number=data.pet_number.strip() if data.pet_number else None,
            legal_representative=data.legal_representative.strip() if data.legal_representative else None,
            legal_representative_rfc=data.legal_representative_rfc.strip().upper() if data.legal_representative_rfc else None,
            technical_responsible=data.technical_responsible.strip() if data.technical_responsible else None,
            urgent_work=bool(data.urgent_work),
            special_conditions=bool(data.special_conditions),
            version_lock=1,
        )