import uuid
from django.db import migrations


def seed_validation_rules(apps, schema_editor):
    """Seed 4 default validation rules for new deployments."""
    from django.db import connection

    rules = [
        {
            'uuid': str(uuid.uuid4()),
            'code': 'ELIG_001',
            'name': 'Active Policy Check',
            'rule_type': 'eligibility',
            'severity': 'error',
            'rule_definition': '{}',
        },
        {
            'uuid': str(uuid.uuid4()),
            'code': 'CLIN_001',
            'name': 'Diagnosis-Service Compatibility',
            'rule_type': 'clinical',
            'severity': 'warning',
            'rule_definition': '{"allowed_icd_service_map": {}}',
        },
        {
            'uuid': str(uuid.uuid4()),
            'code': 'FRAUD_001',
            'name': 'Duplicate Claim Detection',
            'rule_type': 'fraud',
            'severity': 'warning',
            'rule_definition': '{}',
        },
        {
            'uuid': str(uuid.uuid4()),
            'code': 'REG_001',
            'name': 'Registry Update Detection',
            'rule_type': 'registry',
            'severity': 'info',
            'rule_definition': '{"insuree_fields": ["phone", "email"], "facility_fields": ["fax"]}',
        },
    ]

    with connection.cursor() as cursor:
        for rule in rules:
            cursor.execute(
                '''INSERT INTO claimlens_validationrule
                   ("UUID", "isDeleted", "Json_ext", "DateCreated", "DateUpdated",
                    version, code, name, rule_type, rule_definition, severity, is_active,
                    "UserCreatedUUID", "UserUpdatedUUID")
                   VALUES (%s, FALSE, '{}', NOW(), NOW(),
                    1, %s, %s, %s, %s, %s, TRUE,
                    (SELECT id FROM "core_User" LIMIT 1),
                    (SELECT id FROM "core_User" LIMIT 1))''',
                [
                    rule['uuid'],
                    rule['code'],
                    rule['name'],
                    rule['rule_type'],
                    rule['rule_definition'],
                    rule['severity'],
                ],
            )


def reverse_seed(apps, schema_editor):
    from django.db import connection
    with connection.cursor() as cursor:
        cursor.execute(
            'DELETE FROM claimlens_validationrule '
            'WHERE code IN (%s, %s, %s, %s)',
            ['ELIG_001', 'CLIN_001', 'FRAUD_001', 'REG_001'],
        )


class Migration(migrations.Migration):

    dependencies = [
        ('claimlens', '0004_remove_gemini_adapter'),
    ]

    operations = [
        migrations.RunPython(seed_validation_rules, reverse_seed),
    ]
