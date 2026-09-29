from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("commercial", "0008_opportunity_number_sequence"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.AddConstraint(
                    model_name="prospect",
                    constraint=models.CheckConstraint(
                        check=models.Q(
                            status__in=[
                                "NEW",
                                "CONTACTED",
                                "QUOTED",
                                "WON",
                                "LOST",
                                "CONVERTED",
                            ]
                        ),
                        name="prospects_status_valid",
                    ),
                ),
            ],
        ),
    ]
