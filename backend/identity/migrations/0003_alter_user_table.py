from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("identity", "0002_identity_authentication"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.AlterModelTable(
                    name="user",
                    table="users",
                ),
            ],
        ),
    ]
