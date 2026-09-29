from django.contrib.auth.hashers import make_password
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction

from core.exceptions import ConcurrencyError, ValidationError

from .dtos import (
    CreateUserDTO,
    SetPasswordDTO,
    UpdateUserDTO,
    UserDTO,
)
from .models import User
from .repositories import UserRepository


class UserService:
    """
    Application service for Identity users.

    Owns application-level validation, transaction boundaries,
    repository interaction, password hashing, and DTO mapping.
    """

    def __init__(self, repository: UserRepository | None = None) -> None:
        self.repository = repository or UserRepository()

    @transaction.atomic
    def create_user(self, data: CreateUserDTO) -> UserDTO:
        email = data.email.strip().lower()
        employee_number = data.employee_number.strip()
        full_name = data.full_name.strip()
        system_role = data.system_role.strip()

        if not email:
            raise ValidationError("User email is required.")

        if not employee_number:
            raise ValidationError("Employee number is required.")

        if not full_name:
            raise ValidationError("User full name is required.")

        if not system_role:
            raise ValidationError("System role is required.")

        if User.objects.filter(email=email).exists():
            raise ValidationError(
                "A user with this email already exists."
            )

        if User.objects.filter(
            employee_number=employee_number
        ).exists():
            raise ValidationError(
                "A user with this employee number already exists."
            )

        user = User(
            email=email,
            employee_number=employee_number,
            full_name=full_name,
            system_role=system_role,
            is_active=True,
            version_lock=1,
        )

        user = self.repository.add(user)

        return self._to_dto(user)

    @transaction.atomic
    def update_user(self, data: UpdateUserDTO) -> UserDTO:
        user = self.repository.get_by_id(data.user_id)

        if user is None:
            raise ValidationError(
                f"User {data.user_id} does not exist."
            )

        self._validate_expected_version(
            user,
            data.expected_version,
        )

        if data.email is not None:
            email = data.email.strip().lower()

            if not email:
                raise ValidationError(
                    "User email is required."
                )

            if User.objects.filter(
                email=email
            ).exclude(
                id=user.id
            ).exists():
                raise ValidationError(
                    "A user with this email already exists."
                )

            user.email = email

        if data.employee_number is not None:
            employee_number = data.employee_number.strip()

            if not employee_number:
                raise ValidationError(
                    "Employee number is required."
                )

            if User.objects.filter(
                employee_number=employee_number
            ).exclude(
                id=user.id
            ).exists():
                raise ValidationError(
                    "A user with this employee number already exists."
                )

            user.employee_number = employee_number

        if data.full_name is not None:
            full_name = data.full_name.strip()

            if not full_name:
                raise ValidationError(
                    "User full name is required."
                )

            user.full_name = full_name

        if data.system_role is not None:
            system_role = data.system_role.strip()

            if not system_role:
                raise ValidationError(
                    "System role is required."
                )

            user.system_role = system_role

        if data.is_active is not None:
            user.is_active = data.is_active

        user = self.repository.update(user)

        return self._to_dto(user)

    @transaction.atomic
    def set_password(self, data: SetPasswordDTO) -> UserDTO:
        user = self.repository.get_by_id(data.user_id)

        if user is None:
            raise ValidationError(
                f"User {data.user_id} does not exist."
            )

        self._validate_expected_version(
            user,
            data.expected_version,
        )

        password = data.password

        if not password:
            raise ValidationError(
                "Password is required."
            )

        try:
            validate_password(
                password,
                user=user,
            )
        except DjangoValidationError as exc:
            raise ValidationError(
                "Password does not satisfy the security policy."
            ) from exc

        user.password_hash = make_password(password)

        user = self.repository.update(user)

        return self._to_dto(user)

    @transaction.atomic
    def deactivate_user(
        self,
        user_id,
        expected_version: int,
    ) -> UserDTO:
        user = self.repository.get_by_id(user_id)

        if user is None:
            raise ValidationError(
                f"User {user_id} does not exist."
            )

        self._validate_expected_version(
            user,
            expected_version,
        )

        if not user.is_active:
            return self._to_dto(user)

        user.is_active = False

        user = self.repository.update(user)

        return self._to_dto(user)

    @transaction.atomic
    def get_user(self, user_id) -> UserDTO:
        user = self.repository.get_by_id(user_id)

        if user is None:
            raise ValidationError(
                f"User {user_id} does not exist."
            )

        return self._to_dto(user)

    @staticmethod
    def _validate_expected_version(
        user: User,
        expected_version: int,
    ) -> None:
        if user.version_lock != expected_version:
            raise ConcurrencyError(
                f"Optimistic concurrency conflict for User {user.id}."
            )

    @staticmethod
    def _to_dto(user: User) -> UserDTO:
        return UserDTO(
            id=user.id,
            email=user.email,
            employee_number=user.employee_number,
            full_name=user.full_name,
            system_role=user.system_role,
            is_active=user.is_active,
            version_lock=user.version_lock,
        )