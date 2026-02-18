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
        'name': 'Test Mistral Engine',
        'adapter': 'mistral',
        'endpoint_url': 'https://api.mistral.ai',
        'api_key': 'test-api-key-12345',
        'model_name': 'pixtral-large-latest',
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
