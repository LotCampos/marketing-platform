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
    installation_type: Optional[UUID] = None


class OptimisticLockError(ValidationError):
    """
    Raised when a Prospect was modified concurrently
    after the caller obtained its expected version.
    """

    def __init__(
        self,
        message: str = "Prospect was modified concurrently.",
    ):
        super().__init__(
            {
                "version_lock": [message],
            }
        )


class ProspectService:
    """
    Domain service for Prospect lifecycle management.

    Responsibilities:
        - Input normalization
        - Business validation
        - Prospect number generation
        - Atomic persistence
        - Controlled status transitions
        - Optimistic concurrency control
        - Assignment

    Conversion to Client is intentionally handled separately.
    """

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
            ProspectStatus.PROPOSAL,
            ProspectStatus.WON,
            ProspectStatus.LOST,
        },
        ProspectStatus.PROPOSAL: {
            ProspectStatus.WON,
            ProspectStatus.LOST,
        },
        ProspectStatus.WON: {
            ProspectStatus.CONVERTED,
        },
        ProspectStatus.LOST: set(),
        ProspectStatus.CONVERTED: set(),
    }

    EMAIL_PATTERN = re.compile(
        r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
    )

    RFC_PATTERN = re.compile(
        r"^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{2,3}$"
    )

    @classmethod
    @transaction.atomic
    def create(
        cls,
        data: ProspectCreateData,
    ) -> Prospect:
        """
        Creates a Prospect atomically.
        """

        normalized = cls._normalize_create_data(data)

        cls._validate_create_data(normalized)

        prospect = Prospect.objects.create(
            prospect_number=cls._generate_prospect_number(),
            business_name=normalized.business_name,
            rfc=normalized.rfc,
            installation_type_id=normalized.installation_type,
            contact_name=normalized.contact_name,
            contact_email=normalized.contact_email,
            contact_phone=normalized.contact_phone,
            source=normalized.source,
            status=ProspectStatus.NEW,
            assigned_to=normalized.assigned_to,
            interest_description=normalized.interest_description,
            notes=normalized.notes,
        )

        return prospect

    @classmethod
    @transaction.atomic
    def change_status(
        cls,
        *,
        prospect_id: UUID,
        new_status: str,
        expected_version: int,
    ) -> Prospect:
        """
        Performs a controlled Prospect state transition
        with strict optimistic concurrency control.

        The expected version is part of the write condition.
        A stale version can never overwrite a newer version.
        """

        new_status = cls._normalize_status(new_status)

        if expected_version < 1:
            raise ValidationError(
                {
                    "version_lock": (
                        "Expected version must be greater than or equal to 1."
                    )
                }
            )

        try:
            prospect = Prospect.objects.only(
                "id",
                "status",
                "version_lock",
            ).get(
                id=prospect_id,
            )
        except Prospect.DoesNotExist:
            raise ValidationError(
                {
                    "prospect_id": (
                        "Prospect does not exist."
                    )
                }
            )

        current_status = prospect.status

        if prospect.version_lock != expected_version:
            raise OptimisticLockError()

        if current_status == new_status:
            return prospect

        allowed = cls.ALLOWED_TRANSITIONS.get(
            current_status,
            set(),
        )

        if new_status not in allowed:
            raise ValidationError(
                {
                    "status": (
                        f"Invalid Prospect transition: "
                        f"{current_status} -> {new_status}"
                    )
                }
            )

        rows_updated = (
            Prospect.objects
            .filter(
                id=prospect_id,
                version_lock=expected_version,
            )
            .update(
                status=new_status,
                version_lock=F("version_lock") + 1,
            )
        )

        if rows_updated != 1:
            raise OptimisticLockError()

        prospect.refresh_from_db()

        return prospect

    @classmethod
    @transaction.atomic
    def assign(
        cls,
        *,
        prospect_id: UUID,
        assigned_to: UUID,
        expected_version: int,
    ) -> Prospect:
        """
        Assigns a Prospect using optimistic concurrency control.
        """

        rows_updated = (
            Prospect.objects
            .filter(
                id=prospect_id,
                version_lock=expected_version,
            )
            .update(
                assigned_to=assigned_to,
                version_lock=F("version_lock") + 1,
            )
        )

        if rows_updated != 1:
            raise OptimisticLockError()

        prospect = Prospect.objects.get(
            id=prospect_id,
        )

        return prospect

    @classmethod
    def _normalize_create_data(
        cls,
        data: ProspectCreateData,
    ) -> ProspectCreateData:
        return ProspectCreateData(
            business_name=cls._clean_required(
                data.business_name
            ),
            rfc=cls._normalize_rfc(
                data.rfc
            ),
            contact_name=cls._clean_optional(
                data.contact_name
            ),
            contact_email=cls._normalize_email(
                data.contact_email
            ),
            contact_phone=cls._normalize_phone(
                data.contact_phone
            ),
            source=cls._clean_optional(
                data.source
            ),
            assigned_to=data.assigned_to,
            interest_description=cls._clean_optional(
                data.interest_description
            ),
            notes=cls._clean_optional(
                data.notes
            ),
            installation_type=data.installation_type,
        )

    @classmethod
    def _validate_create_data(
        cls,
        data: ProspectCreateData,
    ) -> None:
        errors = {}

        if not data.business_name:
            errors["business_name"] = (
                "Business name is required."
            )

        if data.rfc:
            if not cls.RFC_PATTERN.fullmatch(
                data.rfc
            ):
                errors["rfc"] = (
                    "RFC format is invalid."
                )

        if data.contact_email:
            if not cls.EMAIL_PATTERN.fullmatch(
                data.contact_email
            ):
                errors["contact_email"] = (
                    "Email format is invalid."
                )

        if errors:
            raise ValidationError(errors)

    @staticmethod
    def _clean_required(
        value: Optional[str],
    ) -> str:
        if value is None:
            return ""

        return " ".join(
            value.strip().split()
        )

    @staticmethod
    def _clean_optional(
        value: Optional[str],
    ) -> Optional[str]:
        if value is None:
            return None

        value = " ".join(
            value.strip().split()
        )

        return value or None

    @staticmethod
    def _normalize_rfc(
        value: Optional[str],
    ) -> Optional[str]:
        if not value:
            return None

        return value.strip().upper()

    @staticmethod
    def _normalize_email(
        value: Optional[str],
    ) -> Optional[str]:
        if not value:
            return None

        return value.strip().lower()

    @staticmethod
    def _normalize_phone(
        value: Optional[str],
    ) -> Optional[str]:
        if not value:
            return None

        normalized = re.sub(
            r"[^\d+]",
            "",
            value.strip(),
        )

        return normalized or None

    @staticmethod
    def _normalize_status(
        value: str,
    ) -> str:
        if not value:
            raise ValidationError(
                {
                    "status": "Status is required.",
                }
            )

        value = value.strip().upper()

        valid_statuses = {
            choice
            for choice, _ in ProspectStatus.choices
        }

        if value not in valid_statuses:
            raise ValidationError(
                {
                    "status": (
                        f"Invalid Prospect status: "
                        f"{value}"
                    )
                }
            )

        return value

    @staticmethod
    def _generate_prospect_number() -> str:
        """
        Generates a human-readable Prospect identifier.

        Format:
            PR-YYYY-XXXXXXXX
        """

        year = timezone.now().year

        suffix = uuid.uuid4().hex[:8].upper()

        return f"PR-{year}-{suffix}"
