from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("master", "0006_installation_address_fields"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.AddField(
                    model_name="installation",
                    name="colony",
                    field=models.CharField(
                        max_length=150,
                        null=True,
                        blank=True,
                        db_column="colony",
                    ),
                ),
            ],
        ),
    ]
}
