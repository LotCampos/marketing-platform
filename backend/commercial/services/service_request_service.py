from django.db import transaction

from core.exceptions import ValidationError

from master.models import Client, Installation, ServiceCatalog

from ..dtos import CreateServiceRequestDTO, ServiceRequestDTO
from ..models import ServiceRequest
from ..repositories import ServiceRequestRepository


class ServiceRequestService:
    """
    Application service for Commercial ServiceRequest operations.

    Owns application-level validation, transaction boundaries,
    repository interaction, and DTO mapping.
    """

    def __init__(
        self,
        repository: ServiceRequestRepository | None = None,
    ) -> None:
        self.repository = (
            repository or ServiceRequestRepository()
        )

    @transaction.atomic
    def create_service_request(
        self,
        data: CreateServiceRequestDTO,
    ) -> ServiceRequestDTO:
        request_number = data.request_number.strip()

        if not request_number:
            raise ValidationError(
                "Request number is required."
            )

        if not Client.objects.filter(
            id=data.client_id,
            is_deleted=False,
        ).exists():
            raise ValidationError(
                f"Client {data.client_id} does not exist."
            )

        if data.installation_id is not None:
            if not Installation.objects.filter(
                id=data.installation_id,
                client_id=data.client_id,
                is_deleted=False,
            ).exists():
                raise ValidationError(
                    "The selected installation does not "
                    "exist or does not belong to the selected client."
                )

        if not ServiceCatalog.objects.filter(
            id=data.service_catalog_id,
            is_active=True,
        ).exists():
            raise ValidationError(
                f"Service catalog {data.service_catalog_id} "
                "does not exist or is inactive."
            )

        if ServiceRequest.objects.filter(
            request_number=request_number,
        ).exists():
            raise ValidationError(
                f"A service request with number "
                f"{request_number} already exists."
            )

        user_name = (
            data.requested_by_name.strip()
            if data.requested_by_name is not None
            else None
        )

        user_email = (
            data.requested_by_email.strip().lower()
            if data.requested_by_email is not None
            else None
        )

        user_phone = (
            data.requested_by_phone.strip()
            if data.requested_by_phone is not None
            else None
        )

        description = (
            data.request_description.strip()
            if data.request_description is not None
            else None
        )

        if user_name == "":
            user_name = None

        if user_email == "":
            user_email = None

        if user_phone == "":
            user_phone = None

        if description == "":
            description = None

        service_request = ServiceRequest(
            client_id=data.client_id,
            installation_id=data.installation_id,
            service_catalog_id=data.service_catalog_id,
            request_number=request_number,
            requested_by_name=user_name,
            requested_by_email=user_email,
            requested_by_phone=user_phone,
            request_description=description,
            created_by=data.created_by,
            version_lock=1,
        )

        service_request = self.repository.add(
            service_request
        )

        return self._to_dto(service_request)

    @staticmethod
    def _to_dto(
        service_request: ServiceRequest,
    ) -> ServiceRequestDTO:
        return ServiceRequestDTO(
            id=service_request.id,
            created_at=service_request.created_at,
            version_lock=service_request.version_lock,
            client_id=service_request.client_id,
            installation_id=service_request.installation_id,
            service_catalog_id=service_request.service_catalog_id,
            request_number=service_request.request_number,
            requested_at=service_request.requested_at,
            requested_by_name=service_request.requested_by_name,
            requested_by_email=service_request.requested_by_email,
            requested_by_phone=service_request.requested_by_phone,
            request_description=service_request.request_description,
            created_by=service_request.created_by,
        )