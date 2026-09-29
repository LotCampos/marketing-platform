from django.db import models
from uuid6 import uuid7


class User(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid7,
        editable=False,
        db_column="id",
    )

    email = models.EmailField(
        max_length=254,
        unique=True,
        db_column="email",
    )

    employee_number = models.CharField(
        max_length=50,
        unique=True,
        db_column="employee_number",
    )

    full_name = models.CharField(
        max_length=255,
        db_column="full_name",
    )

    system_role = models.CharField(
        max_length=50,
        db_column="system_role",
    )

    is_active = models.BooleanField(
        default=True,
        db_column="is_active",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        db_column="created_at",
    )

    version_lock = models.IntegerField(
        default=1,
        db_column="version_lock",
    )

    password_hash = models.CharField(
        max_length=512,
        null=True,
        editable=False,
        db_column="password_hash",
    )

    class Meta:
        db_table = "users"
        managed = False

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["employee_number", "full_name", "system_role"]

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

    @property
    def is_staff(self):
        return self.system_role.lower() == "admin"

    @property
    def is_superuser(self):
        return self.system_role.lower() == "admin"

    def get_username(self):
        return self.email

    def __str__(self):
        return self.full_name