from decimal import Decimal
from uuid import UUID

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError as DRFValidationError
from django.http import HttpResponse
from rest_framework.response import Response
from rest_framework.renderers import BaseRenderer

from core.exceptions import ValidationError as ApplicationValidationError
from identity.permissions import (
    CanAssign,
    CanCreate,
    CanDelete,
    CanDownload,
    CanUpdate,
    CanView,
    IsAdmin,
)
from master.models import Client, Contact, ServiceCatalog

from .dtos import CreateServiceRequestDTO
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
from .serializers import (
    AgreementSerializer,
    AgreementTermSerializer,
    CapacityAssessmentSerializer,
    OpportunitySerializer,
    ProspectSerializer,
    QuotationItemSerializer,
    QuotationSerializer,
    ServiceRequestSerializer,
)
from .services import (
    OptimisticLockError,
    OpportunityCreateData,
    OpportunityService,
    ProspectCreateData,
    ProspectService,
    QuotationCreateData,
    QuotationItemCreateData,
    QuotationService,
    ServiceRequestService,
)
from .services.quotation_pdf_service import QuotationPDFService


class PDFRenderer(BaseRenderer):
    media_type = "application/pdf"
    format = "pdf"
    charset = None
    render_style = "binary"

    def render(
        self,
        data,
        accepted_media_type=None,
        renderer_context=None,
    ):
        return data


class CommercialBaseViewSet(viewsets.ModelViewSet):
    permission_classes = [CanView]

    permission_by_action = {
        "list": CanView,
        "retrieve": CanView,
        "create": CanCreate,
        "update": CanUpdate,
        "partial_update": CanUpdate,
        "destroy": CanDelete,
    }

    def get_permissions(self):
        permission_class = self.permission_by_action.get(
            getattr(self, "action", None),
        )

        if permission_class is None:
            return [IsAdmin()]

        return [permission_class()]


class ServiceRequestViewSet(CommercialBaseViewSet):
    queryset = ServiceRequest.objects.all().order_by(
        "-created_at"
    )
    serializer_class = ServiceRequestSerializer

    def create(
        self,
        request,
        *args,
        **kwargs,
    ):
        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        authenticated_user_id = None

        request_user = getattr(
            request,
            "user",
            None,
        )

        if (
            request_user is not None
            and getattr(
                request_user,
                "is_authenticated",
                False,
            )
        ):
            user_id = getattr(
                request_user,
                "id",
                None,
            )

            if user_id is not None:
                authenticated_user_id = UUID(
                    str(user_id)
                )

        data = CreateServiceRequestDTO(
            client_id=serializer.validated_data[
                "client_id"
            ],
            installation_id=serializer.validated_data.get(
                "installation_id"
            ),
            service_catalog_id=serializer.validated_data[
                "service_catalog_id"
            ],
            request_number=serializer.validated_data[
                "request_number"
            ],
            requested_by_name=serializer.validated_data.get(
                "requested_by_name"
            ),
            requested_by_email=serializer.validated_data.get(
                "requested_by_email"
            ),
            requested_by_phone=serializer.validated_data.get(
                "requested_by_phone"
            ),
            request_description=serializer.validated_data.get(
                "request_description"
            ),
            created_by=authenticated_user_id,
        )

        try:
            service_request = (
                ServiceRequestService()
                .create_service_request(data)
            )

        except ApplicationValidationError as exc:
            raise DRFValidationError(
                {"detail": str(exc)}
            ) from exc

        response_serializer = self.get_serializer(
            ServiceRequest.objects.get(
                id=service_request.id
            )
        )

        headers = self.get_success_headers(
            response_serializer.data
        )

        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers,
        )


class ProspectViewSet(CommercialBaseViewSet):
    permission_by_action = {
        **CommercialBaseViewSet.permission_by_action,
        "assign": CanAssign,
        "change_status": CanUpdate,
    }

    queryset = Prospect.objects.all().order_by(
        "-created_at"
    )
    serializer_class = ProspectSerializer

    @staticmethod
    def _parse_uuid(
        value,
        field_name: str,
    ) -> UUID:
        try:
            return UUID(str(value))

        except (
            TypeError,
            ValueError,
            AttributeError,
        ):
            raise DRFValidationError(
                {
                    field_name: (
                        f"{field_name} must be a valid UUID."
                    )
                }
            )

    def create(
        self,
        request,
        *args,
        **kwargs,
    ):
        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        data = ProspectCreateData(
            business_name=serializer.validated_data[
                "business_name"
            ],
            rfc=serializer.validated_data.get(
                "rfc"
            ),
            contact_name=serializer.validated_data.get(
                "contact_name"
            ),
            contact_email=serializer.validated_data.get(
                "contact_email"
            ),
            contact_phone=serializer.validated_data.get(
                "contact_phone"
            ),
            source=serializer.validated_data.get(
                "source"
            ),
            assigned_to=serializer.validated_data.get(
                "assigned_to"
            ),
            interest_description=serializer.validated_data.get(
                "interest_description"
            ),
            notes=serializer.validated_data.get(
                "notes"
            ),
            installation_type=(
                serializer.validated_data.get(
                    "installation_type"
                ).id
                if serializer.validated_data.get(
                    "installation_type"
                )
                else None
            ),
        )

        try:
            prospect = ProspectService.create(
                data
            )

        except ApplicationValidationError as exc:
            raise DRFValidationError(
                {"detail": exc.message_dict}
            ) from exc

        response_serializer = self.get_serializer(
            Prospect.objects.get(
                id=prospect.id
            )
        )

        headers = self.get_success_headers(
            response_serializer.data
        )

        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers,
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="change-status",
    )
    def change_status(
        self,
        request,
        pk=None,
    ):
        prospect_id = self._parse_uuid(
            pk,
            "prospect_id",
        )

        new_status = request.data.get(
            "status"
        )

        expected_version = request.data.get(
            "expected_version"
        )

        if expected_version is None:
            raise DRFValidationError(
                {
                    "expected_version": (
                        "expected_version is required."
                    )
                }
            )

        try:
            expected_version = int(
                expected_version
            )

        except (
            TypeError,
            ValueError,
        ):
            raise DRFValidationError(
                {
                    "expected_version": (
                        "expected_version must be an integer."
                    )
                }
            )

        try:
            prospect = ProspectService.change_status(
                prospect_id=prospect_id,
                new_status=new_status,
                expected_version=expected_version,
            )

        except OptimisticLockError:
            return Response(
                {
                    "code": (
                        "OPTIMISTIC_LOCK_CONFLICT"
                    ),
                    "detail": (
                        "Prospect was modified "
                        "concurrently."
                    ),
                },
                status=status.HTTP_409_CONFLICT,
            )

        except ApplicationValidationError as exc:
            raise DRFValidationError(
                {"detail": exc.message_dict}
            ) from exc

        return Response(
            self.get_serializer(prospect).data,
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="assign",
    )
    def assign(
        self,
        request,
        pk=None,
    ):
        prospect_id = self._parse_uuid(
            pk,
            "prospect_id",
        )

        assigned_to = request.data.get(
            "assigned_to"
        )

        expected_version = request.data.get(
            "expected_version"
        )

        if not assigned_to:
            raise DRFValidationError(
                {
                    "assigned_to": (
                        "assigned_to is required."
                    )
                }
            )

        if expected_version is None:
            raise DRFValidationError(
                {
                    "expected_version": (
                        "expected_version is required."
                    )
                }
            )

        try:
            assigned_to = UUID(
                str(assigned_to)
            )

        except (
            TypeError,
            ValueError,
        ):
            raise DRFValidationError(
                {
                    "assigned_to": (
                        "assigned_to must be a valid UUID."
                    )
                }
            )

        try:
            expected_version = int(
                expected_version
            )

        except (
            TypeError,
            ValueError,
        ):
            raise DRFValidationError(
                {
                    "expected_version": (
                        "expected_version must be an integer."
                    )
                }
            )

        try:
            prospect = ProspectService.assign(
                prospect_id=prospect_id,
                assigned_to=assigned_to,
                expected_version=expected_version,
            )

        except OptimisticLockError:
            return Response(
                {
                    "code": (
                        "OPTIMISTIC_LOCK_CONFLICT"
                    ),
                    "detail": (
                        "Prospect was modified "
                        "concurrently."
                    ),
                },
                status=status.HTTP_409_CONFLICT,
            )

        except ApplicationValidationError as exc:
            raise DRFValidationError(
                {"detail": exc.message_dict}
            ) from exc

        return Response(
            self.get_serializer(prospect).data,
            status=status.HTTP_200_OK,
        )


class CapacityAssessmentViewSet(
    CommercialBaseViewSet
):
    queryset = (
        CapacityAssessment.objects.all()
        .order_by("-created_at")
    )
    serializer_class = CapacityAssessmentSerializer


class OpportunityViewSet(
    CommercialBaseViewSet
):
    queryset = (
        Opportunity.objects.all()
        .order_by("-created_at")
    )
    serializer_class = OpportunitySerializer

    def create(
        self,
        request,
        *args,
        **kwargs,
    ):
        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        data = OpportunityCreateData(
            opportunity_number=serializer.validated_data[
                "opportunity_number"
            ],
            service_request_id=serializer.validated_data[
                "service_request_id"
            ],
            client_id=serializer.validated_data[
                "client_id"
            ],
            title=serializer.validated_data[
                "title"
            ],
            assigned_to=serializer.validated_data.get(
                "assigned_to"
            ),
            description=serializer.validated_data.get(
                "description"
            ),
            estimated_value=serializer.validated_data.get(
                "estimated_value"
            ),
        )

        try:
            opportunity = OpportunityService().create(
                data
            )

        except ApplicationValidationError as exc:
            raise DRFValidationError(
                {"detail": exc.message_dict}
            ) from exc

        response_serializer = self.get_serializer(
            opportunity
        )

        headers = self.get_success_headers(
            response_serializer.data
        )

        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers,
        )


class QuotationViewSet(
    CommercialBaseViewSet
):
    permission_by_action = {
        **CommercialBaseViewSet.permission_by_action,
        "pdf": CanDownload,
    }

    queryset = (
        Quotation.objects.all()
        .order_by("-created_at")
    )

    serializer_class = QuotationSerializer

    def create(
        self,
        request,
        *args,
        **kwargs,
    ):
        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        validated_data = serializer.validated_data

        item_data = tuple(
            QuotationItemCreateData(
                service_catalog_id=item[
                    "service_catalog_id"
                ],
                description=item[
                    "description"
                ],
                quantity=item[
                    "quantity"
                ],
                unit_price=item[
                    "unit_price"
                ],
            )
            for item in validated_data[
                "items"
            ]
        )

        data = QuotationCreateData(
            quotation_number=validated_data[
                "quotation_number"
            ],
            opportunity_id=validated_data[
                "opportunity_id"
            ],
            client_id=validated_data[
                "client_id"
            ],
            issued_by=validated_data.get(
                "issued_by"
            ),
            valid_until=validated_data.get(
                "valid_until"
            ),
            currency=validated_data.get(
                "currency",
                "MXN",
            ),
            notes=validated_data.get(
                "notes"
            ),
            tax_percentage=validated_data.get(
                "tax_percentage",
                Decimal("16.00"),
            ),
            items=item_data,
        )

        try:
            quotation = (
                QuotationService()
                .create(data)
            )

        except ApplicationValidationError as exc:
            raise DRFValidationError(
                {"detail": exc.message_dict}
            ) from exc

        response_serializer = self.get_serializer(
            quotation
        )

        headers = self.get_success_headers(
            response_serializer.data
        )

        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers,
        )

    @action(
        detail=True,
        methods=["get"],
        url_path="pdf",
        url_name="pdf",
        renderer_classes=[PDFRenderer],
    )
    def pdf(
        self,
        request,
        pk=None,
    ):
        quotation = self.get_object()

        items = list(
            QuotationItem.objects.filter(
                quotation_id=quotation.id
            ).order_by("created_at")
        )

        if not items:
            raise DRFValidationError(
                {
                    "detail": (
                        "La cotización no contiene partidas "
                        "y no puede generar el PDF oficial."
                    )
                }
            )

        client = Client.objects.filter(
            id=quotation.client_id,
            is_deleted=False,
        ).first()

        if client is None:
            raise DRFValidationError(
                {
                    "detail": (
                        "No se encontró el cliente activo "
                        "asociado a la cotización."
                    )
                }
            )

        contact = (
            Contact.objects.filter(
                client_id=client.id,
                is_active=True,
                is_deleted=False,
            )
            .order_by(
                "-is_primary",
                "created_at",
            )
            .first()
        )

        service_catalog_ids = {
            item.service_catalog_id
            for item in items
        }

        service_catalogs = {
            catalog.id: catalog
            for catalog in ServiceCatalog.objects.filter(
                id__in=service_catalog_ids,
                is_active=True,
            )
        }

        missing_catalog_ids = (
            service_catalog_ids
            - set(service_catalogs.keys())
        )

        if missing_catalog_ids:
            raise DRFValidationError(
                {
                    "detail": (
                        "Una o más partidas de la cotización "
                        "no tienen un servicio de catálogo activo."
                    )
                }
            )


        installation = (
            client.installations
            .filter(
                installation_type__isnull=False,
            )
            .select_related(
                "installation_type",
            )
            .first()
        )

        installation_type_name = ""

        if (
            installation is not None
            and installation.installation_type is not None
            and installation.installation_type.name
        ):
            installation_type_name = (
                installation.installation_type.name.strip()
            )
        partidas = []

        service_names = []

        for item in items:
            catalog = service_catalogs[
                item.service_catalog_id
            ]

            if catalog.service_name:
                service_names.append(
                    catalog.service_name.strip()
                )

            partidas.append(
                {
                    "tipo_instalacion": (
                        installation_type_name
                        or ""
                    ),
                    "norma_oficial": (
                        catalog.regulatory_basis
                        or catalog.service_name
                        or ""
                    ),
                    "cantidad": (
                        int(item.quantity)
                        if item.quantity == int(item.quantity)
                        else item.quantity
                    ),
                    "precio_unitario": item.unit_price,
                    "precio_total": item.line_total,
                    "descripcion": item.description,
                }
            )

        service_names = list(
            dict.fromkeys(
                name
                for name in service_names
                if name
            )
        )

        service_name = ", ".join(
            service_names
        )

        pdf = QuotationPDFService.generate(
            quotation=quotation,
            partidas=partidas,
            client_name=client.business_name,
            contact_name=(
                contact.full_name
                if contact is not None
                else ""
            ),
            service_name=service_name,
            service_type="SERVICIO",
            validity_days=(
                (
                    quotation.valid_until
                    - quotation.issue_date.date()
                ).days
                if quotation.valid_until
                else 30
            ),
            viaticos_incluidos=False,
        )

        response = HttpResponse(
            pdf,
            content_type="application/pdf",
        )

        response[
            "Content-Disposition"
        ] = (
            'inline; '
            f'filename="cotizacion-'
            f'{quotation.quotation_number}.pdf"'
        )

        return response


class QuotationItemViewSet(
    CommercialBaseViewSet
):
    queryset = (
        QuotationItem.objects.all()
        .order_by("-created_at")
    )

    serializer_class = QuotationItemSerializer


class AgreementViewSet(
    CommercialBaseViewSet
):
    queryset = (
        Agreement.objects.all()
        .order_by("-created_at")
    )
    serializer_class = AgreementSerializer


class AgreementTermViewSet(
    CommercialBaseViewSet
):
    queryset = (
        AgreementTerm.objects.all()
        .order_by("-created_at")
    )
    serializer_class = AgreementTermSerializer
