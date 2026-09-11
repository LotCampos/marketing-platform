from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('commercial', '0014_remove_prospect_installation_type_and_more'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.AlterField(
                    model_name='quotationitem',
                    name='quantity',
                    field=models.IntegerField(
                        db_column='quantity',
                        default=1,
                    ),
                ),
                migrations.AlterField(
                    model_name='quotationitem',
                    name='unit_price',
                    field=models.IntegerField(
                        db_column='unit_price',
                        default=0,
                    ),
                ),
            ],
        ),
    ]
