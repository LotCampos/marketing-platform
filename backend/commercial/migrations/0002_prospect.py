from django.db import migrations, models
import uuid6


class Migration(migrations.Migration):

    dependencies = [
        ("commercial", "0001_adopt_commercial_baseline"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.CreateModel(
                    name="Prospect",
                    fields=[
                        (
                            "id",
                            models.UUIDField(
                                default=uuid6.uuid7,
                                editable=False,
                                primary_key=True,
                                serialize=False,
                            ),
                        ),
                        (
                            "created_at",
                            models.DateTimeField(
                                auto_now_add=True,
                            ),
                        ),
                        (
                            "version_lock",
                            models.PositiveIntegerField(
                                db_column="version_lock",
                                default=1,
                            ),
                        ),
                        (
                            "prospect_number",
                            models.CharField(
                                db_column="prospect_number",
                                max_length=50,
                            ),
                        ),
                        (
                            "business_name",
                            models.CharField(
                                db_column="business_name",
                                max_length=255,
                            ),
                        ),
                        (
                            "rfc",
                            models.CharField(
                                blank=True,
                                db_column="rfc",
                                max_length=13,
                                null=True,
                            ),
                        ),
                        (
                            "contact_name",
                            models.CharField(
                                blank=True,
                                db_column="contact_name",
                                max_length=255,
                                null=True,
                            ),
                        ),
                        (
                            "contact_email",
                            models.EmailField(
                                blank=True,
                                db_column="contact_email",
                                max_length=254,
                                null=True,
                            ),
                        ),
                        (
                            "contact_phone",
                            models.CharField(
                                blank=True,
                                db_column="contact_phone",
                                max_length=50,
                                null=True,
                            ),
                        ),
                        (
                            "source",
                            models.CharField(
                                blank=True,
                                db_column="source",
                                max_length=100,
                                null=True,
                            ),
                        ),
                        (
                            "status",
                            models.CharField(
                                choices=[
                                    ("NEW", "New"),
                                    ("CONTACTED", "Contacted"),
                                    ("QUALIFIED", "Qualified"),
                                    ("PROPOSAL", "Proposal"),
                                    ("WON", "Won"),
                                    ("LOST", "Lost"),
                                    ("CONVERTED", "Converted"),
                                ],
                                db_column="status",
                                default="NEW",
                                max_length=30,
                            ),
                        ),
                        (
                            "assigned_to",
                            models.UUIDField(
                                blank=True,
                                db_column="assigned_to",
                                null=True,
                            ),
                        ),
                        (
                            "interest_description",
                            models.TextField(
                                blank=True,
                                db_column="interest_description",
                                null=True,
                            ),
                        ),
                        (
                            "notes",
                            models.TextField(
                                blank=True,
                                db_column="notes",
                                null=True,
                            ),
                        ),
                        (
                            "converted_client_id",
                            models.UUIDField(
                                blank=True,
                                db_column="converted_client_id",
                                null=True,
                            ),
                        ),
                        (
                            "converted_at",
                            models.DateTimeField(
                                blank=True,
                                db_column="converted_at",
                                null=True,
                            ),
                        ),
                        (
                            "converted_by",
                            models.UUIDField(
                                blank=True,
                                db_column="converted_by",
                                null=True,
                            ),
                        ),
                    ],
                    options={
                        "db_table": "prospects",
                    },
                ),
            ],
        ),
    ]