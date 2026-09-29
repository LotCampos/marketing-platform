from dataclasses import dataclass
from typing import Optional
from uuid import UUID


@dataclass(frozen=True)
class UserDTO:
    id: UUID
    email: str
    employee_number: str
    full_name: str
    system_role: str
    is_active: bool
    version_lock: int


@dataclass(frozen=True)
class CreateUserDTO:
    email: str
    employee_number: str
    full_name: str
    system_role: str


@dataclass(frozen=True)
class UpdateUserDTO:
    user_id: UUID
    email: Optional[str] = None
    employee_number: Optional[str] = None
    full_name: Optional[str] = None
    system_role: Optional[str] = None
    is_active: Optional[bool] = None
    expected_version: int = 1


@dataclass(frozen=True)
class SetPasswordDTO:
    user_id: UUID
    password: str
    expected_version: int