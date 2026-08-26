from rest_framework.routers import DefaultRouter

from .views import (
    ClientViewSet,
    InstallationViewSet,
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
    "service-catalog",
    ServiceCatalogViewSet,
    basename="master-service-catalog",
)


urlpatterns = router.urls