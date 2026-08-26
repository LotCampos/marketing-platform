from uuid import UUID

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from core.exceptions import ValidationError as ApplicationValidationError

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
    ProspectCreateData,
    ProspectService,
    ServiceRequestService,
)


class CommercialBaseViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]


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
    queryset = Prospect.objects.all().order_by(
        "-created_at"
    )
    serializer_class = ProspectSerializer

    @staticmethod
    def _parse_uuid(
        value,
        field_name: str,
    ) -> UUID:
        """
        Parses and validates UUID path parameters.
        """

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
        """
        Creates a Prospect through the domain service.

        The ViewSet is responsible only for:
            - HTTP input
            - serializer validation
            - DTO construction
            - HTTP response

        Business logic remains in ProspectService.
        """

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
        """
        Performs an optimistic-lock protected
        Prospect status transition.
        """

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
        """
        Assigns a Prospect through the domain service
        using optimistic locking.
        """

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


class QuotationViewSet(
    CommercialBaseViewSet
):
    queryset = (
        Quotation.objects.all()
        .order_by("-created_at")
    )
    serializer_class = QuotationSerializer


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