from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("commercial", "0007_opportunity_prospect_nullable"),
    ]

    operations = [
        migrations.AlterField(
            model_name="prospect",
            name="status",
            field=models.CharField(
                choices=[
                    ("NEW", "New"),
                    ("CONTACTED", "Contacted"),
                    ("QUOTED", "Quoted"),
                    ("WON", "Won"),
                    ("LOST", "Lost"),
                    ("CONVERTED", "Converted"),
                ],
                db_column="status",
                default="NEW",
                max_length=30,
            ),
        ),
    ]
