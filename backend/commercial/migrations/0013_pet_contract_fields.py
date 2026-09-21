from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("commercial", "0012_allow_preconversion_quotations"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.AddField(
                    model_name="quotationitem",
                    name="evaluation_period",
                    field=models.CharField(
                        max_length=100,
                        null=True,
                        blank=True,
                        db_column="evaluation_period",
                    ),
                ),
                migrations.AddField(
                    model_name="quotationitem",
                    name="unit",
                    field=models.CharField(
                        max_length=100,
                        null=True,
                        blank=True,
                        db_column="unit",
                    ),
                ),
                migrations.AddField(
                    model_name="agreement",
                    name="pet_number",
                    field=models.CharField(
                        max_length=50,
                        null=True,
                        blank=True,
                        db_column="pet_number",
                    ),
                ),
                migrations.AddField(
                    model_name="agreement",
                    name="legal_representative",
                    field=models.CharField(
                        max_length=255,
                        null=True,
                        blank=True,
                        db_column="legal_representative",
                    ),
                ),
                migrations.AddField(
                    model_name="agreement",
                    name="legal_representative_rfc",
                    field=models.CharField(
                        max_length=13,
                        null=True,
                        blank=True,
                        db_column="legal_representative_rfc",
                    ),
                ),
                migrations.AddField(
                    model_name="agreement",
                    name="technical_responsible",
                    field=models.CharField(
                        max_length=255,
                        null=True,
                        blank=True,
                        db_column="technical_responsible",
                    ),
                ),
                migrations.AddField(
                    model_name="agreement",
                    name="urgent_work",
                    field=models.BooleanField(default=False, db_column="urgent_work"),
                ),
                migrations.AddField(
                    model_name="agreement",
                    name="special_conditions",
                    field=models.BooleanField(default=False, db_column="special_conditions"),
                ),
            ],
        ),
    ]
}
