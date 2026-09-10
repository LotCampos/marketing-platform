from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from master.services.client_service import ClientCreateData, ClientService

from ..models import Opportunity, Prospect, ProspectStatus, Quotation


@dataclass(frozen=True)
class ProspectConversionResult:
    prospect: Prospect
    client_id: UUID


class ProspectConversionService:
    """Atomically converts a WON Prospect into a MASTER Client."""

    @classmethod
    @transaction.atomic
    def convert(
        cls,
        *,
        prospect_id: UUID,
        converted_by: UUID | None = None,
    ) -> ProspectConversionResult:
        try:
            prospect = (
                Prospect.objects
                .select_for_update()
                .select_related("installation")
                .get(id=prospect_id)
            )
        except Prospect.DoesNotExist as exc:
            raise ValidationError({"prospect_id": "Prospect does not exist."}) from exc

        if prospect.status not in {ProspectStatus.WON, ProspectStatus.CONVERTED}:
            raise ValidationError(
                {"status": "Only a WON prospect can be converted into a Client."}
            )

        if prospect.converted_client_id is not None:
            return ProspectConversionResult(
                prospect=prospect,
                client_id=prospect.converted_client_id,
            )

        if not prospect.rfc:
            raise ValidationError(
                {"rfc": "RFC is required before a Prospect can become a Client."}
            )

        client, _ = ClientService.create_from_prospect(
            ClientCreateData(
                business_name=prospect.business_name,
                rfc=prospect.rfc,
                contact_name=prospect.contact_name,
                contact_email=prospect.contact_email,
                contact_phone=prospect.contact_phone,
            )
        )

        if prospect.installation_id is not None:
            prospect.installation.client_id = client.id
            prospect.installation.version_lock += 1
            prospect.installation.save(update_fields=["client_id", "version_lock"])

        Opportunity.objects.filter(prospect_id=prospect.id).update(client_id=client.id)
        Quotation.objects.filter(
            opportunity_id__in=Opportunity.objects.filter(prospect_id=prospect.id).values("id"),
            client_id__isnull=True,
        ).update(client_id=client.id)

        prospect.converted_client_id = client.id
        prospect.converted_at = timezone.now()
        prospect.converted_by = converted_by
        prospect.status = ProspectStatus.CONVERTED
        prospect.version_lock += 1
        prospect.save(
            update_fields=[
                "converted_client_id",
                "converted_at",
                "converted_by",
                "status",
                "version_lock",
            ]
        )

        return ProspectConversionResult(
            prospect=prospect,
            client_id=client.id,
        )