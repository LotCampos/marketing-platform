from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("commercial", "0006_opportunity_prospect_origin"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.AlterField(
                    model_name="opportunity",
                    name="client_id",
                    field=models.UUIDField(
                        blank=True,
                        db_column="client_id",
                        null=True,
                    ),
                ),
                migrations.AlterField(
                    model_name="opportunity",
                    name="service_request_id",
                    field=models.UUIDField(
                        blank=True,
                        db_column="service_request_id",
                        null=True,
                    ),
                ),
            ],
        ),
    ]
