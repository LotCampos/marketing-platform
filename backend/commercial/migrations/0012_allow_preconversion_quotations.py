from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("commercial", "0011_prospect_service_catalog"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.AlterField(
                    model_name="quotation",
                    name="client_id",
                    field=models.UUIDField(
                        db_column="client_id",
                        null=True,
                        blank=True,
                    ),
                ),
            ],
        ),
    ]
