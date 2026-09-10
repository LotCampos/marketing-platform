from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("master", "0005_installation_address_nullable"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.AddField(
                    model_name="installation",
                    name="street",
                    field=models.CharField(
                        max_length=255,
                        blank=True,
                        null=True,
                        db_column="street",
                    ),
                ),
                migrations.AddField(
                    model_name="installation",
                    name="street_number",
                    field=models.CharField(
                        max_length=50,
                        blank=True,
                        null=True,
                        db_column="street_number",
                    ),
                ),
                migrations.AddField(
                    model_name="installation",
                    name="state",
                    field=models.CharField(
                        max_length=100,
                        blank=True,
                        null=True,
                        db_column="state",
                    ),
                ),
                migrations.AddField(
                    model_name="installation",
                    name="municipality",
                    field=models.CharField(
                        max_length=100,
                        blank=True,
                        null=True,
                        db_column="municipality",
                    ),
                ),
                migrations.AddField(
                    model_name="installation",
                    name="postal_code",
                    field=models.CharField(
                        max_length=10,
                        blank=True,
                        null=True,
                        db_column="postal_code",
                    ),
                ),
            ],
        ),
    ]
