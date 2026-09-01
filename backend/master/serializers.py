from rest_framework import serializers

from .models import (
    Client,
    Installation,
    InstallationType,
    ServiceCatalog,
)


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

    installation_type_id = serializers.UUIDField(
        read_only=True,
    )

    class Meta:
        model = Installation
        fields = (
            "id",
            "client_id",
            "installation_type_id",
            "address",
            "gps_lat",
            "gps_lng",
            "cre_asea_permit",
        )


class InstallationTypeSerializer(serializers.ModelSerializer):

    class Meta:
        model = InstallationType
        fields = (
            "id",
            "code",
            "name",
            "is_active",
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
