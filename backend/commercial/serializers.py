from rest_framework import serializers

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


class ServiceRequestSerializer(serializers.ModelSerializer):
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

    def validate_request_number(self, value: str) -> str:
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


class CapacityAssessmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = CapacityAssessment
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_at",
            "version_lock",
        )


class OpportunitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Opportunity
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_at",
            "version_lock",
        )


class QuotationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quotation
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_at",
            "version_lock",
            "issue_date",
        )


class QuotationItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuotationItem
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_at",
            "version_lock",
        )


class AgreementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Agreement
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_at",
            "version_lock",
        )


class AgreementTermSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgreementTerm
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_at",
            "version_lock",
        )


class ProspectSerializer(serializers.ModelSerializer):
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