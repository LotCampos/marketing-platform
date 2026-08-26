from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
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
    path("", include(router.urls)),
]