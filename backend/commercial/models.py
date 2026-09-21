from decimal import Decimal

from django.db import models

from core.models import UICadoBaseModel


class CommercialBaseModel(UICadoBaseModel):
    """Abstract persistence foundation for COMMERCIAL entities."""

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
    client_id = models.UUIDField(db_column="client_id")
    installation_id = models.UUIDField(db_column="installation_id", null=True, blank=True)
    service_catalog_id = models.UUIDField(db_column="service_catalog_id")
    request_number = models.CharField(max_length=50, db_column="request_number")
    requested_at = models.DateTimeField(db_column="requested_at", auto_now_add=True)
    requested_by_name = models.CharField(max_length=255, db_column="requested_by_name", null=True, blank=True)
    requested_by_email = models.CharField(max_length=254, db_column="requested_by_email", null=True, blank=True)
    requested_by_phone = models.CharField(max_length=50, db_column="requested_by_phone", null=True, blank=True)
    request_description = models.TextField(db_column="request_description", null=True, blank=True)
    created_by = models.UUIDField(db_column="created_by", null=True, blank=True)

    class Meta:
        db_table = "service_requests"

    def __str__(self) -> str:
        return self.request_number


class CapacityAssessment(CommercialBaseModel):
    service_request_id = models.UUIDField(db_column="service_request_id")
    assessment_number = models.CharField(max_length=50, db_column="assessment_number")
    status = models.CharField(max_length=18, choices=CapacityAssessmentStatus.choices, db_column="status")
    assessed_by = models.UUIDField(db_column="assessed_by", null=True, blank=True)
    assessed_at = models.DateTimeField(db_column="assessed_at", null=True, blank=True)
    technical_capacity = models.BooleanField(db_column="technical_capacity", null=True, blank=True)
    personnel_capacity = models.BooleanField(db_column="personnel_capacity", null=True, blank=True)
    equipment_capacity = models.BooleanField(db_column="equipment_capacity", null=True, blank=True)
    schedule_capacity = models.BooleanField(db_column="schedule_capacity", null=True, blank=True)
    observations = models.TextField(db_column="observations", null=True, blank=True)
    rejection_reason = models.TextField(db_column="rejection_reason", null=True, blank=True)

    class Meta:
        db_table = "capacity_assessments"

    def __str__(self) -> str:
        return self.assessment_number


class Opportunity(CommercialBaseModel):
    opportunity_number = models.CharField(max_length=50, db_column="opportunity_number")
    prospect = models.ForeignKey(
        "Prospect",
        on_delete=models.PROTECT,
        db_column="prospect_id",
        related_name="opportunities",
        null=True,
        blank=True,
    )
    service_request_id = models.UUIDField(db_column="service_request_id", null=True, blank=True)
    client_id = models.UUIDField(db_column="client_id", null=True, blank=True)
    assigned_to = models.UUIDField(db_column="assigned_to", null=True, blank=True)
    title = models.CharField(max_length=255, db_column="title")
    description = models.TextField(db_column="description", null=True, blank=True)
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
    quotation_number = models.CharField(max_length=50, db_column="quotation_number")
    opportunity_id = models.UUIDField(db_column="opportunity_id")
    client_id = models.UUIDField(db_column="client_id", null=True, blank=True)
    issued_by = models.UUIDField(db_column="issued_by")
    issue_date = models.DateTimeField(db_column="issue_date", auto_now_add=True)
    valid_until = models.DateField(db_column="valid_until", null=True, blank=True)
    subtotal = models.DecimalField(max_digits=14, decimal_places=2, db_column="subtotal", default=Decimal("0"))
    tax_amount = models.DecimalField(max_digits=14, decimal_places=2, db_column="tax_amount", default=Decimal("0"))
    total_amount = models.DecimalField(max_digits=14, decimal_places=2, db_column="total_amount", default=Decimal("0"))
    currency = models.CharField(max_length=3, db_column="currency", default="MXN")
    notes = models.TextField(db_column="notes", null=True, blank=True)

    class Meta:
        db_table = "quotations"

    def __str__(self) -> str:
        return self.quotation_number


class QuotationItem(CommercialBaseModel):
    quotation_id = models.UUIDField(db_column="quotation_id")
    service_catalog_id = models.UUIDField(db_column="service_catalog_id")
    description = models.CharField(max_length=500, db_column="description")
    evaluation_period = models.CharField(
        max_length=255,
        db_column="evaluation_period",
        null=True,
        blank=True,
    )
    quantity = models.IntegerField(db_column="quantity", default=1)
    unit_price = models.IntegerField(db_column="unit_price", default=0)
    line_total = models.DecimalField(max_digits=14, decimal_places=2, db_column="line_total", default=Decimal("0"))

    class Meta:
        db_table = "quotation_items"

    def __str__(self) -> str:
        return self.description


class CommercialComponentType(UICadoBaseModel):
    updated_at = None
    code = models.CharField(max_length=50, db_column="code")
    name = models.CharField(max_length=150, db_column="name")
    description = models.TextField(db_column="description", null=True, blank=True)
    is_active = models.BooleanField(db_column="is_active", default=True)

    class Meta:
        db_table = "commercial_component_types"
        constraints = [
            models.UniqueConstraint(
                fields=["code"],
                name="commercial_component_types_code_uk",
            ),
        ]

    def __str__(self) -> str:
        return self.name


class CommercialClauseTemplate(UICadoBaseModel):
    updated_at = None
    code = models.CharField(max_length=100, db_column="code")
    name = models.CharField(max_length=200, db_column="name")
    version = models.PositiveIntegerField(db_column="version")
    component_type = models.ForeignKey(
        CommercialComponentType,
        on_delete=models.PROTECT,
        db_column="component_type_id",
        related_name="clause_templates",
    )
    treatment = models.CharField(max_length=30, db_column="treatment")
    template_text = models.TextField(db_column="template_text")
    is_active = models.BooleanField(db_column="is_active", default=True)
    effective_from = models.DateTimeField(
        db_column="effective_from",
        auto_now_add=False,
    )
    effective_until = models.DateTimeField(
        db_column="effective_until",
        null=True,
        blank=True,
    )
    content_hash = models.CharField(max_length=64, db_column="content_hash")
    created_by = models.UUIDField(
        db_column="created_by",
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "commercial_clause_templates"
        constraints = [
            models.UniqueConstraint(
                fields=["code", "version"],
                name="commercial_clause_templates_code_version_uk",
            ),
            models.CheckConstraint(
                check=models.Q(
                    treatment__in=[
                        "INCLUDED",
                        "ADDITIONAL",
                        "INFORMATIVE",
                    ]
                ),
                name="commercial_clause_templates_treatment_ck",
            ),
            models.CheckConstraint(
                check=models.Q(version__gte=1),
                name="commercial_clause_templates_version_ck",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.code} v{self.version}"


class QuotationComponent(CommercialBaseModel):
    quotation_id = models.UUIDField(db_column="quotation_id")
    component_type = models.ForeignKey(
        CommercialComponentType,
        on_delete=models.PROTECT,
        db_column="component_type_id",
        related_name="quotation_components",
    )
    treatment = models.CharField(max_length=30, db_column="treatment")
    amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        db_column="amount",
        default=Decimal("0"),
    )
    display_mode = models.CharField(max_length=30, db_column="display_mode")
    clause_template = models.ForeignKey(
        CommercialClauseTemplate,
        on_delete=models.PROTECT,
        db_column="clause_template_id",
        related_name="quotation_components",
        null=True,
        blank=True,
    )
    clause_version = models.PositiveIntegerField(
        db_column="clause_version",
        null=True,
        blank=True,
    )
    clause_text_snapshot = models.TextField(
        db_column="clause_text_snapshot",
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "quotation_components"
        constraints = [
            models.CheckConstraint(
                check=models.Q(
                    treatment__in=[
                        "INCLUDED",
                        "ADDITIONAL",
                        "INFORMATIVE",
                    ]
                ),
                name="quotation_components_treatment_ck",
            ),
            models.CheckConstraint(
                check=models.Q(
                    display_mode__in=[
                        "LINE_ITEM",
                        "CLAUSE",
                        "HIDDEN",
                    ]
                ),
                name="quotation_components_display_mode_ck",
            ),
            models.CheckConstraint(
                check=models.Q(amount__gte=0),
                name="quotation_components_amount_ck",
            ),
            models.CheckConstraint(
                check=models.Q(
                    display_mode="CLAUSE",
                    clause_template__isnull=False,
                    clause_version__isnull=False,
                    clause_text_snapshot__isnull=False,
                ) | ~models.Q(display_mode="CLAUSE"),
                name="quotation_components_clause_consistency_ck",
            ),
        ]

    def __str__(self) -> str:
        return str(self.id)


class Agreement(CommercialBaseModel):
    agreement_number = models.CharField(max_length=50, db_column="agreement_number")
    quotation_id = models.UUIDField(db_column="quotation_id")
    opportunity_id = models.UUIDField(db_column="opportunity_id")
    client_id = models.UUIDField(db_column="client_id")

    legal_name = models.CharField(
        max_length=255,
        db_column="legal_name",
        null=True,
        blank=True,
    )
    tax_id = models.CharField(
        max_length=13,
        db_column="tax_id",
        null=True,
        blank=True,
    )
    legal_representative_name = models.CharField(
        max_length=255,
        db_column="legal_representative_name",
        null=True,
        blank=True,
    )
    legal_representative_tax_id = models.CharField(
        max_length=13,
        db_column="legal_representative_tax_id",
        null=True,
        blank=True,
    )
    employer_registration = models.CharField(
        max_length=50,
        db_column="employer_registration",
        null=True,
        blank=True,
    )

    status = models.CharField(max_length=17, choices=AgreementStatus.choices, db_column="status")
    signed_by = models.UUIDField(db_column="signed_by", null=True, blank=True)
    signed_at = models.DateTimeField(db_column="signed_at", null=True, blank=True)
    effective_from = models.DateField(db_column="effective_from", null=True, blank=True)
    effective_until = models.DateField(db_column="effective_until", null=True, blank=True)
    terms_hash = models.CharField(max_length=128, db_column="terms_hash", null=True, blank=True)
    notes = models.TextField(db_column="notes", null=True, blank=True)

    class Meta:
        db_table = "agreements"

    def __str__(self) -> str:
        return self.agreement_number


class AgreementTerm(CommercialBaseModel):
    agreement_id = models.UUIDField(db_column="agreement_id")
    term_code = models.CharField(max_length=50, db_column="term_code")
    term_description = models.TextField(db_column="term_description")
    is_mandatory = models.BooleanField(db_column="is_mandatory", default=True)

    class Meta:
        db_table = "agreement_terms"

    def __str__(self) -> str:
        return self.term_code


class ProspectStatus(models.TextChoices):
    NEW = "NEW", "New"
    CONTACTED = "CONTACTED", "Contacted"
    QUALIFIED = "QUALIFIED", "Qualified"
    QUOTED = "QUOTED", "Quoted"
    WON = "WON", "Won"
    LOST = "LOST", "Lost"
    CONVERTED = "CONVERTED", "Converted"


class Prospect(CommercialBaseModel):
    installation = models.ForeignKey(
        "master.Installation",
        on_delete=models.PROTECT,
        db_column="installation_id",
        related_name="prospects",
        null=True,
        blank=True,
    )
    service_catalog_id = models.UUIDField(db_column="service_catalog_id", null=True, blank=True)
    prospect_number = models.CharField(max_length=50, db_column="prospect_number")
    business_name = models.CharField(max_length=255, db_column="business_name")
    rfc = models.CharField(max_length=13, db_column="rfc", null=True, blank=True)
    contact_name = models.CharField(max_length=255, db_column="contact_name", null=True, blank=True)
    contact_email = models.EmailField(max_length=254, db_column="contact_email", null=True, blank=True)
    contact_phone = models.CharField(max_length=50, db_column="contact_phone", null=True, blank=True)
    source = models.CharField(max_length=100, db_column="source", null=True, blank=True)
    status = models.CharField(max_length=30, choices=ProspectStatus.choices, db_column="status", default=ProspectStatus.NEW)
    assigned_to = models.UUIDField(db_column="assigned_to", null=True, blank=True)
    interest_description = models.TextField(db_column="interest_description", null=True, blank=True)
    notes = models.TextField(db_column="notes", null=True, blank=True)
    converted_client_id = models.UUIDField(db_column="converted_client_id", null=True, blank=True)
    converted_at = models.DateTimeField(db_column="converted_at", null=True, blank=True)
    converted_by = models.UUIDField(db_column="converted_by", null=True, blank=True)

    class Meta:
        db_table = "prospects"

    def __str__(self) -> str:
        return f"{self.prospect_number} - {self.business_name}"
