from unittest.mock import patch, MagicMock
from django.test import TestCase

from core.test_helpers import LogInHelper
from claimlens.models import Document, DocumentType, ExtractionResult, AuditLog
from claimlens.engine.types import LLMResponse
from claimlens.tests.data import ClaimlensTestDataMixin


class PreprocessDocumentTaskTest(TestCase, ClaimlensTestDataMixin):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.user = LogInHelper().get_or_create_user_api()

    @patch('claimlens.tasks.ClaimlensStorage')
    @patch('claimlens.tasks.analyze_image')
    def test_preprocess_success(self, mock_analyze, mock_storage_cls):
        doc = Document(**self.document_payload)
        doc.save(user=self.user)

        mock_storage = MagicMock()
        mock_storage.read.return_value = b'fake-file-bytes'
        mock_storage_cls.return_value = mock_storage

        mock_analyze.return_value = {'width': 1000, 'height': 1400, 'quality_score': 0.85}

        from claimlens.tasks import preprocess_document
        result = preprocess_document(str(doc.id), str(self.user.id))

        self.assertEqual(result, str(doc.id))
        doc.refresh_from_db()
        self.assertEqual(doc.preprocessing_metadata['quality_score'], 0.85)
        self.assertTrue(
            AuditLog.objects.filter(document=doc, action=AuditLog.Action.PREPROCESS).exists()
        )


class ClassifyDocumentTaskTest(TestCase, ClaimlensTestDataMixin):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.user = LogInHelper().get_or_create_user_api()

    @patch('claimlens.tasks.EngineManager')
    @patch('claimlens.tasks.ClaimlensStorage')
    def test_classify_success(self, mock_storage_cls, mock_manager_cls):
        dt = DocumentType(**self.document_type_payload)
        dt.save(user=self.user)

        doc = Document(**self.document_payload, status=Document.Status.PREPROCESSING)
        doc.save(user=self.user)

        mock_storage = MagicMock()
        mock_storage.read.return_value = b'fake-file-bytes'
        mock_storage_cls.return_value = mock_storage

        mock_manager = MagicMock()
        mock_manager.classify.return_value = LLMResponse(
            success=True,
            data={'document_type_code': 'CLAIM_FORM', 'confidence': 0.95},
            confidence=0.95,
            engine_name='test',
            tokens_used=100,
        )
        mock_manager.get_primary_engine_config.return_value = None
        mock_manager_cls.return_value = mock_manager

        from claimlens.tasks import classify_document
        result = classify_document(str(doc.id), str(self.user.id))

        self.assertEqual(result, str(doc.id))
        doc.refresh_from_db()
        self.assertEqual(doc.document_type, dt)
        self.assertEqual(doc.classification_confidence, 0.95)


class ExtractDocumentTaskTest(TestCase, ClaimlensTestDataMixin):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.user = LogInHelper().get_or_create_user_api()

    @patch('claimlens.tasks.EngineManager')
    @patch('claimlens.tasks.ClaimlensStorage')
    def test_extract_high_confidence_completes(self, mock_storage_cls, mock_manager_cls):
        dt = DocumentType(**self.document_type_payload)
        dt.save(user=self.user)

        doc = Document(**self.document_payload, document_type=dt, status=Document.Status.CLASSIFYING)
        doc.save(user=self.user)

        mock_storage = MagicMock()
        mock_storage.read.return_value = b'fake-file-bytes'
        mock_storage_cls.return_value = mock_storage

        mock_manager = MagicMock()
        mock_manager.extract.return_value = LLMResponse(
            success=True,
            data=self.sample_llm_extraction_response,
            confidence=0.95,
            raw_response={'test': True},
            tokens_used=200,
            processing_time_ms=1500,
            engine_name='test',
        )
        mock_manager_cls.return_value = mock_manager

        from claimlens.tasks import extract_document
        result = extract_document(str(doc.id), str(self.user.id))

        self.assertEqual(result, str(doc.id))
        doc.refresh_from_db()
        self.assertEqual(doc.status, Document.Status.COMPLETED)
        self.assertTrue(ExtractionResult.objects.filter(document=doc).exists())

    @patch('claimlens.tasks.EngineManager')
    @patch('claimlens.tasks.ClaimlensStorage')
    def test_extract_low_confidence_fails(self, mock_storage_cls, mock_manager_cls):
        doc = Document(**self.document_payload, status=Document.Status.CLASSIFYING)
        doc.save(user=self.user)

        mock_storage = MagicMock()
        mock_storage.read.return_value = b'fake-file-bytes'
        mock_storage_cls.return_value = mock_storage

        low_confidence_response = {
            'fields': {
                'patient_name': {'value': '???', 'confidence': 0.3},
            },
            'aggregate_confidence': 0.3,
        }

        mock_manager = MagicMock()
        mock_manager.extract.return_value = LLMResponse(
            success=True,
            data=low_confidence_response,
            confidence=0.3,
            raw_response={},
            tokens_used=100,
            processing_time_ms=1000,
            engine_name='test',
        )
        mock_manager_cls.return_value = mock_manager

        from claimlens.tasks import extract_document
        result = extract_document(str(doc.id), str(self.user.id))

        doc.refresh_from_db()
        self.assertEqual(doc.status, Document.Status.FAILED)

    @patch('claimlens.tasks.EngineManager')
    @patch('claimlens.tasks.ClaimlensStorage')
    def test_extract_medium_confidence_review_required(self, mock_storage_cls, mock_manager_cls):
        doc = Document(**self.document_payload, status=Document.Status.CLASSIFYING)
        doc.save(user=self.user)

        mock_storage = MagicMock()
        mock_storage.read.return_value = b'fake-file-bytes'
        mock_storage_cls.return_value = mock_storage

        medium_confidence_response = {
            'fields': {
                'patient_name': {'value': 'John Doe', 'confidence': 0.75},
            },
            'aggregate_confidence': 0.75,
        }

        mock_manager = MagicMock()
        mock_manager.extract.return_value = LLMResponse(
            success=True,
            data=medium_confidence_response,
            confidence=0.75,
            raw_response={},
            tokens_used=100,
            processing_time_ms=1000,
            engine_name='test',
        )
        mock_manager_cls.return_value = mock_manager

        from claimlens.tasks import extract_document
        result = extract_document(str(doc.id), str(self.user.id))

        doc.refresh_from_db()
        self.assertEqual(doc.status, Document.Status.REVIEW_REQUIRED)
