from unittest.mock import patch, MagicMock

from django.test import TestCase

from core.test_helpers import LogInHelper
from claimlens.models import (
    Document, DocumentType, ExtractionResult,
    ValidationResult, ValidationRule, ValidationFinding,
)
from claimlens.validation.downstream import DownstreamValidationService
from claimlens.tests.data import ClaimlensTestDataMixin


class DownstreamValidationServiceTest(TestCase, ClaimlensTestDataMixin):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.user = LogInHelper().get_or_create_user_api(username='downstream_test')

    def _create_document_with_extraction(self, ocr_data=None, claim_uuid=None):
        doc_type = DocumentType(**self.document_type_payload)
        doc_type.save(user=self.user)

        doc = Document(
            **self.document_payload,
            document_type=doc_type,
            status=Document.Status.COMPLETED,
            claim_uuid=claim_uuid,
        )
        doc.save(user=self.user)

        extraction = ExtractionResult(
            document=doc,
            structured_data=ocr_data or self.sample_ocr_data_for_validation,
            field_confidences={},
            aggregate_confidence=0.95,
        )
        extraction.save(user=self.user)

        return doc

    def test_skip_when_no_extraction(self):
        doc_type = DocumentType(**self.document_type_payload)
        doc_type.save(user=self.user)
        doc = Document(
            **self.document_payload,
            status=Document.Status.COMPLETED,
        )
        doc.save(user=self.user)

        service = DownstreamValidationService()
        result = service.validate(doc, self.user)
        self.assertIsNone(result)

    def test_no_rules_produces_matched_result(self):
        doc = self._create_document_with_extraction()
        service = DownstreamValidationService()
        result = service.validate(doc, self.user)
        self.assertIsNotNone(result)
        self.assertEqual(result.overall_status, ValidationResult.OverallStatus.MATCHED)
        self.assertEqual(result.discrepancy_count, 0)

    def test_clinical_rule_detects_incompatible_service(self):
        doc = self._create_document_with_extraction(
            ocr_data={
                'icd_code': 'A00',
                'services': [
                    {'code': 'SVC001', 'quantity': 1, 'price': 100},
                    {'code': 'SVC_INVALID', 'quantity': 1, 'price': 200},
                ],
            }
        )

        ValidationRule(**self.validation_rule_clinical_payload).save(user=self.user)

        service = DownstreamValidationService()
        result = service.validate(doc, self.user)

        self.assertIsNotNone(result)
        findings = ValidationFinding.objects.filter(
            validation_result=result, is_deleted=False
        )
        # Should have at least one finding for incompatible service
        incompatible = findings.filter(field='service_SVC_INVALID')
        self.assertTrue(incompatible.exists())

    def test_clinical_rule_passes_compatible_service(self):
        doc = self._create_document_with_extraction(
            ocr_data={
                'icd_code': 'A00',
                'services': [
                    {'code': 'SVC001', 'quantity': 1, 'price': 100},
                ],
            }
        )

        ValidationRule(**self.validation_rule_clinical_payload).save(user=self.user)

        service = DownstreamValidationService()
        result = service.validate(doc, self.user)

        findings = ValidationFinding.objects.filter(
            validation_result=result, is_deleted=False
        )
        self.assertEqual(findings.count(), 0)

    def test_creates_audit_log(self):
        from claimlens.models import AuditLog
        doc = self._create_document_with_extraction()
        service = DownstreamValidationService()
        service.validate(doc, self.user)

        logs = AuditLog.objects.filter(
            document=doc,
            action=AuditLog.Action.REVIEW,
            is_deleted=False,
        )
        self.assertTrue(logs.exists())
        self.assertEqual(logs.first().details.get('validation_type'), 'downstream')
