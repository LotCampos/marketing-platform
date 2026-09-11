from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("commercial", "0012_allow_preconversion_quotations"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.RemoveConstraint(
                    model_name="prospect",
                    name="prospects_status_valid",
                ),
            ],
        ),
        migrations.AlterField(
            model_name="prospect",
            name="status",
            field=models.CharField(
                choices=[
                    ("NEW", "Nuevo"),
                    ("CONTACTED", "Contactado"),
                    ("QUALIFIED", "Calificado"),
                    ("QUOTED", "Cotizado"),
                    ("WON", "Ganado"),
                    ("LOST", "Perdido"),
                    ("CONVERTED", "Convertido"),
                ],
                db_column="status",
                db_index=True,
                default="NEW",
                max_length=30,
            ),
        ),
    ]
