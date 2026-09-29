from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("commercial", "0010_prospect_installation"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.AddField(
                    model_name="prospect",
                    name="service_catalog_id",
                    field=models.UUIDField(
                        blank=True,
                        null=True,
                        db_column="service_catalog_id",
                    ),
                ),
            ],
        ),
    ]
