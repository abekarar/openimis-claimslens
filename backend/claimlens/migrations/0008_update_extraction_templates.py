import json
from django.db import migrations


# ---------------------------------------------------------------------------
# Updated extraction templates — consistent with MEDICAL_INVOICE style:
#   - Specific types: string, decimal, date, integer
#   - required: true/false flags on all fields
#   - Array items use "type: description" shorthand
# ---------------------------------------------------------------------------
TEMPLATES = {
    'CLAIM_FORM': {
        'patient_name': {'type': 'string', 'required': True},
        'patient_id': {'type': 'string', 'required': False},
        'claim_number': {'type': 'string', 'required': True},
        'service_date': {'type': 'date', 'required': True},
        'provider_name': {'type': 'string', 'required': True},
        'provider_id': {'type': 'string', 'required': False},
        'diagnosis_codes': {
            'type': 'array',
            'required': True,
            'items': {
                'code': 'string: ICD-10 diagnosis code',
                'description': 'string: diagnosis description',
            },
        },
        'procedure_codes': {
            'type': 'array',
            'required': False,
            'items': {
                'code': 'string: CPT/procedure code',
                'description': 'string: procedure description',
                'date_of_service': 'date: YYYY-MM-DD when procedure was performed',
            },
        },
        'total_amount': {'type': 'decimal', 'required': True},
        'currency': {'type': 'string', 'required': False},
    },
    'PRESCRIPTION': {
        'patient_name': {'type': 'string', 'required': True},
        'patient_id': {'type': 'string', 'required': False},
        'prescriber_name': {'type': 'string', 'required': True},
        'prescriber_id': {'type': 'string', 'required': False},
        'date_prescribed': {'type': 'date', 'required': True},
        'diagnosis': {'type': 'string', 'required': False},
        'medications': {
            'type': 'array',
            'required': True,
            'items': {
                'name': 'string: medication or drug name',
                'dosage': 'string: dose amount and unit (e.g. 500mg)',
                'frequency': 'string: how often to take (e.g. twice daily)',
                'duration': 'string: treatment duration (e.g. 7 days)',
                'quantity': 'integer: number of units dispensed',
            },
        },
    },
    'LAB_REPORT': {
        'patient_name': {'type': 'string', 'required': True},
        'patient_id': {'type': 'string', 'required': False},
        'lab_name': {'type': 'string', 'required': True},
        'ordering_physician': {'type': 'string', 'required': False},
        'collection_date': {'type': 'date', 'required': True},
        'report_date': {'type': 'date', 'required': True},
        'test_results': {
            'type': 'array',
            'required': True,
            'items': {
                'test_name': 'string: name of the laboratory test',
                'value': 'string: measured result value',
                'unit': 'string: unit of measurement',
                'reference_range': 'string: normal reference range',
                'flag': 'string: abnormality flag (H=high, L=low, N=normal)',
            },
        },
    },
    'DISCHARGE_SUMMARY': {
        'patient_name': {'type': 'string', 'required': True},
        'patient_id': {'type': 'string', 'required': False},
        'admission_date': {'type': 'date', 'required': True},
        'discharge_date': {'type': 'date', 'required': True},
        'admitting_diagnosis': {'type': 'string', 'required': True},
        'discharge_diagnosis': {'type': 'string', 'required': True},
        'attending_physician': {'type': 'string', 'required': True},
        'follow_up_instructions': {'type': 'string', 'required': False},
        'procedures_performed': {
            'type': 'array',
            'required': False,
            'items': {
                'procedure': 'string: procedure name or description',
                'procedure_code': 'string: CPT/procedure code if present',
                'date': 'date: YYYY-MM-DD when procedure was performed',
            },
        },
        'medications_at_discharge': {
            'type': 'array',
            'required': False,
            'items': {
                'name': 'string: medication name',
                'dosage': 'string: dose amount and unit',
                'frequency': 'string: how often to take',
            },
        },
    },
    'REFERRAL_LETTER': {
        'patient_name': {'type': 'string', 'required': True},
        'patient_id': {'type': 'string', 'required': False},
        'referring_physician': {'type': 'string', 'required': True},
        'referring_facility': {'type': 'string', 'required': False},
        'referred_to_physician': {'type': 'string', 'required': True},
        'referred_to_facility': {'type': 'string', 'required': False},
        'referral_reason': {'type': 'string', 'required': True},
        'referral_date': {'type': 'date', 'required': True},
        'clinical_summary': {'type': 'string', 'required': False},
    },
    'RECEIPT_BILL': {
        'patient_name': {'type': 'string', 'required': False},
        'receipt_number': {'type': 'string', 'required': True},
        'facility_name': {'type': 'string', 'required': True},
        'service_date': {'type': 'date', 'required': False},
        'line_items': {
            'type': 'array',
            'required': True,
            'items': {
                'description': 'string: service or item description',
                'quantity': 'integer: number of units',
                'unit_price': 'decimal: price per unit',
                'amount': 'decimal: line total',
            },
        },
        'subtotal': {'type': 'decimal', 'required': False},
        'tax': {'type': 'decimal', 'required': False},
        'total_amount': {'type': 'decimal', 'required': True},
        'payment_method': {'type': 'string', 'required': False},
        'currency': {'type': 'string', 'required': False},
    },
    'ID_DOCUMENT': {
        'full_name': {'type': 'string', 'required': True},
        'document_number': {'type': 'string', 'required': True},
        'date_of_birth': {'type': 'date', 'required': True},
        'gender': {'type': 'string', 'required': False},
        'address': {'type': 'string', 'required': False},
        'issue_date': {'type': 'date', 'required': False},
        'expiry_date': {'type': 'date', 'required': False},
        'issuing_authority': {'type': 'string', 'required': False},
        'document_subtype': {'type': 'string', 'required': False},
    },
}


def update_templates(apps, schema_editor):
    """Update extraction templates to use consistent typed schema."""
    from django.db import connection

    with connection.cursor() as cursor:
        for code, template in TEMPLATES.items():
            cursor.execute(
                '''UPDATE claimlens_documenttype
                   SET extraction_template = %s, "DateUpdated" = NOW()
                   WHERE code = %s AND "isDeleted" = FALSE''',
                [json.dumps(template), code],
            )


def reverse_update(apps, schema_editor):
    """Revert to original string-only templates (from migration 0007)."""
    from django.db import connection

    # Original templates used {'type': 'string'} for everything
    ORIGINAL = {
        'CLAIM_FORM': {
            'patient_name': {'type': 'string'}, 'patient_id': {'type': 'string'},
            'diagnosis_codes': {'type': 'array', 'items': {'code': {'type': 'string'}, 'description': {'type': 'string'}}},
            'procedure_codes': {'type': 'array', 'items': {'code': {'type': 'string'}, 'description': {'type': 'string'}}},
            'service_date': {'type': 'string'}, 'provider_name': {'type': 'string'},
            'provider_id': {'type': 'string'}, 'total_amount': {'type': 'string'},
            'claim_number': {'type': 'string'}, 'currency': {'type': 'string'},
        },
        'PRESCRIPTION': {
            'patient_name': {'type': 'string'}, 'patient_id': {'type': 'string'},
            'prescriber_name': {'type': 'string'}, 'prescriber_id': {'type': 'string'},
            'medications': {'type': 'array', 'items': {'name': {'type': 'string'}, 'dosage': {'type': 'string'}, 'frequency': {'type': 'string'}, 'duration': {'type': 'string'}, 'quantity': {'type': 'string'}}},
            'date_prescribed': {'type': 'string'}, 'diagnosis': {'type': 'string'},
        },
        'LAB_REPORT': {
            'patient_name': {'type': 'string'}, 'patient_id': {'type': 'string'},
            'test_results': {'type': 'array', 'items': {'test_name': {'type': 'string'}, 'value': {'type': 'string'}, 'unit': {'type': 'string'}, 'reference_range': {'type': 'string'}, 'flag': {'type': 'string'}}},
            'lab_name': {'type': 'string'}, 'ordering_physician': {'type': 'string'},
            'collection_date': {'type': 'string'}, 'report_date': {'type': 'string'},
        },
        'DISCHARGE_SUMMARY': {
            'patient_name': {'type': 'string'}, 'patient_id': {'type': 'string'},
            'admission_date': {'type': 'string'}, 'discharge_date': {'type': 'string'},
            'admitting_diagnosis': {'type': 'string'}, 'discharge_diagnosis': {'type': 'string'},
            'procedures_performed': {'type': 'array', 'items': {'procedure': {'type': 'string'}, 'date': {'type': 'string'}}},
            'medications_at_discharge': {'type': 'array', 'items': {'name': {'type': 'string'}, 'dosage': {'type': 'string'}, 'frequency': {'type': 'string'}}},
            'follow_up_instructions': {'type': 'string'}, 'attending_physician': {'type': 'string'},
        },
        'REFERRAL_LETTER': {
            'patient_name': {'type': 'string'}, 'patient_id': {'type': 'string'},
            'referring_physician': {'type': 'string'}, 'referring_facility': {'type': 'string'},
            'referred_to_physician': {'type': 'string'}, 'referred_to_facility': {'type': 'string'},
            'referral_reason': {'type': 'string'}, 'referral_date': {'type': 'string'},
            'clinical_summary': {'type': 'string'},
        },
        'RECEIPT_BILL': {
            'patient_name': {'type': 'string'}, 'receipt_number': {'type': 'string'},
            'facility_name': {'type': 'string'}, 'service_date': {'type': 'string'},
            'line_items': {'type': 'array', 'items': {'description': {'type': 'string'}, 'quantity': {'type': 'string'}, 'unit_price': {'type': 'string'}, 'amount': {'type': 'string'}}},
            'subtotal': {'type': 'string'}, 'tax': {'type': 'string'},
            'total_amount': {'type': 'string'}, 'payment_method': {'type': 'string'},
            'currency': {'type': 'string'},
        },
        'ID_DOCUMENT': {
            'full_name': {'type': 'string'}, 'document_number': {'type': 'string'},
            'date_of_birth': {'type': 'string'}, 'gender': {'type': 'string'},
            'address': {'type': 'string'}, 'issue_date': {'type': 'string'},
            'expiry_date': {'type': 'string'}, 'issuing_authority': {'type': 'string'},
            'document_subtype': {'type': 'string'},
        },
    }

    with connection.cursor() as cursor:
        for code, template in ORIGINAL.items():
            cursor.execute(
                '''UPDATE claimlens_documenttype
                   SET extraction_template = %s, "DateUpdated" = NOW()
                   WHERE code = %s AND "isDeleted" = FALSE''',
                [json.dumps(template), code],
            )


class Migration(migrations.Migration):

    dependencies = [
        ('claimlens', '0007_seed_engines_doctypes_routing'),
    ]

    operations = [
        migrations.RunPython(update_templates, reverse_update),
    ]
