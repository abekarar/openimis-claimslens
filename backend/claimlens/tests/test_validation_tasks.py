from unittest.mock import patch, MagicMock

from django.test import TestCase

from core.test_helpers import LogInHelper
from claimlens.models import Document, DocumentType, ExtractionResult
from claimlens.tests.data import ClaimlensTestDataMixin


class ValidationTasksTest(TestCase, ClaimlensTestDataMixin):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.user = LogInHelper().get_or_create_user_api(username='validation_task_test')

    def _create_completed_document(self, claim_uuid=None):
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
            structured_data=self.sample_ocr_data_for_validation,
            field_confidences={},
            aggregate_confidence=0.95,
        )
        extraction.save(user=self.user)

        return doc

    @patch('claimlens.validation.upstream.UpstreamValidationService.validate')
    def test_validate_upstream_task(self, mock_validate):
        mock_validate.return_value = MagicMock()

        doc = self._create_completed_document(claim_uuid=self.sample_claim_uuid)

        from claimlens.tasks import validate_upstream
        result = validate_upstream(str(doc.id), str(self.user.id))

        self.assertEqual(result, str(doc.id))
        mock_validate.assert_called_once()

    @patch('claimlens.validation.downstream.DownstreamValidationService.validate')
    def test_validate_downstream_task(self, mock_validate):
        mock_validate.return_value = MagicMock()

        doc = self._create_completed_document()

        from claimlens.tasks import validate_downstream
        result = validate_downstream(str(doc.id), str(self.user.id))

        self.assertEqual(result, str(doc.id))
        mock_validate.assert_called_once()
