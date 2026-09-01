from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.hashers import make_password
from django.db import transaction

from core.exceptions import ConcurrencyError, ValidationError

from .dtos import SetPasswordDTO
from .models import User
from .repositories import UserRepository


class CredentialService:
    """
    Application service responsible for user credentials.

    Passwords are never persisted in plain text.
    Only Django-compatible password hashes are stored.
    """

    def __init__(
        self,
        repository: UserRepository | None = None,
    ) -> None:
        self.repository = repository or UserRepository()

    @transaction.atomic
    def set_password(self, data: SetPasswordDTO) -> None:
        user = self.repository.get_by_id(data.user_id)

        if user is None:
            raise ValidationError(
                f"User {data.user_id} does not exist."
            )

        if not user.is_active:
            raise ValidationError(
                "Cannot set credentials for an inactive user."
            )

        if user.version_lock != data.expected_version:
            raise ConcurrencyError(
                f"Optimistic concurrency conflict for User {user.id}."
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
        except Exception as exc:
            raise ValidationError(
                str(exc)
            ) from exc

        user.password_hash = make_password(password)

        self.repository.update(user)