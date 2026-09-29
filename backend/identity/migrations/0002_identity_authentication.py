from django.db import migrations, models


SQL_ADD_PASSWORD_HASH = """
ALTER TABLE identity.users
ADD COLUMN IF NOT EXISTS password_hash varchar(512);
"""


class Migration(migrations.Migration):

    dependencies = [
        ("identity", "0001_adopt_identity_baseline"),
    ]

    operations = [
        migrations.RunSQL(
            sql=SQL_ADD_PASSWORD_HASH,
            reverse_sql=migrations.RunSQL.noop,
        ),
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.AddField(
                    model_name="user",
                    name="password_hash",
                    field=models.CharField(
                        max_length=512,
                        null=True,
                        editable=False,
                        db_column="password_hash",
                    ),
                ),
            ],
        ),
    ]