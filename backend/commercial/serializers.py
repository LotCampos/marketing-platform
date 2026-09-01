from decimal import Decimal

from rest_framework import serializers
from master.models import InstallationType

from .models import (
    Agreement,
    AgreementTerm,
    CapacityAssessment,
    Opportunity,
    Prospect,
    Quotation,
    QuotationItem,
    ServiceRequest,
)


class ServiceRequestSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = ServiceRequest
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_at",
            "version_lock",
            "requested_at",
            "created_by",
        )

    def validate_request_number(
        self,
        value: str,
    ) -> str:
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Request number is required."
            )

        return value

    def validate_requested_by_name(
        self,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        value = value.strip()

        return value or None

    def validate_requested_by_email(
        self,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        value = value.strip().lower()

        return value or None

    def validate_requested_by_phone(
        self,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        value = value.strip()

        return value or None

    def validate_request_description(
        self,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        value = value.strip()

        return value or None


class CapacityAssessmentSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = CapacityAssessment
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_at",
            "version_lock",
        )


class OpportunitySerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = Opportunity
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_at",
            "version_lock",
        )


class QuotationItemSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = QuotationItem
        fields = (
            "id",
            "quotation_id",
            "service_catalog_id",
            "description",
            "quantity",
            "unit_price",
            "line_total",
            "version_lock",
            "created_at",
        )

        read_only_fields = (
            "id",
            "quotation_id",
            "line_total",
            "version_lock",
            "created_at",
        )


class QuotationItemInputSerializer(
    serializers.Serializer
):
    service_catalog_id = serializers.UUIDField()

    description = serializers.CharField(
        max_length=1000,
        allow_blank=False,
        trim_whitespace=True,
    )

    quantity = serializers.DecimalField(
        max_digits=12,
        decimal_places=4,
        min_value=Decimal("0.0001"),
    )

    unit_price = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
        min_value=Decimal("0.00"),
    )

    def validate_description(
        self,
        value: str,
    ) -> str:
        value = " ".join(
            value.strip().split()
        )

        if not value:
            raise serializers.ValidationError(
                "Description is required."
            )

        return value


class QuotationSerializer(
    serializers.ModelSerializer
):
    """
    HTTP representation for Commercial quotations.

    Input:
        items -> QuotationItemInputSerializer

    Output:
        items -> QuotationItemSerializer

    Persistence and business rules remain outside
    the serializer layer.
    """

    items = QuotationItemInputSerializer(
        many=True,
        required=True,
        write_only=True,
    )

    issued_by = serializers.UUIDField(
        required=False,
        allow_null=True,
        default=None,
    )

    tax_percentage = serializers.DecimalField(
        max_digits=7,
        decimal_places=2,
        min_value=Decimal("0.00"),
        max_value=Decimal("100.00"),
        required=False,
        default=Decimal("16.00"),
        write_only=True,
    )

    class Meta:
        model = Quotation
        fields = (
            "id",
            "quotation_number",
            "opportunity_id",
            "client_id",
            "issued_by",
            "valid_until",
            "subtotal",
            "tax_amount",
            "total_amount",
            "currency",
            "notes",
            "version_lock",
            "created_at",
            "items",
            "tax_percentage",
        )
        read_only_fields = (
            "id",
            "subtotal",
            "tax_amount",
            "total_amount",
            "version_lock",
            "created_at",
        )

    def validate_quotation_number(
        self,
        value: str,
    ) -> str:
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Quotation number is required."
            )

        return value

    def validate_currency(
        self,
        value: str,
    ) -> str:
        value = value.strip().upper()

        if not value:
            raise serializers.ValidationError(
                "Currency is required."
            )

        if len(value) != 3:
            raise serializers.ValidationError(
                "Currency must contain exactly 3 characters."
            )

        return value

    def validate_notes(
        self,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        value = value.strip()

        return value or None

    def validate(
        self,
        attrs,
    ):
        items = self.initial_data.get(
            "items",
            [],
        )

        if not items:
            raise serializers.ValidationError(
                {
                    "items": (
                        "At least one quotation item "
                        "is required."
                    )
                }
            )

        return attrs

    def to_representation(
        self,
        instance: Quotation,
    ):
        representation = super().to_representation(
            instance
        )

        representation["items"] = self.get_items(
            instance
        )

        return representation

    def get_items(
        self,
        obj: Quotation,
    ):
        queryset = (
            QuotationItem.objects
            .filter(
                quotation_id=obj.id
            )
            .order_by("created_at")
        )

        return QuotationItemSerializer(
            queryset,
            many=True,
        ).data


class AgreementSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = Agreement
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_at",
            "version_lock",
        )


class AgreementTermSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = AgreementTerm
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_at",
            "version_lock",
        )


class ProspectSerializer(
    serializers.ModelSerializer
):
    installation_type = serializers.PrimaryKeyRelatedField(
        queryset=InstallationType.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
    )

    installation_type_detail = serializers.SerializerMethodField(
        read_only=True,
    )

    def get_installation_type_detail(self, obj):
        if not obj.installation_type:
            return None

        return {
            "id": str(obj.installation_type.id),
            "code": obj.installation_type.code,
            "name": obj.installation_type.name,
        }

    class Meta:
        model = Prospect
        fields = "__all__"
        read_only_fields = (
            "id",
            "prospect_number",
            "status",
            "version_lock",
            "converted_client_id",
            "converted_at",
            "converted_by",
            "created_at",
        )

    def validate_business_name(
        self,
        value: str,
    ) -> str:
        value = " ".join(
            value.strip().split()
        )

        if not value:
            raise serializers.ValidationError(
                "Business name is required."
            )

        return value

    def validate_rfc(
        self,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        value = value.strip().upper()

        return value or None

    def validate_contact_email(
        self,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        value = value.strip().lower()

        return value or None

    def validate_contact_phone(
        self,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        value = value.strip()

        return value or None

    def validate_source(
        self,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        value = " ".join(
            value.strip().split()
        )

        return value or None

    def validate_interest_description(
        self,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        value = " ".join(
            value.strip().split()
        )

        return value or None

    def validate_notes(
        self,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        value = " ".join(
            value.strip().split()
        )

        return value or None