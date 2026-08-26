from rest_framework import viewsets
from rest_framework.permissions import AllowAny

from .models import Client, Installation, ServiceCatalog
from .serializers import (
    ClientSerializer,
    InstallationSerializer,
    ServiceCatalogSerializer,
)


class MasterBaseViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]


class ClientViewSet(MasterBaseViewSet):
    serializer_class = ClientSerializer

    def get_queryset(self):
        return (
            Client.objects
            .filter(is_deleted=False)
            .order_by("business_name")
        )


class InstallationViewSet(MasterBaseViewSet):
    serializer_class = InstallationSerializer

    def get_queryset(self):
        queryset = (
            Installation.objects
            .filter(is_deleted=False)
            .order_by("address")
        )

        client_id = self.request.query_params.get(
            "client_id"
        )

        if client_id:
            queryset = queryset.filter(
                client_id=client_id
            )

        return queryset


class ServiceCatalogViewSet(MasterBaseViewSet):
    serializer_class = ServiceCatalogSerializer

    def get_queryset(self):
        return (
            ServiceCatalog.objects
            .filter(is_active=True)
            .order_by("service_name")
        )