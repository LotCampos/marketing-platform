from uuid import UUID

from ..models import ServiceRequest


class ServiceRequestRepository:
    def add(
        self,
        service_request: ServiceRequest,
    ) -> ServiceRequest:
        service_request.save(
            force_insert=True
        )
        return service_request

    def get_by_id(
        self,
        service_request_id: UUID,
    ) -> ServiceRequest:
        return ServiceRequest.objects.get(
            id=service_request_id
        )
