from __future__ import annotations

import re
import uuid

from dataclasses import dataclass
from typing import Optional
from uuid import UUID

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import F
from django.utils import timezone

from commercial.models import Prospect, ProspectStatus
from master.models import Installation, InstallationType, ServiceCatalog

from .prospect_conversion_service import ProspectConversionService


@dataclass(frozen=True)
class ProspectCreateData:
    business_name: str
    rfc: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    source: Optional[str] = None
    assigned_to: Optional[UUID] = None
    interest_description: Optional[str] = None
    notes: Optional[str] = None
    service_catalog_id: Optional[UUID] = None
    installation_type_id: Optional[UUID] = None


class OptimisticLockError(ValidationError):
    """Raised when a Prospect was modified concurrently."""

    def __init__(self, message: str = "Prospect was modified concurrently."):
        super().__init__({"version_lock": [message]})


class ProspectService:
    """Domain service for Prospect lifecycle management."""

    ALLOWED_TRANSITIONS = {
        ProspectStatus.NEW: {
            ProspectStatus.CONTACTED,
            ProspectStatus.QUALIFIED,
            ProspectStatus.LOST,
        },
        ProspectStatus.CONTACTED: {
            ProspectStatus.QUALIFIED,
            ProspectStatus.LOST,
        },
        ProspectStatus.QUALIFIED: {
            ProspectStatus.QUOTED,
            ProspectStatus.WON,
            ProspectStatus.LOST,
        },
        ProspectStatus.QUOTED: {
            ProspectStatus.WON,
            ProspectStatus.LOST,
        },
        ProspectStatus.WON: {
            ProspectStatus.CONVERTED,
        },
        ProspectStatus.LOST: set(),
        ProspectStatus.CONVERTED: set(),
    }

    EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    RFC_PATTERN = re.compile(r"^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{2,3}$")

    @classmethod
    @transaction.atomic
    def create(cls, data: ProspectCreateData) -> Prospect:
        normalized = cls._normalize_create_data(data)
        cls._validate_create_data(normalized)

        service = ServiceCatalog.objects.filter(
            id=normalized.service_catalog_id,
            is_active=True,
        ).first()
        if service is None:
            raise ValidationError(
                {"service_catalog_id": "Selected service does not exist or is inactive."}
            )

        installation_type = InstallationType.objects.filter(
            id=normalized.installation_type_id,
            is_active=True,
        ).first()
        if installation_type is None:
            raise ValidationError(
                {"installation_type_id": "Selected installation type does not exist or is inactive."}
            )

        allowed = ServiceCatalog.objects.filter(
            id=service.id,
            installation_type_links__installation_type_id=installation_type.id,
        ).exists()
        if not allowed:
            raise ValidationError(
                {"installation_type_id": "The selected installation type is not allowed for the selected service."}
            )

        installation = Installation.objects.create(
            client=None,
            installation_type=installation_type,
        )

        return Prospect.objects.create(
            prospect_number=cls._generate_prospect_number(),
            business_name=normalized.business_name,
            rfc=normalized.rfc,
            service_catalog_id=service.id,
            installation=installation,
            contact_name=normalized.contact_name,
            contact_email=normalized.contact_email,
            contact_phone=normalized.contact_phone,
            source=normalized.source,
            status=ProspectStatus.NEW,
            assigned_to=normalized.assigned_to,
            interest_description=normalized.interest_description,
            notes=normalized.notes,
        )

    @classmethod
    @transaction.atomic
    def change_status(
        cls,
        *,
        prospect_id: UUID,
        new_status: str,
        expected_version: int,
        changed_by: UUID | None = None,
    ) -> Prospect:
        new_status = cls._normalize_status(new_status)

        if expected_version < 1:
            raise ValidationError({"version_lock": "Expected version must be greater than or equal to 1."})

        try:
            prospect = Prospect.objects.select_for_update().get(id=prospect_id)
        except Prospect.DoesNotExist as exc:
            raise ValidationError({"prospect_id": "Prospect does not exist."}) from exc

        if prospect.version_lock != expected_version:
            raise OptimisticLockError()

        if prospect.status == new_status:
            return prospect

        allowed = cls.ALLOWED_TRANSITIONS.get(prospect.status, set())
        if new_status not in allowed:
            raise ValidationError(
                {"status": f"Invalid Prospect transition: {prospect.status} -> {new_status}"}
            )

        Prospect.objects.filter(
            id=prospect_id,
            version_lock=expected_version,
        ).update(
            status=new_status,
            version_lock=F("version_lock") + 1,
        )

        if new_status == ProspectStatus.WON:
            result = ProspectConversionService.convert(
                prospect_id=prospect_id,
                converted_by=changed_by,
            )
            return result.prospect

        prospect.refresh_from_db()
        return prospect

    @classmethod
    @transaction.atomic
    def assign(cls, *, prospect_id: UUID, assigned_to: UUID, expected_version: int) -> Prospect:
        rows_updated = (
            Prospect.objects
            .filter(id=prospect_id, version_lock=expected_version)
            .update(assigned_to=assigned_to, version_lock=F("version_lock") + 1)
        )
        if rows_updated != 1:
            raise OptimisticLockError()
        return Prospect.objects.get(id=prospect_id)

    @classmethod
    def _normalize_create_data(cls, data: ProspectCreateData) -> ProspectCreateData:
        return ProspectCreateData(
            business_name=cls._clean_required(data.business_name),
            rfc=cls._normalize_rfc(data.rfc),
            contact_name=cls._clean_optional(data.contact_name),
            contact_email=cls._normalize_email(data.contact_email),
            contact_phone=cls._normalize_phone(data.contact_phone),
            source=cls._clean_optional(data.source),
            assigned_to=data.assigned_to,
            interest_description=cls._clean_optional(data.interest_description),
            notes=cls._clean_optional(data.notes),
            service_catalog_id=data.service_catalog_id,
            installation_type_id=data.installation_type_id,
        )

    @classmethod
    def _validate_create_data(cls, data: ProspectCreateData) -> None:
        errors = {}
        if not data.business_name:
            errors["business_name"] = "Business name is required."
        if data.rfc and not cls.RFC_PATTERN.fullmatch(data.rfc):
            errors["rfc"] = "RFC format is invalid."
        if data.contact_email and not cls.EMAIL_PATTERN.fullmatch(data.contact_email):
            errors["contact_email"] = "Email format is invalid."
        if not data.service_catalog_id:
            errors["service_catalog_id"] = "Service catalog selection is required."
        if not data.installation_type_id:
            errors["installation_type_id"] = "Installation type selection is required."
        if errors:
            raise ValidationError(errors)

    @staticmethod
    def _clean_required(value: Optional[str]) -> str:
        if value is None:
            return ""
        return " ".join(value.strip().split())

    @staticmethod
    def _clean_optional(value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        value = " ".join(value.strip().split())
        return value or None

    @staticmethod
    def _normalize_rfc(value: Optional[str]) -> Optional[str]:
        return value.strip().upper() if value else None

    @staticmethod
    def _normalize_email(value: Optional[str]) -> Optional[str]:
        return value.strip().lower() if value else None

    @staticmethod
    def _normalize_phone(value: Optional[str]) -> Optional[str]:
        if not value:
            return None
        normalized = re.sub(r"[^\d+]", "", value.strip())
        return normalized or None

    @staticmethod
    def _normalize_status(value: str) -> str:
        if not value:
            raise ValidationError({"status": "Status is required."})
        value = value.strip().upper()
        valid_statuses = {choice for choice, _ in ProspectStatus.choices}
        if value not in valid_statuses:
            raise ValidationError({"status": f"Invalid Prospect status: {value}"})
        return value

    @staticmethod
    def _generate_prospect_number() -> str:
        year = timezone.now().year
        suffix = uuid.uuid4().hex[:8].upper()
        return f"PR-{year}-{suffix}"
