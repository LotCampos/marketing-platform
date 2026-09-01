from uuid import UUID

from ..models import Opportunity


class OpportunityRepository:
    def add(
        self,
        opportunity: Opportunity,
    ) -> Opportunity:
        opportunity.save(force_insert=True)
        return opportunity

    def get_by_id(
        self,
        opportunity_id: UUID,
    ) -> Opportunity:
        return Opportunity.objects.get(
            id=opportunity_id
        )
