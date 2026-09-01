from __future__ import annotations

from datetime import datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any

from django.conf import settings
from django.contrib.staticfiles import finders
from django.template.loader import render_to_string
from django.utils import timezone

from weasyprint import HTML


class QuotationPDFService:
    """
    Servicio enterprise para generación del PDF oficial de cotización.

    Responsabilidades:
        - Construir el contexto documental.
        - Normalizar partidas.
        - Determinar el tipo de documento comercial.
        - Determinar el año documental.
        - Controlar la presentación del descuento.
        - Controlar la condición de viáticos.
        - Resolver activos estáticos.
        - Renderizar HTML.
        - Convertir HTML a PDF mediante WeasyPrint.

    La persistencia y las reglas transaccionales permanecen
    fuera de este servicio.
    """

    TEMPLATE_NAME = "commercial/quotation.html"

    LOGO_STATIC_PATH = "commercial/images/logo-uicado.png"
    FIRMA_STATIC_PATH = "commercial/images/firma-director.png"

    SERVICE_NOM_016 = "NOM-016-CRE-2016"
    SERVICE_NOM_005 = "NOM-005-ASEA-2016"
    SERVICE_CONTROLES = "CONTROLES VOLUMETRICOS"

    @classmethod
    def generate(
        cls,
        *,
        quotation,
        partidas: list[dict],
        client_name: str,
        contact_name: str,
        service_name: str,
        service_type: str = "SERVICIO",
        discount: Decimal = Decimal("0.00"),
        iva_percentage: Decimal = Decimal("16.00"),
        validity_days: int = 30,
        viaticos_incluidos: bool = False,
    ) -> bytes:
        """
        Genera el PDF oficial de la cotización.

        Parámetros:
            quotation:
                Instancia de Quotation.

            partidas:
                Lista de partidas comerciales.

            client_name:
                Razón social / nombre del cliente.

            contact_name:
                Nombre del contacto.

            service_name:
                Servicio o combinación de servicios cotizados.

            service_type:
                Tipo general del servicio.

            discount:
                Descuento comercial aplicado.

            iva_percentage:
                Porcentaje de IVA.

            validity_days:
                Vigencia de la cotización.

            viaticos_incluidos:
                True:
                    Los viáticos están incluidos en el monto total.

                False:
                    Se manejan conforme a la condición comercial
                    posterior a la aceptación.
        """

        issued_at = (
            getattr(quotation, "issue_date", None)
            or getattr(quotation, "created_at", None)
            or timezone.now()
        )

        subtotal = cls._decimal(
            getattr(quotation, "subtotal", None)
        )

        tax_amount = cls._decimal(
            getattr(quotation, "tax_amount", None)
        )

        total_amount = cls._decimal(
            getattr(quotation, "total_amount", None)
        )

        discount = cls._decimal(discount)

        iva_percentage = cls._decimal(
            iva_percentage
        )

        normalized_partidas = cls._normalize_partidas(
            partidas
        )

        servicio_documental = cls._resolve_service_name(
            service_name=service_name,
            partidas=normalized_partidas,
        )

        categoria_cotizacion = cls._resolve_quotation_category(
            service_name=service_name,
            partidas=normalized_partidas,
            year=issued_at.year,
        )

        context = {
            "FECHA_DE_COTIZACION": cls._format_date(
                issued_at
            ),

            "FOLIO_COTIZACION": (
                getattr(
                    quotation,
                    "quotation_number",
                    "",
                )
                or ""
            ),

            "NUMERO_VERSION": str(
                getattr(
                    quotation,
                    "version_lock",
                    1,
                )
                or 1
            ),

            "NOMBRE_CONTACTO": (
                contact_name
                or ""
            ),

            "NOMBRE_EMPRESA": (
                client_name
                or ""
            ),

            "SERVICIO": servicio_documental,

            "TIPO_DE_SERVICIO": (
                service_type
                or "SERVICIO"
            ),

            "CATEGORIA_COTIZACION": (
                categoria_cotizacion
            ),

            "SUBTOTAL": cls._money(
                subtotal
            ),

            "DESCUENTO": cls._money(
                discount
            ),

            "MOSTRAR_DESCUENTO": (
                discount > Decimal("0.00")
            ),

            "IVA_PORCENTAJE": cls._number(
                iva_percentage
            ),

            "IVA": cls._money(
                tax_amount
            ),

            "TOTAL": cls._money(
                total_amount
            ),

            "VIGENCIA_DIAS": str(
                validity_days
            ),

            "VIATICOS_INCLUIDOS": bool(
                viaticos_incluidos
            ),

            "LOGO_URI": cls._asset_uri(
                cls.LOGO_STATIC_PATH
            ),

            "FIRMA_DIRECTOR_URI": cls._asset_uri(
                cls.FIRMA_STATIC_PATH
            ),

            "partidas": normalized_partidas,
        }

        html = render_to_string(
            cls.TEMPLATE_NAME,
            context,
        )

        base_url = str(
            Path(
                settings.BASE_DIR
            ).resolve()
        )

        return HTML(
            string=html,
            base_url=base_url,
        ).write_pdf()

    # =========================================================
    # NORMALIZACIÓN DE PARTIDAS
    # =========================================================

    @classmethod
    def _normalize_partidas(
        cls,
        partidas: list[dict] | None,
    ) -> list[dict]:
        """
        Normaliza la estructura de cada partida.

        La representación documental queda separada en:

            tipo_instalacion
            norma_oficial
            cantidad
            precio_unitario
            precio_total
            descripcion

        No se duplica el tipo de instalación en los campos
        comerciales internos.
        """

        normalized: list[dict] = []

        for partida in partidas or []:

            tipo_instalacion = (
                partida.get(
                    "tipo_instalacion"
                )
                or partida.get(
                    "unidad"
                )
                or ""
            )

            norma_oficial = (
                partida.get(
                    "norma_oficial"
                )
                or partida.get(
                    "servicio_nombre"
                )
                or ""
            )

            cantidad = (
                partida.get(
                    "cantidad"
                )
                or 0
            )

            precio_unitario = cls._money(
                cls._decimal(
                    partida.get(
                        "precio_unitario"
                    )
                )
            )

            precio_total = cls._money(
                cls._decimal(
                    partida.get(
                        "precio_total"
                    )
                )
            )

            descripcion = (
                partida.get(
                    "descripcion"
                )
                or ""
            )

            normalized.append(
                {
                    "tipo_instalacion": (
                        str(
                            tipo_instalacion
                        ).strip()
                    ),

                    "norma_oficial": (
                        str(
                            norma_oficial
                        ).strip()
                    ),

                    "unidad": (
                        str(
                            tipo_instalacion
                        ).strip()
                    ),

                    "servicio_nombre": (
                        str(
                            norma_oficial
                        ).strip()
                    ),

                    "cantidad": cantidad,

                    "precio_unitario": (
                        precio_unitario
                    ),

                    "precio_total": (
                        precio_total
                    ),

                    "descripcion": (
                        str(
                            descripcion
                        ).strip()
                    ),
                }
            )

        return normalized

    # =========================================================
    # SERVICIO DOCUMENTAL
    # =========================================================

    @classmethod
    def _resolve_service_name(
        cls,
        *,
        service_name: str | None,
        partidas: list[dict],
    ) -> str:
        """
        Determina el texto que aparece en el párrafo principal.

        Prioridad:
            1. service_name enviado por la capa de aplicación.
            2. normas detectadas en las partidas.
        """

        explicit_service = cls._clean_text(
            service_name
        )

        if explicit_service:
            return explicit_service

        services = []

        for partida in partidas:

            norma = cls._clean_text(
                partida.get(
                    "norma_oficial"
                )
            )

            if norma and norma not in services:
                services.append(
                    norma
                )

        return ", ".join(
            services
        )

    # =========================================================
    # CATEGORÍA DE COTIZACIÓN
    # =========================================================

    @classmethod
    def _resolve_quotation_category(
        cls,
        *,
        service_name: str | None,
        partidas: list[dict],
        year: int,
    ) -> str:
        """
        Determina la leyenda documental superior de la tabla.

        Reglas:

        NOM-016-CRE-2016
            -> DICTAMINACIÓN {AÑO}

        NOM-005-ASEA-2016
            -> DICTAMINACIÓN {AÑO}

        Controles Volumétricos solamente
            -> CERTIFICACION {AÑO}

        Controles Volumétricos + cualquier otro servicio
            -> CERTIFICACION Y DICTAMINACIÓN {AÑO}
        """

        source_values: list[str] = []

        if service_name:
            source_values.append(
                str(service_name)
            )

        for partida in partidas:

            norma = partida.get(
                "norma_oficial"
            )

            if norma:
                source_values.append(
                    str(norma)
                )

        combined = cls._normalize_for_matching(
            " ".join(
                source_values
            )
        )

        has_controles = (
            "CONTROLES VOLUMETRICOS"
            in combined
        )

        has_nom_016 = (
            cls.SERVICE_NOM_016
            in combined
        )

        has_nom_005 = (
            cls.SERVICE_NOM_005
            in combined
        )

        has_other_service = (
            has_nom_016
            or has_nom_005
        )

        if has_controles and has_other_service:
            return (
                f"CERTIFICACION Y "
                f"DICTAMINACIÓN {year}"
            )

        if has_controles:
            return (
                f"CERTIFICACION {year}"
            )

        if has_nom_016 or has_nom_005:
            return (
                f"DICTAMINACIÓN {year}"
            )

        return (
            f"DICTAMINACIÓN {year}"
        )

    # =========================================================
    # ASSETS
    # =========================================================

    @staticmethod
    def _asset_uri(
        static_path: str,
    ) -> str:
        """
        Resuelve un archivo mediante Django staticfiles.

        Ejemplo:

            commercial/images/logo-uicado.png

        retorna una URI file:// absoluta para WeasyPrint.
        """

        found = finders.find(
            static_path
        )

        if found:

            if isinstance(
                found,
                (list, tuple),
            ):
                if not found:
                    return ""

                found = found[0]

            path = Path(
                found
            )

            if path.exists():
                return (
                    path.resolve()
                    .as_uri()
                )

        static_root = getattr(
            settings,
            "STATIC_ROOT",
            None,
        )

        if static_root:

            path = (
                Path(
                    static_root
                )
                / static_path
            )

            if path.exists():
                return (
                    path.resolve()
                    .as_uri()
                )

        return ""

    # =========================================================
    # FORMATOS
    # =========================================================

    @staticmethod
    def _decimal(
        value: Any,
    ) -> Decimal:
        if value is None:
            return Decimal(
                "0.00"
            )

        if isinstance(
            value,
            Decimal,
        ):
            return value

        try:
            return Decimal(
                str(value)
                .replace(
                    "$",
                    "",
                )
                .replace(
                    ",",
                    "",
                )
                .strip()
            )
        except (
            InvalidOperation,
            ValueError,
            TypeError,
        ):
            return Decimal(
                "0.00"
            )

    @staticmethod
    def _money(
        value: Decimal,
    ) -> str:
        return (
            f"${value:,.2f}"
        )

    @staticmethod
    def _number(
        value: Decimal,
    ) -> str:
        return (
            f"{value:g}"
        )

    @staticmethod
    def _format_date(
        value,
    ) -> str:
        months = {
            1: "enero",
            2: "febrero",
            3: "marzo",
            4: "abril",
            5: "mayo",
            6: "junio",
            7: "julio",
            8: "agosto",
            9: "septiembre",
            10: "octubre",
            11: "noviembre",
            12: "diciembre",
        }

        return (
            f"{value.day:02d} de "
            f"{months[value.month]} de "
            f"{value.year}"
        )

    # =========================================================
    # NORMALIZACIÓN DE TEXTO
    # =========================================================

    @staticmethod
    def _clean_text(
        value: str | None,
    ) -> str:
        if not value:
            return ""

        return (
            str(value)
            .strip()
        )

    @staticmethod
    def _normalize_for_matching(
        value: str,
    ) -> str:
        """
        Normalización exclusiva para reglas internas.

        No modifica el texto que se imprime en el PDF.
        """

        import unicodedata

        normalized = (
            unicodedata.normalize(
                "NFD",
                value.upper(),
            )
        )

        normalized = "".join(
            character
            for character in normalized
            if unicodedata.category(
                character
            ) != "Mn"
        )

        return " ".join(
            normalized.split()
        )