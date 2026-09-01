from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Optional
from uuid import UUID

from django.core.exceptions import ValidationError
from django.db import transaction

from master.models import Client, Contact


@dataclass(frozen=True)
class ClientCreateData:
    business_name: str
    rfc: str
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None


class ClientService:
    """
    Domain service for MASTER Client creation.

    Responsibilities:
        - Normalize client data
        - Validate business identity
        - Prevent duplicate active clients by RFC
        - Atomically create Client + primary Contact
    """

    RFC_PATTERN = re.compile(
        r"^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{2,3}$"
    )

    EMAIL_PATTERN = re.compile(
        r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
    )

    @classmethod
    @transaction.atomic
    def create_from_prospect(
        cls,
        data: ClientCreateData,
    ) -> tuple[Client, Contact | None]:

        normalized = cls._normalize(data)
        cls._validate(normalized)

        existing = (
            Client.objects
            .select_for_update()
            .filter(
                rfc=normalized.rfc,
                is_deleted=False,
            )
            .first()
        )

        if existing is not None:
            raise ValidationError(
                {
                    "rfc": (
                        "An active Client already exists "
                        "with this RFC."
                    )
                }
            )

        client = Client.objects.create(
            rfc=normalized.rfc,
            business_name=normalized.business_name,
        )

        contact = None

        if normalized.contact_name:
            contact = Contact.objects.create(
                client=client,
                full_name=normalized.contact_name,
                email=normalized.contact_email,
                phone=normalized.contact_phone,
                is_primary=True,
                is_active=True,
            )

        return client, contact

    @staticmethod
    def _normalize(
        data: ClientCreateData,
    ) -> ClientCreateData:

        business_name = " ".join(
            data.business_name.strip().split()
        )

        rfc = (
            data.rfc.strip().upper()
            if data.rfc
            else ""
        )

        contact_name = (
            " ".join(data.contact_name.strip().split())
            if data.contact_name
            else None
        )

        contact_email = (
            data.contact_email.strip().lower()
            if data.contact_email
            else None
        )

        contact_phone = (
            re.sub(
                r"[^\d+]",
                "",
                data.contact_phone.strip(),
            )
            if data.contact_phone
            else None
        )

        return ClientCreateData(
            business_name=business_name,
            rfc=rfc,
            contact_name=contact_name,
            contact_email=contact_email,
            contact_phone=contact_phone,
        )

    @classmethod
    def _validate(
        cls,
        data: ClientCreateData,
    ) -> None:

        errors = {}

        if not data.business_name:
            errors["business_name"] = (
                "Business name is required."
            )

        if not data.rfc:
            errors["rfc"] = (
                "RFC is required."
            )
        elif not cls.RFC_PATTERN.fullmatch(
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
