from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("master", "0004_alter_installation_client"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.AlterField(
                    model_name="installation",
                    name="address",
                    field=models.TextField(
                        blank=True,
                        null=True,
                        db_column="address",
                    ),
                ),
            ],
        ),
    ]
