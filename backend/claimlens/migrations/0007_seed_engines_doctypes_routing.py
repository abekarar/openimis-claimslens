import json
import uuid
from django.db import migrations


# ---------------------------------------------------------------------------
# Engine UUIDs (stable across seed + routing references)
# ---------------------------------------------------------------------------
ENGINE_GEMINI_FLASH = str(uuid.uuid4())
ENGINE_GEMINI_PRO = str(uuid.uuid4())
ENGINE_QWEN_VL = str(uuid.uuid4())
ENGINE_GPT4O = str(uuid.uuid4())

ENGINE_CONFIGS = [
    {
        'uuid': ENGINE_GEMINI_FLASH,
        'name': 'Gemini 2.5 Flash',
        'model_name': 'google/gemini-2.5-flash',
        'is_primary': True,
        'is_fallback': False,
    },
    {
        'uuid': ENGINE_GEMINI_PRO,
        'name': 'Gemini 2.5 Pro',
        'model_name': 'google/gemini-2.5-pro',
        'is_primary': False,
        'is_fallback': False,
    },
    {
        'uuid': ENGINE_QWEN_VL,
        'name': 'Qwen2.5-VL 72B',
        'model_name': 'qwen/qwen2.5-vl-72b-instruct',
        'is_primary': False,
        'is_fallback': False,
    },
    {
        'uuid': ENGINE_GPT4O,
        'name': 'GPT-4o',
        'model_name': 'openai/gpt-4o',
        'is_primary': False,
        'is_fallback': False,
    },
]

ENGINE_NAMES = [e['name'] for e in ENGINE_CONFIGS]

# ---------------------------------------------------------------------------
# Document Types
# ---------------------------------------------------------------------------
DOCUMENT_TYPES = [
    {
        'code': 'CLAIM_FORM',
        'name': 'Claim Form',
        'extraction_template': {
            'patient_name': {'type': 'string'},
            'patient_id': {'type': 'string'},
            'diagnosis_codes': {
                'type': 'array',
                'items': {'code': {'type': 'string'}, 'description': {'type': 'string'}},
            },
            'procedure_codes': {
                'type': 'array',
                'items': {'code': {'type': 'string'}, 'description': {'type': 'string'}},
            },
            'service_date': {'type': 'string'},
            'provider_name': {'type': 'string'},
            'provider_id': {'type': 'string'},
            'total_amount': {'type': 'string'},
            'claim_number': {'type': 'string'},
            'currency': {'type': 'string'},
        },
        'classification_hints': (
            'Contains patient information, diagnosis codes (ICD), procedure codes, '
            'service dates, provider details, and billing amounts. May be titled '
            'Claim Form, Health Insurance Claim, or similar.'
        ),
    },
    {
        'code': 'PRESCRIPTION',
        'name': 'Prescription',
        'extraction_template': {
            'patient_name': {'type': 'string'},
            'patient_id': {'type': 'string'},
            'prescriber_name': {'type': 'string'},
            'prescriber_id': {'type': 'string'},
            'medications': {
                'type': 'array',
                'items': {
                    'name': {'type': 'string'},
                    'dosage': {'type': 'string'},
                    'frequency': {'type': 'string'},
                    'duration': {'type': 'string'},
                    'quantity': {'type': 'string'},
                },
            },
            'date_prescribed': {'type': 'string'},
            'diagnosis': {'type': 'string'},
        },
        'classification_hints': (
            'Contains medication names, dosages, prescriber details, and patient '
            'information. May include Rx symbol or pharmacy header.'
        ),
    },
    {
        'code': 'LAB_REPORT',
        'name': 'Laboratory Report',
        'extraction_template': {
            'patient_name': {'type': 'string'},
            'patient_id': {'type': 'string'},
            'test_results': {
                'type': 'array',
                'items': {
                    'test_name': {'type': 'string'},
                    'value': {'type': 'string'},
                    'unit': {'type': 'string'},
                    'reference_range': {'type': 'string'},
                    'flag': {'type': 'string'},
                },
            },
            'lab_name': {'type': 'string'},
            'ordering_physician': {'type': 'string'},
            'collection_date': {'type': 'string'},
            'report_date': {'type': 'string'},
        },
        'classification_hints': (
            'Contains laboratory test results with numerical values, reference ranges, '
            'specimen information, and ordering physician. Often has tabular results.'
        ),
    },
    {
        'code': 'DISCHARGE_SUMMARY',
        'name': 'Discharge Summary',
        'extraction_template': {
            'patient_name': {'type': 'string'},
            'patient_id': {'type': 'string'},
            'admission_date': {'type': 'string'},
            'discharge_date': {'type': 'string'},
            'admitting_diagnosis': {'type': 'string'},
            'discharge_diagnosis': {'type': 'string'},
            'procedures_performed': {
                'type': 'array',
                'items': {
                    'procedure': {'type': 'string'},
                    'date': {'type': 'string'},
                },
            },
            'medications_at_discharge': {
                'type': 'array',
                'items': {
                    'name': {'type': 'string'},
                    'dosage': {'type': 'string'},
                    'frequency': {'type': 'string'},
                },
            },
            'follow_up_instructions': {'type': 'string'},
            'attending_physician': {'type': 'string'},
        },
        'classification_hints': (
            'Contains admission and discharge dates, diagnoses, procedures performed, '
            'and follow-up instructions. Usually a multi-paragraph narrative with '
            'medical terminology.'
        ),
    },
    {
        'code': 'REFERRAL_LETTER',
        'name': 'Referral Letter',
        'extraction_template': {
            'patient_name': {'type': 'string'},
            'patient_id': {'type': 'string'},
            'referring_physician': {'type': 'string'},
            'referring_facility': {'type': 'string'},
            'referred_to_physician': {'type': 'string'},
            'referred_to_facility': {'type': 'string'},
            'referral_reason': {'type': 'string'},
            'referral_date': {'type': 'string'},
            'clinical_summary': {'type': 'string'},
        },
        'classification_hints': (
            'Contains referring and receiving physician details, referral reason, and '
            'clinical summary. Usually in letter format on facility letterhead.'
        ),
    },
    {
        'code': 'RECEIPT_BILL',
        'name': 'Receipt / Bill',
        'extraction_template': {
            'patient_name': {'type': 'string'},
            'receipt_number': {'type': 'string'},
            'facility_name': {'type': 'string'},
            'service_date': {'type': 'string'},
            'line_items': {
                'type': 'array',
                'items': {
                    'description': {'type': 'string'},
                    'quantity': {'type': 'string'},
                    'unit_price': {'type': 'string'},
                    'amount': {'type': 'string'},
                },
            },
            'subtotal': {'type': 'string'},
            'tax': {'type': 'string'},
            'total_amount': {'type': 'string'},
            'payment_method': {'type': 'string'},
            'currency': {'type': 'string'},
        },
        'classification_hints': (
            'Contains itemized charges, totals, payment information. May include '
            'facility letterhead, receipt number, or invoice number.'
        ),
    },
    {
        'code': 'ID_DOCUMENT',
        'name': 'Identity Document',
        'extraction_template': {
            'full_name': {'type': 'string'},
            'document_number': {'type': 'string'},
            'date_of_birth': {'type': 'string'},
            'gender': {'type': 'string'},
            'address': {'type': 'string'},
            'issue_date': {'type': 'string'},
            'expiry_date': {'type': 'string'},
            'issuing_authority': {'type': 'string'},
            'document_subtype': {'type': 'string'},
        },
        'classification_hints': (
            'Contains personal identification details such as name, ID number, date '
            'of birth. Includes national IDs, insurance cards, passports, driving '
            'licenses. Usually has standardized layout with photo.'
        ),
    },
]

DOC_TYPE_CODES = [dt['code'] for dt in DOCUMENT_TYPES]

# ---------------------------------------------------------------------------
# Capability Scores: 5 engines x 14 languages (document_type=NULL wildcard)
# Format per engine: {lang: (accuracy, cost_per_page, speed)}
# ---------------------------------------------------------------------------
LANGUAGES = ['en', 'hi', 'bn', 'ne', 'ta', 'ur', 'si', 'ar', 'fa', 'th', 'km', 'my', 'am', 'sw']

CAPABILITY_DATA = {
    'Gemini 2.5 Flash': {
        'en': (90, 0.002, 85), 'hi': (88, 0.002, 85), 'bn': (86, 0.002, 85),
        'ne': (82, 0.002, 85), 'ta': (84, 0.002, 85), 'ur': (83, 0.002, 85),
        'si': (78, 0.002, 85), 'ar': (84, 0.002, 85), 'fa': (82, 0.002, 85),
        'th': (85, 0.002, 85), 'km': (75, 0.002, 85), 'my': (70, 0.002, 85),
        'am': (75, 0.002, 85), 'sw': (88, 0.002, 85),
    },
    'Gemini 2.5 Pro': {
        'en': (93, 0.010, 75), 'hi': (90, 0.010, 75), 'bn': (89, 0.010, 75),
        'ne': (85, 0.010, 75), 'ta': (87, 0.010, 75), 'ur': (87, 0.010, 75),
        'si': (82, 0.010, 75), 'ar': (91, 0.010, 75), 'fa': (88, 0.010, 75),
        'th': (87, 0.010, 75), 'km': (80, 0.010, 75), 'my': (75, 0.010, 75),
        'am': (80, 0.010, 75), 'sw': (90, 0.010, 75),
    },
    'Qwen2.5-VL 72B': {
        'en': (88, 0.001, 80), 'hi': (85, 0.001, 80), 'bn': (84, 0.001, 80),
        'ne': (80, 0.001, 80), 'ta': (82, 0.001, 80), 'ur': (78, 0.001, 80),
        'si': (72, 0.001, 80), 'ar': (72, 0.001, 80), 'fa': (70, 0.001, 80),
        'th': (82, 0.001, 80), 'km': (65, 0.001, 80), 'my': (60, 0.001, 80),
        'am': (62, 0.001, 80), 'sw': (85, 0.001, 80),
    },
    'GPT-4o': {
        'en': (92, 0.020, 70), 'hi': (88, 0.020, 70), 'bn': (87, 0.020, 70),
        'ne': (83, 0.020, 70), 'ta': (85, 0.020, 70), 'ur': (85, 0.020, 70),
        'si': (80, 0.020, 70), 'ar': (88, 0.020, 70), 'fa': (86, 0.020, 70),
        'th': (84, 0.020, 70), 'km': (78, 0.020, 70), 'my': (73, 0.020, 70),
        'am': (76, 0.020, 70), 'sw': (88, 0.020, 70),
    },
    'OpenRouter': {  # Pixtral Large (existing)
        'en': (87, 0.008, 80), 'hi': (78, 0.008, 80), 'bn': (76, 0.008, 80),
        'ne': (72, 0.008, 80), 'ta': (74, 0.008, 80), 'ur': (73, 0.008, 80),
        'si': (65, 0.008, 80), 'ar': (75, 0.008, 80), 'fa': (72, 0.008, 80),
        'th': (76, 0.008, 80), 'km': (60, 0.008, 80), 'my': (55, 0.008, 80),
        'am': (58, 0.008, 80), 'sw': (82, 0.008, 80),
    },
}

# ---------------------------------------------------------------------------
# Routing Rules: 29 rules, priority-ordered
# Format: (name, language, doc_type_code, engine_name, priority)
#   language=None  -> match any language
#   doc_type=None  -> match any document type
# ---------------------------------------------------------------------------
ROUTING_RULES = [
    # Priority 90 — RTL structured doc cost savings
    ('Arabic ID -> Flash', 'ar', 'ID_DOCUMENT', 'Gemini 2.5 Flash', 90),
    ('Arabic Receipt -> Flash', 'ar', 'RECEIPT_BILL', 'Gemini 2.5 Flash', 90),
    ('Farsi ID -> Flash', 'fa', 'ID_DOCUMENT', 'Gemini 2.5 Flash', 90),
    ('Farsi Receipt -> Flash', 'fa', 'RECEIPT_BILL', 'Gemini 2.5 Flash', 90),
    ('Urdu ID -> Flash', 'ur', 'ID_DOCUMENT', 'Gemini 2.5 Flash', 90),
    ('Urdu Receipt -> Flash', 'ur', 'RECEIPT_BILL', 'Gemini 2.5 Flash', 90),
    # Priority 85 — Low-resource structured doc savings
    ('Khmer ID -> Flash', 'km', 'ID_DOCUMENT', 'Gemini 2.5 Flash', 85),
    ('Khmer Receipt -> Flash', 'km', 'RECEIPT_BILL', 'Gemini 2.5 Flash', 85),
    ('Myanmar ID -> Flash', 'my', 'ID_DOCUMENT', 'Gemini 2.5 Flash', 85),
    ('Myanmar Receipt -> Flash', 'my', 'RECEIPT_BILL', 'Gemini 2.5 Flash', 85),
    ('Amharic ID -> Flash', 'am', 'ID_DOCUMENT', 'Gemini 2.5 Flash', 85),
    ('Amharic Receipt -> Flash', 'am', 'RECEIPT_BILL', 'Gemini 2.5 Flash', 85),
    # Priority 80 — Language-specific defaults (medium + complex docs)
    ('Arabic default -> Pro', 'ar', None, 'Gemini 2.5 Pro', 80),
    ('Farsi default -> Pro', 'fa', None, 'Gemini 2.5 Pro', 80),
    ('Urdu default -> Pro', 'ur', None, 'Gemini 2.5 Pro', 80),
    ('Khmer default -> GPT-4o', 'km', None, 'GPT-4o', 80),
    ('Myanmar default -> GPT-4o', 'my', None, 'GPT-4o', 80),
    ('Amharic default -> Pro', 'am', None, 'Gemini 2.5 Pro', 80),
    ('Hindi default -> Flash', 'hi', None, 'Gemini 2.5 Flash', 80),
    ('Bengali default -> Flash', 'bn', None, 'Gemini 2.5 Flash', 80),
    ('Nepali default -> Flash', 'ne', None, 'Gemini 2.5 Flash', 80),
    ('Tamil default -> Flash', 'ta', None, 'Gemini 2.5 Flash', 80),
    ('Sinhala default -> Flash', 'si', None, 'Gemini 2.5 Flash', 80),
    ('Thai default -> Flash', 'th', None, 'Gemini 2.5 Flash', 80),
    # Priority 60 — Structured doc cost savings (any remaining language)
    ('Any ID -> Qwen', None, 'ID_DOCUMENT', 'Qwen2.5-VL 72B', 60),
    ('Any Receipt -> Qwen', None, 'RECEIPT_BILL', 'Qwen2.5-VL 72B', 60),
    # Priority 50 — General language defaults
    ('English default -> Flash', 'en', None, 'Gemini 2.5 Flash', 50),
    ('Swahili default -> Flash', 'sw', None, 'Gemini 2.5 Flash', 50),
    # Priority 10 — Budget catch-all
    ('Budget fallback -> Qwen', None, None, 'Qwen2.5-VL 72B', 10),
]

ROUTING_RULE_NAMES = [r[0] for r in ROUTING_RULES]


# ===========================================================================
# Forward migration
# ===========================================================================

def seed_engine_configs(apps, schema_editor):
    """Insert 4 new engine configs and demote Pixtral to fallback."""
    import base64
    import hashlib
    import os

    from cryptography.fernet import Fernet
    from django.conf import settings
    from django.db import connection

    key = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    f = Fernet(base64.urlsafe_b64encode(key))
    api_key = os.environ.get('OPENROUTER_API_KEY', 'sk-or-placeholder')
    encrypted = f.encrypt(api_key.encode())

    with connection.cursor() as cursor:
        # Demote existing Pixtral/OpenRouter engine: no longer primary, now fallback
        cursor.execute(
            'UPDATE claimlens_engineconfig '
            'SET is_primary = FALSE, is_fallback = TRUE, "DateUpdated" = NOW() '
            'WHERE name = %s AND "isDeleted" = FALSE',
            ['OpenRouter'],
        )

        for eng in ENGINE_CONFIGS:
            cursor.execute(
                '''INSERT INTO claimlens_engineconfig
                   ("UUID", "isDeleted", "Json_ext", "DateCreated", "DateUpdated",
                    version, name, adapter, endpoint_url, api_key_encrypted,
                    model_name, deployment_mode, is_primary, is_fallback, is_active,
                    max_tokens, temperature, timeout_seconds,
                    "UserCreatedUUID", "UserUpdatedUUID")
                   VALUES (%s, FALSE, '{}', NOW(), NOW(),
                    1, %s, %s, %s, %s,
                    %s, %s, %s, %s, TRUE,
                    4096, 0.1, 120,
                    (SELECT id FROM "core_User" LIMIT 1),
                    (SELECT id FROM "core_User" LIMIT 1))''',
                [
                    eng['uuid'],
                    eng['name'],
                    'openai_compatible',
                    'https://openrouter.ai/api',
                    bytes(encrypted),
                    eng['model_name'],
                    'cloud',
                    eng['is_primary'],
                    eng['is_fallback'],
                ],
            )


def seed_document_types(apps, schema_editor):
    """Insert 7 document types with extraction templates."""
    from django.db import connection

    with connection.cursor() as cursor:
        for dt in DOCUMENT_TYPES:
            cursor.execute(
                '''INSERT INTO claimlens_documenttype
                   ("UUID", "isDeleted", "Json_ext", "DateCreated", "DateUpdated",
                    version, code, name, extraction_template, field_definitions,
                    classification_hints, is_active,
                    "UserCreatedUUID", "UserUpdatedUUID")
                   VALUES (%s, FALSE, '{}', NOW(), NOW(),
                    1, %s, %s, %s, '{}',
                    %s, TRUE,
                    (SELECT id FROM "core_User" LIMIT 1),
                    (SELECT id FROM "core_User" LIMIT 1))''',
                [
                    str(uuid.uuid4()),
                    dt['code'],
                    dt['name'],
                    json.dumps(dt['extraction_template']),
                    dt['classification_hints'],
                ],
            )


def seed_capability_scores(apps, schema_editor):
    """Insert 70 capability score rows (5 engines x 14 languages, doc_type=NULL)."""
    from django.db import connection

    with connection.cursor() as cursor:
        for engine_name, lang_scores in CAPABILITY_DATA.items():
            for lang, (accuracy, cost, speed) in lang_scores.items():
                cursor.execute(
                    '''INSERT INTO claimlens_enginecapabilityscore
                       ("UUID", "isDeleted", "Json_ext", "DateCreated", "DateUpdated",
                        version, language, accuracy_score, cost_per_page, speed_score,
                        is_active, document_type_id, engine_config_id,
                        "UserCreatedUUID", "UserUpdatedUUID")
                       VALUES (%s, FALSE, '{}', NOW(), NOW(),
                        1, %s, %s, %s, %s,
                        TRUE, NULL,
                        (SELECT "UUID" FROM claimlens_engineconfig
                         WHERE name = %s AND "isDeleted" = FALSE LIMIT 1),
                        (SELECT id FROM "core_User" LIMIT 1),
                        (SELECT id FROM "core_User" LIMIT 1))''',
                    [
                        str(uuid.uuid4()),
                        lang,
                        accuracy,
                        cost,
                        speed,
                        engine_name,
                    ],
                )


def seed_routing_rules(apps, schema_editor):
    """Insert 29 routing rules with priority-based matching."""
    from django.db import connection

    with connection.cursor() as cursor:
        for name, language, doc_type_code, engine_name, priority in ROUTING_RULES:
            # Build document_type subquery (NULL for wildcard)
            if doc_type_code is not None:
                dt_subquery = (
                    '(SELECT "UUID" FROM claimlens_documenttype '
                    'WHERE code = %s AND "isDeleted" = FALSE LIMIT 1)'
                )
                dt_params = [doc_type_code]
            else:
                dt_subquery = 'NULL'
                dt_params = []

            cursor.execute(
                f'''INSERT INTO claimlens_engineroutingrule
                   ("UUID", "isDeleted", "Json_ext", "DateCreated", "DateUpdated",
                    version, name, language, min_confidence, priority, is_active,
                    document_type_id, engine_config_id,
                    "UserCreatedUUID", "UserUpdatedUUID")
                   VALUES (%s, FALSE, '{{}}'::jsonb, NOW(), NOW(),
                    1, %s, %s, 0.0, %s, TRUE,
                    {dt_subquery},
                    (SELECT "UUID" FROM claimlens_engineconfig
                     WHERE name = %s AND "isDeleted" = FALSE LIMIT 1),
                    (SELECT id FROM "core_User" LIMIT 1),
                    (SELECT id FROM "core_User" LIMIT 1))''',
                [
                    str(uuid.uuid4()),
                    name,
                    language,
                    priority,
                    *dt_params,
                    engine_name,
                ],
            )


# ===========================================================================
# Reverse migration
# ===========================================================================

def reverse_all(apps, schema_editor):
    """Remove all seeded data and restore Pixtral as primary."""
    from django.db import connection

    with connection.cursor() as cursor:
        # Delete routing rules (by name)
        placeholders = ', '.join(['%s'] * len(ROUTING_RULE_NAMES))
        cursor.execute(
            f'DELETE FROM claimlens_engineroutingrule WHERE name IN ({placeholders})',
            ROUTING_RULE_NAMES,
        )

        # Delete capability scores for our engines
        engine_names = ENGINE_NAMES + ['OpenRouter']
        placeholders = ', '.join(['%s'] * len(engine_names))
        cursor.execute(
            f'''DELETE FROM claimlens_enginecapabilityscore
                WHERE engine_config_id IN (
                    SELECT "UUID" FROM claimlens_engineconfig
                    WHERE name IN ({placeholders}) AND "isDeleted" = FALSE
                )''',
            engine_names,
        )

        # Delete document types (by code)
        placeholders = ', '.join(['%s'] * len(DOC_TYPE_CODES))
        cursor.execute(
            f'DELETE FROM claimlens_documenttype WHERE code IN ({placeholders})',
            DOC_TYPE_CODES,
        )

        # Delete new engine configs (by name)
        placeholders = ', '.join(['%s'] * len(ENGINE_NAMES))
        cursor.execute(
            f'DELETE FROM claimlens_engineconfig WHERE name IN ({placeholders})',
            ENGINE_NAMES,
        )

        # Restore Pixtral as primary, no longer fallback
        cursor.execute(
            'UPDATE claimlens_engineconfig '
            'SET is_primary = TRUE, is_fallback = FALSE, "DateUpdated" = NOW() '
            'WHERE name = %s AND "isDeleted" = FALSE',
            ['OpenRouter'],
        )


# ===========================================================================
# Migration class
# ===========================================================================

class Migration(migrations.Migration):

    dependencies = [
        ('claimlens', '0006_engineroutingrule'),
    ]

    operations = [
        migrations.RunPython(seed_engine_configs, reverse_all),
        migrations.RunPython(seed_document_types, migrations.RunPython.noop),
        migrations.RunPython(seed_capability_scores, migrations.RunPython.noop),
        migrations.RunPython(seed_routing_rules, migrations.RunPython.noop),
    ]
