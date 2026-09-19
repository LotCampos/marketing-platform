from django.urls import include, path

from rest_framework.routers import DefaultRouter

from .views import (
    CommercialDashboardView,
    CommercialComponentTypeViewSet,
    CommercialClauseTemplateViewSet,
    AgreementTermViewSet,
    AgreementViewSet,
    CapacityAssessmentViewSet,
    OpportunityViewSet,
    ProspectViewSet,
    QuotationItemViewSet,
    QuotationViewSet,
    ServiceRequestViewSet,
)


router = DefaultRouter()

router.register(
    "component-types",
    CommercialComponentTypeViewSet,
    basename="commercial-component-type",
)

router.register(
    "clause-templates",
    CommercialClauseTemplateViewSet,
    basename="commercial-clause-template",
)

router.register(
    "service-requests",
    ServiceRequestViewSet,
    basename="commercial-service-request",
)

router.register(
    "prospects",
    ProspectViewSet,
    basename="commercial-prospect",
)

router.register(
    "capacity-assessments",
    CapacityAssessmentViewSet,
    basename="commercial-capacity-assessment",
)

router.register(
    "opportunities",
    OpportunityViewSet,
    basename="commercial-opportunity",
)

router.register(
    "quotations",
    QuotationViewSet,
    basename="commercial-quotation",
)

router.register(
    "quotation-items",
    QuotationItemViewSet,
    basename="commercial-quotation-item",
)

router.register(
    "agreements",
    AgreementViewSet,
    basename="commercial-agreement",
)

router.register(
    "agreement-terms",
    AgreementTermViewSet,
    basename="commercial-agreement-term",
)


urlpatterns = [
    path("dashboard/", CommercialDashboardView.as_view()),
    path("", include(router.urls)),
]
