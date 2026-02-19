import uuid
from django.db import migrations


def seed_openrouter_engine(apps, schema_editor):
    """Create OpenRouter EngineConfig and deactivate old Gemini engine."""
    # Use raw SQL because the migration state's 'id' field doesn't match
    # the actual DB column name 'UUID' (set by HistoryModel's db_column).
    from django.db import connection

    # Encrypt the API key using the same Fernet mechanism
    import base64
    import hashlib
    from cryptography.fernet import Fernet
    from django.conf import settings
    key = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    f = Fernet(base64.urlsafe_b64encode(key))
    import os
    api_key = os.environ.get('OPENROUTER_API_KEY', 'sk-or-placeholder')
    encrypted = f.encrypt(api_key.encode())

    with connection.cursor() as cursor:
        # Deactivate existing primary engines
        cursor.execute(
            'UPDATE claimlens_engineconfig SET is_primary = FALSE '
            'WHERE is_primary = TRUE AND "isDeleted" = FALSE'
        )
        # Deactivate Gemini engines
        cursor.execute(
            'UPDATE claimlens_engineconfig SET is_active = FALSE '
            'WHERE adapter = %s AND "isDeleted" = FALSE',
            ['gemini'],
        )
        # Insert OpenRouter engine
        cursor.execute(
            '''INSERT INTO claimlens_engineconfig
               ("UUID", "isDeleted", "Json_ext", "DateCreated", "DateUpdated",
                version, name, adapter, endpoint_url, api_key_encrypted,
                model_name, deployment_mode, is_primary, is_fallback, is_active,
                max_tokens, temperature, timeout_seconds,
                "UserCreatedUUID", "UserUpdatedUUID")
               VALUES (%s, FALSE, '{}', NOW(), NOW(),
                1, %s, %s, %s, %s,
                %s, %s, TRUE, FALSE, TRUE,
                4096, 0.1, 120,
                (SELECT id FROM "core_User" LIMIT 1),
                (SELECT id FROM "core_User" LIMIT 1))''',
            [
                str(uuid.uuid4()),
                'OpenRouter',
                'openai_compatible',
                'https://openrouter.ai/api',
                bytes(encrypted),
                'mistralai/pixtral-large-2411',
                'cloud',
            ],
        )


def reverse_seed(apps, schema_editor):
    from django.db import connection
    with connection.cursor() as cursor:
        cursor.execute(
            'DELETE FROM claimlens_engineconfig '
            'WHERE name = %s AND adapter = %s',
            ['OpenRouter', 'openai_compatible'],
        )


class Migration(migrations.Migration):

    dependencies = [
        ('claimlens', '0002_engineconfig_adapter_choices'),
    ]

    operations = [
        migrations.RunPython(seed_openrouter_engine, reverse_seed),
    ]
