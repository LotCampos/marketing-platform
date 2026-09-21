from __future__ import annotations

from pathlib import Path

from django.conf import settings
from django.contrib.staticfiles import finders
from django.core.exceptions import ValidationError
from django.template.loader import render_to_string
from django.utils import timezone
from weasyprint import HTML

from master.models import Client, ServiceCatalog

from ..models import Agreement, Opportunity, Prospect, Quotation, QuotationItem


class AgreementPDFService:
    """Generates the official FOR-G-016 Rev.18 PET-Contrato PDF."""

    TEMPLATE_NAME = "commercial/pet_contrato.html"
    LOGO_STATIC_PATH = "commercial/images/logo-uicado.png"

    @classmethod
    def generate(cls, agreement: Agreement) -> bytes:
        quotation = Quotation.objects.get(id=agreement.quotation_id)
        opportunity = Opportunity.objects.get(id=agreement.opportunity_id)
        prospect = Prospect.objects.select_related("installation").get(id=opportunity.prospect_id)
        installation = prospect.installation
        client = Client.objects.get(id=agreement.client_id, is_deleted=False)

        if installation is None:
            raise ValidationError({"agreement": "The agreement prospect has no installation."})

        items = list(QuotationItem.objects.filter(quotation_id=quotation.id).order_by("created_at"))
        if not items:
            raise ValidationError({"agreement": "The quotation has no service items."})

        catalog_ids = {item.service_catalog_id for item in items}
        catalogs = {
            catalog.id: catalog
            for catalog in ServiceCatalog.objects.filter(id__in=catalog_ids, is_active=True)
        }
        if catalog_ids - set(catalogs):
            raise ValidationError({"agreement": "One or more quotation services are not active in the catalog."})

        servicios = []
        for item in items:
            catalog = catalogs[item.service_catalog_id]
            servicios.append({
                "clave": catalog.service_code or "",
                "concepto": item.description or catalog.service_name or "",
                "periodo": item.evaluation_period or "",
                "unidad": item.unit or "",
                "cantidad": item.quantity,
                "costo_unitario": item.unit_price,
            })

        generated_at = getattr(agreement, "created_at", None) or timezone.now()
        context = {
            "PET_NUMERO": agreement.pet_number or "",
            "LOGO_URI": cls._asset_uri(cls.LOGO_STATIC_PATH),
            "CLIENTE_RAZON_SOCIAL": client.business_name or prospect.business_name or "",
            "CLIENTE_RFC": client.rfc or prospect.rfc or "",
            "INSTALACION_DOMICILIO": installation.address or " ".join(part for part in [installation.street, installation.street_number] if part) or "",
            "INSTALACION_COLONIA": installation.colony or "",
            "INSTALACION_MUNICIPIO": installation.municipality or "",
            "INSTALACION_ESTADO": installation.state or "",
            "INSTALACION_CP": installation.postal_code or "",
            "GPS_LAT": installation.gps_lat or "",
            "GPS_LNG": installation.gps_lng or "",
            "PERMISO_CONCESION": installation.cre_asea_permit or "",
            "CONTACTO_EMAIL": prospect.contact_email or "",
            "CONTACTO_TELEFONO": prospect.contact_phone or "",
            "REPRESENTANTE_LEGAL": agreement.legal_representative or "",
            "REPRESENTANTE_RFC": agreement.legal_representative_rfc or "",
            "SOLICITANTE": prospect.contact_name or "",
            "SERVICIOS": servicios,
            "IMPORTE": quotation.subtotal,
            "IVA": quotation.tax_amount,
            "TOTAL": quotation.total_amount,
            "MUNICIPIO_FIRMA": installation.municipality or "",
            "DIA_FIRMA": generated_at.day,
            "MES_FIRMA": cls._month(generated_at.month),
            "ANIO_FIRMA": generated_at.year,
            "TRABAJO_URGENTE": agreement.urgent_work,
            "CONDICIONES_ESPECIALES": agreement.special_conditions,
            "RESPONSABLE_TECNICO": agreement.technical_responsible or "",
            "CONDICIONES_IMPARCIALIDAD": [],
        }

        html = render_to_string(cls.TEMPLATE_NAME, context)
        base_url = str(Path(settings.BASE_DIR).resolve())
        return HTML(string=html, base_url=base_url).write_pdf()

    @staticmethod
    def _month(month: int) -> str:
        return (
            "enero", "febrero", "marzo", "abril", "mayo", "junio",
            "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
        )[month - 1]

    @staticmethod
    def _asset_uri(static_path: str) -> str:
        found = finders.find(static_path)
        if isinstance(found, (list, tuple)):
            found = found[0] if found else None
        if found and Path(found).exists():
            return Path(found).resolve().as_uri()
        static_root = getattr(settings, "STATIC_ROOT", None)
        if static_root:
            path = Path(static_root) / static_path
            if path.exists():
                return path.resolve().as_uri()
        return ""
