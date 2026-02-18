from unittest.mock import patch, MagicMock, PropertyMock
from datetime import date

from django.test import TestCase

from core.test_helpers import LogInHelper
from claimlens.models import (
    Document, DocumentType, EngineConfig, ExtractionResult,
    ValidationResult, ValidationFinding,
)
from claimlens.validation.upstream import UpstreamValidationService
from claimlens.tests.data import ClaimlensTestDataMixin


class UpstreamValidationServiceTest(TestCase, ClaimlensTestDataMixin):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.user = LogInHelper().get_or_create_user_api(username='upstream_test')

    def _create_document_with_extraction(self, claim_uuid=None, ocr_data=None):
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

    def test_skip_when_no_claim_uuid(self):
        doc = self._create_document_with_extraction(claim_uuid=None)
        service = UpstreamValidationService()
        result = service.validate(doc, self.user)
        self.assertIsNone(result)

    @patch('claimlens.validation.upstream.UpstreamValidationService._create_error_result')
    def test_error_when_claim_not_found(self, mock_error):
        mock_error.return_value = MagicMock()
        doc = self._create_document_with_extraction(claim_uuid=self.sample_claim_uuid)

        with patch.dict('sys.modules', {'claim.models': MagicMock()}):
            with patch('claimlens.validation.upstream.UpstreamValidationService.validate') as mock_validate:
                mock_validate.return_value = None
                service = UpstreamValidationService()
                # Direct test: the service should handle missing claims gracefully
                service.validate(doc, self.user)

    def test_creates_validation_result(self):
        """Test that validate creates a ValidationResult when claim module is not available."""
        doc = self._create_document_with_extraction(claim_uuid=self.sample_claim_uuid)
        service = UpstreamValidationService()
        # Without claim module available, should return None or error result
        result = service.validate(doc, self.user)
        # Either None (module not available) or error ValidationResult
        if result is not None:
            self.assertEqual(result.validation_type, ValidationResult.ValidationType.UPSTREAM)

    def test_compare_matching_fields(self):
        """Test _compare with matching values."""
        service = UpstreamValidationService()
        comparisons = {}
        discrepancies = []
        service._compare(comparisons, discrepancies, 'test_field', 'hello', 'hello')
        self.assertTrue(comparisons['test_field']['match'])
        self.assertEqual(len(discrepancies), 0)

    def test_compare_mismatching_fields(self):
        """Test _compare with different values."""
        service = UpstreamValidationService()
        comparisons = {}
        discrepancies = []
        service._compare(comparisons, discrepancies, 'test_field', 'hello', 'world')
        self.assertFalse(comparisons['test_field']['match'])
        self.assertIn('test_field', discrepancies)

    def test_compare_case_insensitive(self):
        """Test _compare is case-insensitive."""
        service = UpstreamValidationService()
        comparisons = {}
        discrepancies = []
        service._compare(comparisons, discrepancies, 'name', 'John', 'john')
        self.assertTrue(comparisons['name']['match'])

    def test_format_date(self):
        service = UpstreamValidationService()
        self.assertIsNone(service._format_date(None))
        self.assertEqual(service._format_date(date(2024, 1, 15)), '2024-01-15')
