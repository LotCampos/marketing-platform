from rest_framework.routers import DefaultRouter

from .views import (
    ClientViewSet,
    InstallationViewSet,
    InstallationTypeViewSet,
    ServiceCatalogViewSet,
)


router = DefaultRouter()

router.register(
    "clients",
    ClientViewSet,
    basename="master-client",
)

router.register(
    "installations",
    InstallationViewSet,
    basename="master-installation",
)

router.register(
    "installation-types",
    InstallationTypeViewSet,
    basename="master-installation-type",
)

router.register(
    "service-catalog",
    ServiceCatalogViewSet,
    basename="master-service-catalog",
)


urlpatterns = router.urls
