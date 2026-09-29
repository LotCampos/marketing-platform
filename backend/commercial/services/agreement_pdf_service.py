from pathlib import Path

from django.conf import settings
from django.template.loader import render_to_string
from django.contrib.staticfiles import finders
from weasyprint import HTML

from master.models import ServiceCatalog


class AgreementPDFService:
    """
    Generates the controlled FOR-G-016 PET-Contrato PDF.

    The document layout remains owned by the controlled template.
    This service only resolves domain data and injects it into the template.
    """

    TEMPLATE = "commercial/FOR-G-016.html"

    @classmethod
    def generate(
        cls,
        *,
        agreement,
        quotation,
        items,
        client,
        installation=None,
        contact=None,
        prospect=None,
    ) -> bytes:
        address = cls._resolve_address(installation)
        coordinates = cls._resolve_coordinates(installation)

        context = {
            "LOGO_URI": cls._asset_uri("commercial/images/logo-uicado.png"),

            "agreement_number": agreement.agreement_number,

            "legal_name": (
                agreement.legal_name
                or client.business_name
                if client is not None
                else agreement.legal_name
            ),
            "tax_id": (
                agreement.tax_id
                or client.rfc
                if client is not None
                else agreement.tax_id
            ),
            "legal_representative_name": agreement.legal_representative_name,
            "legal_representative_tax_id": agreement.legal_representative_tax_id,
            "employer_registration": agreement.employer_registration,

            "address": address,
            "municipality": installation.municipality if installation else None,
            "state": installation.state if installation else None,
            "postal_code": installation.postal_code if installation else None,
            "coordinates": coordinates,

            "contact_name": (
                contact.full_name
                if contact is not None
                else (prospect.contact_name if prospect is not None else None)
            ),
            "contact_email": (
                contact.email
                if contact is not None
                else (prospect.contact_email if prospect is not None else None)
            ),
            "contact_phone": (
                contact.phone
                if contact is not None
                else (prospect.contact_phone if prospect is not None else None)
            ),

            "items": [
                {
                    "service_code": service_catalog.service_code if service_catalog else None,
                    "description": item.description,
                    "evaluation_period": item.evaluation_period,
                    "unit": None,
                    "quantity": item.quantity,
                    "unit_price": item.unit_price,
                    "line_total": item.line_total,
                }
                for item in items
                for service_catalog in [
                    ServiceCatalog.objects.filter(
                        id=item.service_catalog_id,
                    ).first()
                ]
            ],
            "empty_service_rows": range(
                max(0, 4 - len(items))
            ),

            "subtotal": quotation.subtotal,
            "tax_amount": quotation.tax_amount,
            "total_amount": quotation.total_amount,
            "currency": quotation.currency,

            "effective_from": agreement.effective_from,
            "effective_until": agreement.effective_until,
            "signed_at": agreement.signed_at,
            "notes": agreement.notes,
        }

        html = render_to_string(cls.TEMPLATE, context)
        base_url = str(Path(settings.BASE_DIR))

        return HTML(
            string=html,
            base_url=base_url,
        ).write_pdf()

    @staticmethod
    def _resolve_address(installation):
        if installation is None:
            return None

        if installation.address:
            return installation.address

        parts = [
            installation.street,
            installation.street_number,
        ]

        return " ".join(
            str(part).strip()
            for part in parts
            if part
        ) or None

    @staticmethod
    def _resolve_coordinates(installation):
        if installation is None:
            return None

        if installation.gps_lat is None or installation.gps_lng is None:
            return None

        return f"{installation.gps_lat}, {installation.gps_lng}"

    @staticmethod
    def _asset_uri(relative_path: str) -> str:
        absolute_path = finders.find(relative_path)

        if absolute_path:
            return Path(absolute_path).resolve().as_uri()

        fallback = Path(settings.BASE_DIR) / "static" / relative_path
        return fallback.resolve().as_uri()
