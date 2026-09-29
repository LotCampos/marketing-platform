from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("commercial", "0002_prospect"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.AlterField(
                    model_name="quotation",
                    name="issued_by",
                    field=models.UUIDField(
                        db_column="issued_by",
                        null=True,
                        blank=True,
                    ),
                ),
            ],
        ),
    ]
