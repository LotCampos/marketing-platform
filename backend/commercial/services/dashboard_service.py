from commercial.repositories.dashboard_repository import DashboardRepository
from identity.models import User
from master.models import ServiceCatalog


class CommercialDashboardService:

    def __init__(self, repository=None):
        self.repository = repository or DashboardRepository()

    def get_dashboard(self) -> dict:
        funnel = self.repository.get_funnel_counts()
        prospect_status = self.repository.get_prospect_status_distribution()
        agreement_status = self.repository.get_agreement_status_distribution()
        pipeline_by_service = self.repository.get_pipeline_by_service()
        pipeline_by_responsible = self.repository.get_pipeline_by_responsible()
        evolution = self.repository.get_commercial_evolution()
        pipeline_totals = self.repository.get_pipeline_totals()

        service_ids = {
            item["prospect__service_catalog_id"]
            for item in pipeline_by_service
            if item["prospect__service_catalog_id"]
        }

        user_ids = {
            item["assigned_to"]
            for item in pipeline_by_responsible
            if item["assigned_to"]
        }

        services = {
            str(service.id): service
            for service in ServiceCatalog.objects.filter(id__in=service_ids)
        }

        users = {
            str(user.id): user
            for user in User.objects.filter(id__in=user_ids)
        }

        return {
            "kpis": {
                "prospects": funnel["prospects"],
                "opportunities": funnel["opportunities"],
                "quotations": funnel["quotations"],
                "agreements": funnel["agreements"],
                "pipeline_opportunities": pipeline_totals["opportunities"],
                "pipeline_estimated_value": pipeline_totals["estimated_value"],
            },
            "funnel": funnel,
            "prospect_status": prospect_status,
            "agreement_status": agreement_status,
            "pipeline_by_service": [
                {
                    "service_id": str(item["prospect__service_catalog_id"]),
                    "service_code": services[
                        str(item["prospect__service_catalog_id"])
                    ].service_code
                    if str(item["prospect__service_catalog_id"]) in services
                    else None,
                    "service_name": services[
                        str(item["prospect__service_catalog_id"])
                    ].service_name
                    if str(item["prospect__service_catalog_id"]) in services
                    else "Servicio no identificado",
                    "opportunities": item["opportunities"],
                    "estimated_value": item["estimated_value"] or 0,
                }
                for item in pipeline_by_service
            ],
            "pipeline_by_responsible": [
                {
                    "responsible_id": str(item["assigned_to"])
                    if item["assigned_to"]
                    else None,
                    "responsible_name": users[
                        str(item["assigned_to"])
                    ].full_name
                    if item["assigned_to"] and str(item["assigned_to"]) in users
                    else "Sin responsable",
                    "opportunities": item["opportunities"],
                    "estimated_value": item["estimated_value"] or 0,
                }
                for item in pipeline_by_responsible
            ],
            "evolution": evolution,
        }
