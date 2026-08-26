from uuid import UUID

from django.db import models
from uuid6 import uuid7


class UICadoBaseModel(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid7,
        editable=False,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        abstract = True

    def __str__(self) -> str:
        return str(self.id)

    @property
    def entity_id(self) -> UUID:
        return self.id


class VersionedModel(models.Model):
    version_lock = models.PositiveIntegerField(
        default=1,
    )

    class Meta:
        abstract = True