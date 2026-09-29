from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass(frozen=True)
class ServiceRequestDTO:
    id: UUID
    created_at: datetime
    version_lock: int
    client_id: UUID
    installation_id: UUID | None
    service_catalog_id: UUID
    request_number: str
    requested_at: datetime
    requested_by_name: str | None
    requested_by_email: str | None
    requested_by_phone: str | None
    request_description: str | None
    created_by: UUID | None


@dataclass(frozen=True)
class CreateServiceRequestDTO:
    client_id: UUID
    installation_id: UUID | None
    service_catalog_id: UUID
    request_number: str
    requested_by_name: str | None
    requested_by_email: str | None
    requested_by_phone: str | None
    request_description: str | None
    created_by: UUID | None