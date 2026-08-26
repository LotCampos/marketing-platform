from typing import Optional
from uuid import UUID

from django.db import transaction

from core.exceptions import ConcurrencyError
from core.repositories.base import Repository

from .models import User


class UserRepository(Repository[User, UUID]):
    """
    Django repository for identity.User.

    Persistence concerns remain isolated from the application
    and domain layers.
    """

    def get_by_id(self, entity_id: UUID) -> Optional[User]:
        return (
            User.objects
            .filter(id=entity_id)
            .first()
        )

    def add(self, entity: User) -> User:
        entity.save(force_insert=True)
        return entity

    def update(self, entity: User) -> User:
        """
        Persist an existing user using optimistic concurrency.

        The update succeeds only when the database version matches
        the entity version loaded by the application.
        """

        current_version = entity.version_lock

        updated = (
            User.objects
            .filter(
                id=entity.id,
                version_lock=current_version,
            )
            .update(
                email=entity.email,
                employee_number=entity.employee_number,
                full_name=entity.full_name,
                system_role=entity.system_role,
                is_active=entity.is_active,
                version_lock=current_version + 1,
            )
        )

        if updated != 1:
            raise ConcurrencyError(
                f"Optimistic concurrency conflict for User {entity.id}."
            )

        entity.version_lock = current_version + 1
        return entity

    def delete(self, entity: User) -> None:
        """
        Identity users are not physically deleted through the repository.
        Deactivation is the lifecycle mechanism.
        """

        raise NotImplementedError(
            "Identity users must be deactivated, not physically deleted."
        )