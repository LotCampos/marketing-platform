from django.db import migrations, models
import uuid6


SQL_CREATE_SCHEMA = """
CREATE SCHEMA IF NOT EXISTS identity;
"""


SQL_CREATE_PGCRYPTO = """
CREATE EXTENSION IF NOT EXISTS pgcrypto;
"""


SQL_CREATE_UUIDV7 = """
CREATE OR REPLACE FUNCTION public.uuidv7()
RETURNS uuid
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
    v_time timestamptz := clock_timestamp();
    v_timestamp bigint;
    v_timestamp_hex varchar;
    v_random bytea;
    v_random_hex varchar;
    v_bytes bytea;
BEGIN
    v_timestamp := floor(
        extract(epoch FROM v_time) * 1000
    )::bigint;

    v_timestamp_hex := lpad(
        to_hex(v_timestamp),
        12,
        '0'
    );

    v_random := gen_random_bytes(10);

    v_random_hex := encode(
        v_random,
        'hex'
    );

    v_bytes := decode(
        v_timestamp_hex || v_random_hex,
        'hex'
    );

    v_bytes := set_byte(
        v_bytes,
        6,
        (get_byte(v_bytes, 6) & 15) | 112
    );

    v_bytes := set_byte(
        v_bytes,
        8,
        (get_byte(v_bytes, 8) & 63) | 128
    );

    RETURN encode(
        v_bytes,
        'hex'
    )::uuid;
END;
$$;
"""


SQL_CREATE_TABLE = """
CREATE TABLE IF NOT EXISTS identity.users (
    id uuid PRIMARY KEY DEFAULT public.uuidv7(),

    email varchar(254) NOT NULL,

    employee_number varchar(50) NOT NULL,

    full_name varchar(255) NOT NULL,

    system_role varchar(50) NOT NULL,

    is_active boolean NOT NULL DEFAULT true,

    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,

    version_lock integer NOT NULL DEFAULT 1,

    CONSTRAINT users_email_unique
        UNIQUE (email),

    CONSTRAINT users_employee_number_unique
        UNIQUE (employee_number),

    CONSTRAINT users_email_normalized
        CHECK (email = lower(email)),

    CONSTRAINT users_version_lock_positive
        CHECK (version_lock >= 1)
);
"""


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.RunSQL(
            sql=SQL_CREATE_PGCRYPTO,
            reverse_sql=migrations.RunSQL.noop,
        ),
        migrations.RunSQL(
            sql=SQL_CREATE_SCHEMA,
            reverse_sql=migrations.RunSQL.noop,
        ),
        migrations.RunSQL(
            sql=SQL_CREATE_UUIDV7,
            reverse_sql=migrations.RunSQL.noop,
        ),
        migrations.RunSQL(
            sql=SQL_CREATE_TABLE,
            reverse_sql=migrations.RunSQL.noop,
        ),
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.CreateModel(
                    name="User",
                    fields=[
                        (
                            "id",
                            models.UUIDField(
                                default=uuid6.uuid7,
                                editable=False,
                                primary_key=True,
                                serialize=False,
                            ),
                        ),
                        (
                            "email",
                            models.EmailField(
                                max_length=254,
                            ),
                        ),
                        (
                            "employee_number",
                            models.CharField(
                                max_length=50,
                            ),
                        ),
                        (
                            "full_name",
                            models.CharField(
                                max_length=255,
                            ),
                        ),
                        (
                            "system_role",
                            models.CharField(
                                max_length=50,
                            ),
                        ),
                        (
                            "is_active",
                            models.BooleanField(
                                default=True,
                            ),
                        ),
                        (
                            "created_at",
                            models.DateTimeField(
                                auto_now_add=True,
                            ),
                        ),
                        (
                            "version_lock",
                            models.IntegerField(
                                default=1,
                            ),
                        ),
                    ],
                    options={
                        "db_table": "identity.users",
                        "managed": False,
                    },
                ),
            ],
        ),
    ]