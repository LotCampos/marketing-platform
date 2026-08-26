from decimal import Decimal

from django.db import models

from core.models import UICadoBaseModel


class CommercialBaseModel(UICadoBaseModel):
    """
    Abstract persistence foundation for COMMERCIAL entities.

    Physical COMMERCIAL baseline:
        id
        created_at
        version_lock

    Schema resolution:
        PostgreSQL search_path resolves COMMERCIAL tables.

    COMMERCIAL does not inherit workflow state directly.
    Workflow ownership remains in the workflow layer.
    """

    updated_at = None

    version_lock = models.PositiveIntegerField(
        default=1,
        db_column="version_lock",
    )

    class Meta:
        abstract = True


class AgreementStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    PENDING_SIGNATURE = "PENDING_SIGNATURE", "Pending signature"
    SIGNED = "SIGNED", "Signed"
    ACTIVE = "ACTIVE", "Active"
    EXPIRED = "EXPIRED", "Expired"
    TERMINATED = "TERMINATED", "Terminated"


class CapacityAssessmentStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    PENDING_REVIEW = "PENDING_REVIEW", "Pending review"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"
    EXPIRED = "EXPIRED", "Expired"


class ServiceRequest(CommercialBaseModel):
    client_id = models.UUIDField(
        db_column="client_id",
    )

    installation_id = models.UUIDField(
        db_column="installation_id",
        null=True,
        blank=True,
    )

    service_catalog_id = models.UUIDField(
        db_column="service_catalog_id",
    )

    request_number = models.CharField(
        max_length=50,
        db_column="request_number",
    )

    requested_at = models.DateTimeField(
        db_column="requested_at",
        auto_now_add=True,
    )

    requested_by_name = models.CharField(
        max_length=255,
        db_column="requested_by_name",
        null=True,
        blank=True,
    )

    requested_by_email = models.CharField(
        max_length=254,
        db_column="requested_by_email",
        null=True,
        blank=True,
    )

    requested_by_phone = models.CharField(
        max_length=50,
        db_column="requested_by_phone",
        null=True,
        blank=True,
    )

    request_description = models.TextField(
        db_column="request_description",
        null=True,
        blank=True,
    )

    created_by = models.UUIDField(
        db_column="created_by",
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "service_requests"

    def __str__(self) -> str:
        return self.request_number


class CapacityAssessment(CommercialBaseModel):
    service_request_id = models.UUIDField(
        db_column="service_request_id",
    )

    assessment_number = models.CharField(
        max_length=50,
        db_column="assessment_number",
    )

    status = models.CharField(
        max_length=18,
        choices=CapacityAssessmentStatus.choices,
        db_column="status",
    )

    assessed_by = models.UUIDField(
        db_column="assessed_by",
        null=True,
        blank=True,
    )

    assessed_at = models.DateTimeField(
        db_column="assessed_at",
        null=True,
        blank=True,
    )

    technical_capacity = models.BooleanField(
        db_column="technical_capacity",
        null=True,
        blank=True,
    )

    personnel_capacity = models.BooleanField(
        db_column="personnel_capacity",
        null=True,
        blank=True,
    )

    equipment_capacity = models.BooleanField(
        db_column="equipment_capacity",
        null=True,
        blank=True,
    )

    schedule_capacity = models.BooleanField(
        db_column="schedule_capacity",
        null=True,
        blank=True,
    )

    observations = models.TextField(
        db_column="observations",
        null=True,
        blank=True,
    )

    rejection_reason = models.TextField(
        db_column="rejection_reason",
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "capacity_assessments"

    def __str__(self) -> str:
        return self.assessment_number


class Opportunity(CommercialBaseModel):
    opportunity_number = models.CharField(
        max_length=50,
        db_column="opportunity_number",
    )

    service_request_id = models.UUIDField(
        db_column="service_request_id",
    )

    client_id = models.UUIDField(
        db_column="client_id",
    )

    assigned_to = models.UUIDField(
        db_column="assigned_to",
        null=True,
        blank=True,
    )

    title = models.CharField(
        max_length=255,
        db_column="title",
    )

    description = models.TextField(
        db_column="description",
        null=True,
        blank=True,
    )

    estimated_value = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        db_column="estimated_value",
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "opportunities"

    def __str__(self) -> str:
        return self.opportunity_number


class Quotation(CommercialBaseModel):
    quotation_number = models.CharField(
        max_length=50,
        db_column="quotation_number",
    )

    opportunity_id = models.UUIDField(
        db_column="opportunity_id",
    )

    client_id = models.UUIDField(
        db_column="client_id",
    )

    issued_by = models.UUIDField(
        db_column="issued_by",
    )

    issue_date = models.DateTimeField(
        db_column="issue_date",
        auto_now_add=True,
    )

    valid_until = models.DateField(
        db_column="valid_until",
        null=True,
        blank=True,
    )

    subtotal = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        db_column="subtotal",
        default=Decimal("0"),
    )

    tax_amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        db_column="tax_amount",
        default=Decimal("0"),
    )

    total_amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        db_column="total_amount",
        default=Decimal("0"),
    )

    currency = models.CharField(
        max_length=3,
        db_column="currency",
        default="MXN",
    )

    notes = models.TextField(
        db_column="notes",
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "quotations"

    def __str__(self) -> str:
        return self.quotation_number


class QuotationItem(CommercialBaseModel):
    quotation_id = models.UUIDField(
        db_column="quotation_id",
    )

    service_catalog_id = models.UUIDField(
        db_column="service_catalog_id",
    )

    description = models.CharField(
        max_length=500,
        db_column="description",
    )

    quantity = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        db_column="quantity",
        default=Decimal("1"),
    )

    unit_price = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        db_column="unit_price",
        default=Decimal("0"),
    )

    line_total = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        db_column="line_total",
        default=Decimal("0"),
    )

    class Meta:
        db_table = "quotation_items"

    def __str__(self) -> str:
        return self.description


class Agreement(CommercialBaseModel):
    agreement_number = models.CharField(
        max_length=50,
        db_column="agreement_number",
    )

    quotation_id = models.UUIDField(
        db_column="quotation_id",
    )

    opportunity_id = models.UUIDField(
        db_column="opportunity_id",
    )

    client_id = models.UUIDField(
        db_column="client_id",
    )

    status = models.CharField(
        max_length=17,
        choices=AgreementStatus.choices,
        db_column="status",
    )

    signed_by = models.UUIDField(
        db_column="signed_by",
        null=True,
        blank=True,
    )

    signed_at = models.DateTimeField(
        db_column="signed_at",
        null=True,
        blank=True,
    )

    effective_from = models.DateField(
        db_column="effective_from",
        null=True,
        blank=True,
    )

    effective_until = models.DateField(
        db_column="effective_until",
        null=True,
        blank=True,
    )

    terms_hash = models.CharField(
        max_length=128,
        db_column="terms_hash",
        null=True,
        blank=True,
    )

    notes = models.TextField(
        db_column="notes",
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "agreements"

    def __str__(self) -> str:
        return self.agreement_number


class AgreementTerm(CommercialBaseModel):
    agreement_id = models.UUIDField(
        db_column="agreement_id",
    )

    term_code = models.CharField(
        max_length=50,
        db_column="term_code",
    )

    term_description = models.TextField(
        db_column="term_description",
    )

    is_mandatory = models.BooleanField(
        db_column="is_mandatory",
        default=True,
    )

    class Meta:
        db_table = "agreement_terms"

    def __str__(self) -> str:
        return self.term_code


class ProspectStatus(models.TextChoices):
    NEW = "NEW", "New"
    CONTACTED = "CONTACTED", "Contacted"
    QUALIFIED = "QUALIFIED", "Qualified"
    PROPOSAL = "PROPOSAL", "Proposal"
    WON = "WON", "Won"
    LOST = "LOST", "Lost"
    CONVERTED = "CONVERTED", "Converted"


class Prospect(CommercialBaseModel):
    prospect_number = models.CharField(
        max_length=50,
        db_column="prospect_number",
    )

    business_name = models.CharField(
        max_length=255,
        db_column="business_name",
    )

    rfc = models.CharField(
        max_length=13,
        db_column="rfc",
        null=True,
        blank=True,
    )

    contact_name = models.CharField(
        max_length=255,
        db_column="contact_name",
        null=True,
        blank=True,
    )

    contact_email = models.EmailField(
        max_length=254,
        db_column="contact_email",
        null=True,
        blank=True,
    )

    contact_phone = models.CharField(
        max_length=50,
        db_column="contact_phone",
        null=True,
        blank=True,
    )

    source = models.CharField(
        max_length=100,
        db_column="source",
        null=True,
        blank=True,
    )

    status = models.CharField(
        max_length=30,
        choices=ProspectStatus.choices,
        db_column="status",
        default=ProspectStatus.NEW,
    )

    assigned_to = models.UUIDField(
        db_column="assigned_to",
        null=True,
        blank=True,
    )

    interest_description = models.TextField(
        db_column="interest_description",
        null=True,
        blank=True,
    )

    notes = models.TextField(
        db_column="notes",
        null=True,
        blank=True,
    )

    converted_client_id = models.UUIDField(
        db_column="converted_client_id",
        null=True,
        blank=True,
    )

    converted_at = models.DateTimeField(
        db_column="converted_at",
        null=True,
        blank=True,
    )

    converted_by = models.UUIDField(
        db_column="converted_by",
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "prospects"

    def __str__(self) -> str:
        return f"{self.prospect_number} - {self.business_name}"