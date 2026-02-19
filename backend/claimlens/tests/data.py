import uuid as _uuid

from claimlens.models import Document, DocumentType, EngineConfig


class ClaimlensTestDataMixin:

    document_type_payload = {
        'code': 'CLAIM_FORM',
        'name': 'Standard Claim Form',
        'extraction_template': {
            'patient_name': {'type': 'string', 'required': True},
            'claim_date': {'type': 'date', 'required': True},
            'amount': {'type': 'number', 'required': True},
        },
        'field_definitions': {
            'patient_name': {'label': 'Patient Name'},
            'claim_date': {'label': 'Claim Date'},
            'amount': {'label': 'Amount'},
        },
        'classification_hints': 'health insurance claim form with patient details',
        'is_active': True,
    }

    document_type_payload_2 = {
        'code': 'PRESCRIPTION',
        'name': 'Prescription Form',
        'extraction_template': {
            'patient_name': {'type': 'string', 'required': True},
            'medication': {'type': 'string', 'required': True},
        },
        'field_definitions': {
            'patient_name': {'label': 'Patient Name'},
            'medication': {'label': 'Medication'},
        },
        'classification_hints': 'medical prescription document',
        'is_active': True,
    }

    engine_config_payload = {
        'name': 'Test OpenAI Compatible Engine',
        'adapter': 'openai_compatible',
        'endpoint_url': 'https://openrouter.ai/api',
        'api_key': 'test-api-key-12345',
        'model_name': 'mistralai/pixtral-large-latest',
        'deployment_mode': EngineConfig.DeploymentMode.CLOUD,
        'is_primary': True,
        'is_fallback': False,
        'is_active': True,
        'max_tokens': 4096,
        'temperature': 0.1,
        'timeout_seconds': 120,
    }

    document_payload = {
        'original_filename': 'test_claim.pdf',
        'mime_type': 'application/pdf',
        'file_size': 102400,
        'storage_key': 'documents/test-uuid/test_claim.pdf',
    }

    sample_llm_classification_response = {
        'document_type_code': 'CLAIM_FORM',
        'confidence': 0.95,
        'reasoning': 'Document contains claim form headers and patient fields',
    }

    sample_llm_extraction_response = {
        'fields': {
            'patient_name': {'value': 'John Doe', 'confidence': 0.98},
            'claim_date': {'value': '2024-01-15', 'confidence': 0.95},
            'amount': {'value': 1500.00, 'confidence': 0.92},
        },
        'aggregate_confidence': 0.95,
    }

    sample_llm_classification_response_with_language = {
        'document_type_code': 'CLAIM_FORM',
        'confidence': 0.95,
        'language': 'en',
        'reasoning': 'English language claim form',
    }

    capability_score_payload = {
        'language': 'en',
        'accuracy_score': 90,
        'cost_per_page': 0.05,
        'speed_score': 80,
        'is_active': True,
    }

    capability_score_payload_fr = {
        'language': 'fr',
        'accuracy_score': 95,
        'cost_per_page': 0.08,
        'speed_score': 70,
        'is_active': True,
    }

    routing_policy_payload = {
        'accuracy_weight': 0.50,
        'cost_weight': 0.30,
        'speed_weight': 0.20,
    }

    validation_rule_eligibility_payload = {
        'code': 'ELIG_001',
        'name': 'Active Policy Check',
        'rule_type': 'eligibility',
        'rule_definition': {},
        'severity': 'error',
        'is_active': True,
    }

    validation_rule_fraud_payload = {
        'code': 'FRAUD_001',
        'name': 'Duplicate Claim Check',
        'rule_type': 'fraud',
        'rule_definition': {},
        'severity': 'warning',
        'is_active': True,
    }

    validation_rule_clinical_payload = {
        'code': 'CLIN_001',
        'name': 'Diagnosis-Service Compatibility',
        'rule_type': 'clinical',
        'rule_definition': {
            'allowed_icd_service_map': {
                'A00': ['SVC001', 'SVC002'],
                'B00': ['SVC003'],
            }
        },
        'severity': 'warning',
        'is_active': True,
    }

    validation_rule_registry_payload = {
        'code': 'REG_001',
        'name': 'Insuree Registry Update',
        'rule_type': 'registry',
        'rule_definition': {
            'insuree_fields': ['phone', 'email'],
            'facility_fields': [],
        },
        'severity': 'info',
        'is_active': True,
    }

    sample_ocr_data_for_validation = {
        'chf_id': '123456789',
        'last_name': 'Doe',
        'other_names': 'John',
        'dob': '1990-01-15',
        'date_from': '2024-01-10',
        'date_to': '2024-01-10',
        'facility_code': 'HF001',
        'facility_name': 'Test Hospital',
        'icd_code': 'A00',
        'claimed_amount': '1500.00',
        'items': [
            {'code': 'ITEM001', 'quantity': 2, 'price': 100.00},
        ],
        'services': [
            {'code': 'SVC001', 'quantity': 1, 'price': 500.00},
        ],
    }

    sample_claim_uuid = str(_uuid.uuid4())
