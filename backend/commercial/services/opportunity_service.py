from dataclasses import dataclass
from decimal import Decimal
from uuid import UUID

from django.core.exceptions import ValidationError
from django.db import transaction

from ..models import Opportunity
from ..repositories import OpportunityRepository


@dataclass(frozen=True)
class OpportunityCreateData:
    opportunity_number: str
    service_request_id: UUID
    client_id: UUID
    title: str
    assigned_to: UUID | None = None
    description: str | None = None
    estimated_value: Decimal | None = None


class OpportunityService:
    def __init__(
        self,
        repository: OpportunityRepository | None = None,
    ) -> None:
        self.repository = repository or OpportunityRepository()

    @transaction.atomic
    def create(
        self,
        data: OpportunityCreateData,
    ) -> Opportunity:
        opportunity_number = data.opportunity_number.strip()
        title = data.title.strip()

        if not opportunity_number:
            raise ValidationError(
                {"opportunity_number": "Opportunity number is required."}
            )

        if not title:
            raise ValidationError(
                {"title": "Title is required."}
            )

        if Opportunity.objects.filter(
            opportunity_number=opportunity_number,
        ).exists():
            raise ValidationError(
                {
                    "opportunity_number": (
                        "An opportunity with this number already exists."
                    )
                }
            )

        opportunity = Opportunity(
            opportunity_number=opportunity_number,
            service_request_id=data.service_request_id,
            client_id=data.client_id,
            assigned_to=data.assigned_to,
            title=title,
            description=(
                data.description.strip()
                if data.description
                else None
            ),
            estimated_value=data.estimated_value,
            version_lock=1,
        )

        return self.repository.add(opportunity)
