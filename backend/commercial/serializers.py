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
    CommercialComponentType,
    CommercialClauseTemplate,
)


class CommercialComponentTypeSerializer(serializers.ModelSerializer):

    class Meta:
        model = CommercialComponentType
        fields = (
            "id",
            "code",
            "name",
            "description",
            "is_active",
            "created_at",
        )
        read_only_fields = fields


class CommercialClauseTemplateSerializer(serializers.ModelSerializer):

    component_type_code = serializers.CharField(
        source="component_type.code",
        read_only=True,
    )

    class Meta:
        model = CommercialClauseTemplate
        fields = (
            "id",
            "code",
            "name",
            "version",
            "component_type_code",
            "treatment",
            "template_text",
            "is_active",
            "effective_from",
            "effective_until",
            "content_hash",
            "created_at",
        )
        read_only_fields = fields


class ServiceRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceRequest
        fields = "__all__"
        read_only_fields = (
            "id", "created_at", "version_lock", "requested_at", "created_by",
        )

    def validate_request_number(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Request number is required.")
        return value

    def validate_requested_by_name(self, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None

    def validate_requested_by_email(self, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip().lower()
        return value or None

    def validate_requested_by_phone(self, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None

    def validate_request_description(self, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None


class CapacityAssessmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = CapacityAssessment
        fields = "__all__"
        read_only_fields = ("id", "created_at", "version_lock")


class OpportunitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Opportunity
        fields = "__all__"
        read_only_fields = ("id", "created_at", "version_lock")


class QuotationItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuotationItem
        fields = (
            "id", "quotation_id", "service_catalog_id", "description",
            "quantity", "unit_price", "line_total", "version_lock", "created_at",
        )
        read_only_fields = ("id", "quotation_id", "line_total", "version_lock", "created_at")


class QuotationItemInputSerializer(serializers.Serializer):
    service_catalog_id = serializers.UUIDField()
    description = serializers.CharField(max_length=500, allow_blank=False, trim_whitespace=True)
    quantity = serializers.IntegerField(min_value=1)
    unit_price = serializers.IntegerField(min_value=0)

    def validate_description(self, value: str) -> str:
        value = " ".join(value.strip().split())
        if not value:
            raise serializers.ValidationError("Description is required.")
        return value


class QuotationComponentInputSerializer(serializers.Serializer):
    component_type_code = serializers.CharField(max_length=50)
    treatment = serializers.ChoiceField(
        choices=("INCLUDED", "ADDITIONAL", "INFORMATIVE"),
    )
    amount = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
        min_value=Decimal("0"),
        required=False,
        default=Decimal("0"),
    )
    display_mode = serializers.ChoiceField(
        choices=("LINE_ITEM", "CLAUSE", "HIDDEN"),
        required=False,
        default="HIDDEN",
    )
    clause_code = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True,
        allow_null=True,
    )

    def validate_component_type_code(self, value: str) -> str:
        value = value.strip().upper()
        if not value:
            raise serializers.ValidationError("Component type code is required.")
        return value

    def validate_clause_code(self, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip().upper()
        return value or None


class QuotationSerializer(serializers.ModelSerializer):
    items = QuotationItemInputSerializer(many=True, required=True, write_only=True)
    components = QuotationComponentInputSerializer(many=True, required=False, write_only=True)
    client_id = serializers.UUIDField(required=False, allow_null=True, default=None)
    issued_by = serializers.UUIDField(required=False, allow_null=True, default=None)

    class Meta:
        model = Quotation
        fields = (
            "id", "quotation_number", "opportunity_id", "client_id", "issued_by",
            "valid_until", "subtotal", "tax_amount", "total_amount", "currency",
            "notes", "version_lock", "created_at", "items", "components",
        )
        read_only_fields = ("id", "subtotal", "tax_amount", "total_amount", "version_lock", "created_at")

    def validate_quotation_number(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Quotation number is required.")
        return value

    def validate_currency(self, value: str) -> str:
        value = value.strip().upper()
        if not value:
            raise serializers.ValidationError("Currency is required.")
        if value != "MXN":
            raise serializers.ValidationError("Currency must be MXN.")
        return value

    def validate_notes(self, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None

    def validate(self, attrs):
        if not self.initial_data.get("items", []):
            raise serializers.ValidationError({"items": "At least one quotation item is required."})
        return attrs

    def to_representation(self, instance: Quotation):
        representation = super().to_representation(instance)
        representation["items"] = self.get_items(instance)
        return representation

    def get_items(self, obj: Quotation):
        queryset = QuotationItem.objects.filter(quotation_id=obj.id).order_by("created_at")
        return QuotationItemSerializer(queryset, many=True).data


class AgreementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Agreement
        fields = "__all__"
        read_only_fields = ("id", "created_at", "version_lock")


class AgreementTermSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgreementTerm
        fields = "__all__"
        read_only_fields = ("id", "created_at", "version_lock")


class ProspectSerializer(serializers.ModelSerializer):
    service_catalog_id = serializers.UUIDField(required=True, allow_null=False)
    installation_type_detail = serializers.SerializerMethodField(read_only=True)
    installation_type_id = serializers.PrimaryKeyRelatedField(
        queryset=InstallationType.objects.filter(is_active=True),
        required=True, allow_null=False, write_only=True,
    )

    def get_installation_type_detail(self, obj):
        installation = getattr(obj, "installation", None)
        if not installation or not installation.installation_type:
            return None
        installation_type = installation.installation_type
        return {
            "id": str(installation_type.id), "code": installation_type.code,
            "name": installation_type.name, "is_active": installation_type.is_active,
        }

    class Meta:
        model = Prospect
        fields = "__all__"
        read_only_fields = (
            "id", "prospect_number", "status", "version_lock", "converted_client_id",
            "converted_at", "converted_by", "created_at", "installation_type_detail",
        )


class DashboardFunnelSerializer(serializers.Serializer):
    prospects = serializers.IntegerField()
    opportunities = serializers.IntegerField()
    quotations = serializers.IntegerField()
    agreements = serializers.IntegerField()


class DashboardKPIDataSerializer(serializers.Serializer):
    prospects = serializers.IntegerField()
    opportunities = serializers.IntegerField()
    quotations = serializers.IntegerField()
    agreements = serializers.IntegerField()
    pipeline_opportunities = serializers.IntegerField()
    pipeline_estimated_value = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
    )


class DashboardStatusSerializer(serializers.Serializer):
    status = serializers.CharField()
    total = serializers.IntegerField()


class DashboardPipelineServiceSerializer(serializers.Serializer):
    service_id = serializers.UUIDField()
    service_code = serializers.CharField(allow_null=True)
    service_name = serializers.CharField()
    opportunities = serializers.IntegerField()
    estimated_value = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
    )


class DashboardPipelineResponsibleSerializer(serializers.Serializer):
    responsible_id = serializers.UUIDField(allow_null=True)
    responsible_name = serializers.CharField()
    opportunities = serializers.IntegerField()
    estimated_value = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
    )


class DashboardEvolutionPointSerializer(serializers.Serializer):
    period = serializers.DateTimeField()
    total = serializers.IntegerField()


class DashboardEvolutionSerializer(serializers.Serializer):
    prospects = DashboardEvolutionPointSerializer(many=True)
    opportunities = DashboardEvolutionPointSerializer(many=True)
    quotations = DashboardEvolutionPointSerializer(many=True)
    agreements = DashboardEvolutionPointSerializer(many=True)


class CommercialDashboardSerializer(serializers.Serializer):
    kpis = DashboardKPIDataSerializer()
    funnel = DashboardFunnelSerializer()
    prospect_status = DashboardStatusSerializer(many=True)
    agreement_status = DashboardStatusSerializer(many=True)
    pipeline_by_service = DashboardPipelineServiceSerializer(many=True)
    pipeline_by_responsible = DashboardPipelineResponsibleSerializer(many=True)
    evolution = DashboardEvolutionSerializer()
