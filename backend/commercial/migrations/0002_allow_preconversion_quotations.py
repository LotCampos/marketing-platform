from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("commercial", "0001_adopt_commercial_baseline"),
    ]

    operations = [
        migrations.AlterField(
            model_name="quotation",
            name="client_id",
            field=models.UUIDField(
                blank=True,
                db_column="client_id",
                null=True,
            ),
        ),
    ]
