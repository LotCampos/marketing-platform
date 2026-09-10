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

    client_id = serializers.PrimaryKeyRelatedField(
        source="client",
        queryset=Client.objects.filter(is_deleted=False),
        allow_null=True,
        required=False,
    )

    installation_type_id = serializers.PrimaryKeyRelatedField(
        source="installation_type",
        queryset=InstallationType.objects.filter(is_active=True),
        allow_null=True,
        required=False,
    )

    class Meta:
        model = Installation
        fields = (
            "id",
            "client_id",
            "installation_type_id",
            "address",
            "street",
            "street_number",
            "state",
            "municipality",
            "postal_code",
            "gps_lat",
            "gps_lng",
            "cre_asea_permit",
        )
        read_only_fields = ("id",)


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

    installation_types = serializers.SerializerMethodField(
        read_only=True,
    )

    def get_installation_types(self, obj):
        return [
            {
                "id": str(link.installation_type.id),
                "code": link.installation_type.code,
                "name": link.installation_type.name,
                "is_active": link.installation_type.is_active,
            }
            for link in obj.installation_type_links.select_related(
                "installation_type"
            ).filter(
                installation_type__is_active=True
            ).order_by(
                "installation_type__name"
            )
        ]

    class Meta:
        model = ServiceCatalog
        fields = (
            "id",
            "service_code",
            "service_name",
            "description",
            "regulatory_basis",
            "is_active",
            "installation_types",
        )
        