from django.db import models

from core.models import UICadoBaseModel


class MasterBaseModel(UICadoBaseModel):
    """
    Abstract persistence foundation for MASTER entities.

    Physical MASTER baseline:
        id
        created_at
        version_lock

    MASTER entities intentionally do not contain:
        updated_at
        state_version
        workflow state
        SLA state
    """

    # MASTER physical schema does not contain updated_at.
    updated_at = None

    version_lock = models.PositiveIntegerField(
        default=1,
        db_column="version_lock",
    )

    class Meta:
        abstract = True


class Client(MasterBaseModel):
    rfc = models.CharField(
        max_length=13,
        db_column="rfc",
    )

    business_name = models.CharField(
        max_length=255,
        db_column="business_name",
    )

    is_deleted = models.BooleanField(
        default=False,
        db_column="is_deleted",
    )

    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        db_column="deleted_at",
    )

    deleted_by = models.UUIDField(
        null=True,
        blank=True,
        db_column="deleted_by",
    )

    deletion_reason = models.CharField(
        max_length=500,
        null=True,
        blank=True,
        db_column="deletion_reason",
    )

    class Meta:
        db_table = "clients"

    def __str__(self) -> str:
        return f"{self.business_name} ({self.rfc})"


class Contact(MasterBaseModel):
    client = models.ForeignKey(
        Client,
        on_delete=models.DO_NOTHING,
        db_column="client_id",
        related_name="contacts",
    )

    full_name = models.CharField(
        max_length=255,
        db_column="full_name",
    )

    email = models.EmailField(
        max_length=254,
        null=True,
        blank=True,
        db_column="email",
    )

    phone = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        db_column="phone",
    )

    job_title = models.CharField(
        max_length=150,
        null=True,
        blank=True,
        db_column="job_title",
    )

    is_primary = models.BooleanField(
        default=False,
        db_column="is_primary",
    )

    is_active = models.BooleanField(
        default=True,
        db_column="is_active",
    )

    is_deleted = models.BooleanField(
        default=False,
        db_column="is_deleted",
    )

    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        db_column="deleted_at",
    )

    deleted_by = models.UUIDField(
        null=True,
        blank=True,
        db_column="deleted_by",
    )

    deletion_reason = models.CharField(
        max_length=500,
        null=True,
        blank=True,
        db_column="deletion_reason",
    )

    class Meta:
        db_table = "contacts"

    def __str__(self) -> str:
        return self.full_name


class InstallationType(MasterBaseModel):
    code = models.CharField(
        max_length=100,
        unique=True,
        db_column="code",
    )

    name = models.CharField(
        max_length=255,
        db_column="name",
    )

    is_active = models.BooleanField(
        default=True,
        db_column="is_active",
    )

    class Meta:
        db_table = '"master"."installation_types"'

    def __str__(self) -> str:
        return self.name


class Installation(MasterBaseModel):
    client = models.ForeignKey(
        Client,
        on_delete=models.DO_NOTHING,
        db_column="client_id",
        related_name="installations",
    )

    installation_type = models.ForeignKey(
        InstallationType,
        on_delete=models.DO_NOTHING,
        db_column="installation_type_id",
        related_name="installations",
        null=True,
        blank=True,
    )

    address = models.TextField(
        db_column="address",
    )

    gps_lat = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        db_column="gps_lat",
    )

    gps_lng = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        db_column="gps_lng",
    )

    cre_asea_permit = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        db_column="cre_asea_permit",
    )

    is_deleted = models.BooleanField(
        default=False,
        db_column="is_deleted",
    )

    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        db_column="deleted_at",
    )

    deleted_by = models.UUIDField(
        null=True,
        blank=True,
        db_column="deleted_by",
    )

    deletion_reason = models.CharField(
        max_length=500,
        null=True,
        blank=True,
        db_column="deletion_reason",
    )

    class Meta:
        db_table = '"master"."installations"'

    def __str__(self) -> str:
        return self.address


class InstallationContact(MasterBaseModel):
    installation = models.ForeignKey(
        Installation,
        on_delete=models.DO_NOTHING,
        db_column="installation_id",
        related_name="contact_links",
    )

    contact = models.ForeignKey(
        Contact,
        on_delete=models.DO_NOTHING,
        db_column="contact_id",
        related_name="installation_links",
    )

    contact_role = models.CharField(
        max_length=100,
        db_column="contact_role",
    )

    is_primary = models.BooleanField(
        default=False,
        db_column="is_primary",
    )

    is_active = models.BooleanField(
        default=True,
        db_column="is_active",
    )

    class Meta:
        db_table = "installation_contacts"

    def __str__(self) -> str:
        return f"{self.installation_id} -> {self.contact_id}"

class CatalogVersionStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    PUBLISHED = "PUBLISHED", "Published"
    RETIRED = "RETIRED", "Retired"


class ServiceCatalog(MasterBaseModel):
    service_code = models.CharField(
        max_length=255,
        db_column="service_code",
    )

    service_name = models.CharField(
        max_length=255,
        db_column="service_name",
    )

    description = models.TextField(
        null=True,
        blank=True,
        db_column="description",
    )

    regulatory_basis = models.TextField(
        null=True,
        blank=True,
        db_column="regulatory_basis",
    )

    is_active = models.BooleanField(
        default=True,
        db_column="is_active",
    )

    class Meta:
        db_table = '"master"."service_catalog"'

    def __str__(self) -> str:
        return f"{self.service_code} - {self.service_name}"


class ServiceCatalogInstallationType(MasterBaseModel):
    service_catalog = models.ForeignKey(
        ServiceCatalog,
        on_delete=models.DO_NOTHING,
        db_column="service_catalog_id",
        related_name="installation_type_links",
    )

    installation_type = models.ForeignKey(
        InstallationType,
        on_delete=models.DO_NOTHING,
        db_column="installation_type_id",
        related_name="service_catalog_links",
    )

    class Meta:
        db_table = '"master"."service_catalog_installation_types"'
        constraints = [
            models.UniqueConstraint(
                fields=["service_catalog", "installation_type"],
                name="service_catalog_installation_types_unique",
            ),
        ]

    def __str__(self) -> str:
        return (
            f"{self.service_catalog_id} -> "
            f"{self.installation_type_id}"
        )


class ServiceCatalogVersion(MasterBaseModel):
    service_catalog = models.ForeignKey(
        ServiceCatalog,
        on_delete=models.DO_NOTHING,
        db_column="service_catalog_id",
        related_name="versions",
    )

    version_number = models.PositiveIntegerField(
        db_column="version_number",
    )

    status = models.CharField(
        max_length=9,
        choices=CatalogVersionStatus.choices,
        db_column="status",
    )

    version_hash = models.CharField(
        max_length=255,
        db_column="version_hash",
    )

    valid_from = models.DateTimeField(
        null=True,
        blank=True,
        db_column="valid_from",
    )

    valid_until = models.DateTimeField(
        null=True,
        blank=True,
        db_column="valid_until",
    )

    class Meta:
        db_table = '"master"."service_catalog_versions"'
        constraints = [
            models.UniqueConstraint(
                fields=["service_catalog", "version_number"],
                name="service_catalog_versions_unique",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.service_catalog_id} - v{self.version_number}"


class ServiceRequirement(MasterBaseModel):
    catalog_version = models.ForeignKey(
        ServiceCatalogVersion,
        on_delete=models.DO_NOTHING,
        db_column="catalog_version_id",
        related_name="requirements",
    )

    requirement_code = models.CharField(
        max_length=255,
        db_column="requirement_code",
    )

    requirement_name = models.CharField(
        max_length=255,
        db_column="requirement_name",
    )

    description = models.TextField(
        db_column="description",
    )

    requirement_type = models.CharField(
        max_length=255,
        db_column="requirement_type",
    )

    is_mandatory = models.BooleanField(
        default=True,
        db_column="is_mandatory",
    )

    display_order = models.PositiveIntegerField(
        default=1,
        db_column="display_order",
    )

    requirement_hash = models.CharField(
        max_length=255,
        db_column="requirement_hash",
    )

    parent_requirement = models.ForeignKey(
        "self",
        on_delete=models.DO_NOTHING,
        null=True,
        blank=True,
        db_column="parent_requirement_id",
        related_name="children",
    )

    class Meta:
        db_table = "service_requirements"
        constraints = [
            models.UniqueConstraint(
                fields=["catalog_version", "requirement_code"],
                name="service_requirements_unique_code",
            ),
            models.CheckConstraint(
                check=~models.Q(pk=models.F("parent_requirement_id")),
                name="service_requirements_parent_not_self",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.requirement_code} - {self.requirement_name}"


class ServiceRequirementOption(MasterBaseModel):
    requirement = models.ForeignKey(
        ServiceRequirement,
        on_delete=models.DO_NOTHING,
        db_column="requirement_id",
        related_name="options",
    )

    option_code = models.CharField(
        max_length=255,
        db_column="option_code",
    )

    option_label = models.CharField(
        max_length=255,
        db_column="option_label",
    )

    display_order = models.PositiveIntegerField(
        default=1,
        db_column="display_order",
    )

    is_active = models.BooleanField(
        default=True,
        db_column="is_active",
    )

    class Meta:
        db_table = "service_requirement_options"
        constraints = [
            models.UniqueConstraint(
                fields=["requirement", "option_code"],
                name="service_requirement_options_unique",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.option_code} - {self.option_label}"        