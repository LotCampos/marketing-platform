from django.db import models
import uuid6


class User(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid6.uuid7,
        editable=False,
    )

    email = models.EmailField(
        max_length=254,
    )

    employee_number = models.CharField(
        max_length=50,
    )

    full_name = models.CharField(
        max_length=255,
    )

    system_role = models.CharField(
        max_length=50,
    )

    is_active = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    version_lock = models.PositiveIntegerField(
        default=1,
    )

    class Meta:
        db_table = "users"
        managed = False