from rest_framework import serializers

from .models import Client, Installation, ServiceCatalog


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = (
            "id",
            "rfc",
            "business_name",
        )


class InstallationSerializer(serializers.ModelSerializer):
    client_id = serializers.UUIDField(
        read_only=True,
    )

    class Meta:
        model = Installation
        fields = (
            "id",
            "client_id",
            "address",
            "gps_lat",
            "gps_lng",
            "cre_asea_permit",
        )


class ServiceCatalogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceCatalog
        fields = (
            "id",
            "service_code",
            "service_name",
            "description",
            "regulatory_basis",
            "is_active",
        )