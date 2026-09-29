from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("master", "0004_alter_installation_client"),
        ("commercial", "0009_sync_prospect_status_constraint"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.AddField(
                    model_name="prospect",
                    name="installation",
                    field=models.ForeignKey(
                        blank=True,
                        db_column="installation_id",
                        null=True,
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="prospects",
                        to="master.installation",
                    ),
                ),
            ],
        ),
    ]
