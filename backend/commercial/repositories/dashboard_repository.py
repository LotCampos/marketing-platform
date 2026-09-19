from django.db.models import Count, Sum
from django.db.models.functions import TruncMonth

from ..models import Agreement, Opportunity, Prospect, Quotation


class DashboardRepository:

    def get_funnel_counts(self) -> dict:
        return {
            "prospects": Prospect.objects.count(),
            "opportunities": Opportunity.objects.count(),
            "quotations": Quotation.objects.count(),
            "agreements": Agreement.objects.count(),
        }

    def get_prospect_status_distribution(self) -> list[dict]:
        return list(
            Prospect.objects
            .values("status")
            .annotate(total=Count("id"))
            .order_by("status")
        )

    def get_agreement_status_distribution(self) -> list[dict]:
        return list(
            Agreement.objects
            .values("status")
            .annotate(total=Count("id"))
            .order_by("status")
        )

    def get_pipeline_by_service(self) -> list[dict]:
        return list(
            Opportunity.objects
            .filter(prospect__service_catalog_id__isnull=False)
            .values("prospect__service_catalog_id")
            .annotate(
                opportunities=Count("id"),
                estimated_value=Sum("estimated_value"),
            )
            .order_by("-estimated_value")
        )

    def get_pipeline_by_responsible(self) -> list[dict]:
        return list(
            Opportunity.objects
            .values("assigned_to")
            .annotate(
                opportunities=Count("id"),
                estimated_value=Sum("estimated_value"),
            )
            .order_by("-estimated_value")
        )

    def get_commercial_evolution(self) -> dict:
        prospects = list(
            Prospect.objects
            .annotate(period=TruncMonth("created_at"))
            .values("period")
            .annotate(total=Count("id"))
            .order_by("period")
        )

        opportunities = list(
            Opportunity.objects
            .annotate(period=TruncMonth("created_at"))
            .values("period")
            .annotate(total=Count("id"))
            .order_by("period")
        )

        quotations = list(
            Quotation.objects
            .annotate(period=TruncMonth("created_at"))
            .values("period")
            .annotate(total=Count("id"))
            .order_by("period")
        )

        agreements = list(
            Agreement.objects
            .annotate(period=TruncMonth("created_at"))
            .values("period")
            .annotate(total=Count("id"))
            .order_by("period")
        )

        return {
            "prospects": prospects,
            "opportunities": opportunities,
            "quotations": quotations,
            "agreements": agreements,
        }

    def get_pipeline_totals(self) -> dict:
        result = Opportunity.objects.aggregate(
            opportunities=Count("id"),
            estimated_value=Sum("estimated_value"),
        )

        return {
            "opportunities": result["opportunities"] or 0,
            "estimated_value": result["estimated_value"] or 0,
        }
