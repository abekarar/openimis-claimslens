from django.db import migrations


def create_engine_routing_rule_table(apps, schema_editor):
    """Create EngineRoutingRule table using raw SQL (same pattern as 0003).

    Django's CreateModel generates FK constraints referencing 'id' but the
    actual PK column is 'UUID' (set by HistoryModel), so we use raw SQL.
    """
    from django.db import connection

    with connection.cursor() as cursor:
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS claimlens_engineroutingrule (
                "UUID" uuid NOT NULL PRIMARY KEY,
                "isDeleted" boolean NOT NULL DEFAULT FALSE,
                "Json_ext" jsonb DEFAULT '{}'::jsonb,
                "DateCreated" timestamp with time zone,
                "DateUpdated" timestamp with time zone,
                version integer NOT NULL DEFAULT 1,
                name varchar(255) NOT NULL,
                language varchar(10),
                min_confidence double precision NOT NULL DEFAULT 0.0,
                priority integer NOT NULL DEFAULT 50,
                is_active boolean NOT NULL DEFAULT TRUE,
                document_type_id uuid REFERENCES claimlens_documenttype("UUID") ON DELETE NO ACTION,
                engine_config_id uuid NOT NULL REFERENCES claimlens_engineconfig("UUID") ON DELETE NO ACTION,
                "UserCreatedUUID" uuid NOT NULL REFERENCES "core_User"(id) ON DELETE NO ACTION,
                "UserUpdatedUUID" uuid NOT NULL REFERENCES "core_User"(id) ON DELETE NO ACTION
            )
        ''')


def drop_engine_routing_rule_table(apps, schema_editor):
    from django.db import connection
    with connection.cursor() as cursor:
        cursor.execute('DROP TABLE IF EXISTS claimlens_engineroutingrule')


class Migration(migrations.Migration):

    dependencies = [
        ('claimlens', '0005_seed_validation_rules'),
    ]

    operations = [
        migrations.RunPython(create_engine_routing_rule_table, drop_engine_routing_rule_table),
    ]
