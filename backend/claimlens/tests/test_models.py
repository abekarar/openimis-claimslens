from django.test import TestCase

from core.test_helpers import LogInHelper
from claimlens.models import Document, DocumentType, EngineConfig, ExtractionResult, AuditLog
from claimlens.tests.data import ClaimlensTestDataMixin


class DocumentTypeModelTest(TestCase, ClaimlensTestDataMixin):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.user = LogInHelper().get_or_create_user_api()

    def test_create_document_type(self):
        dt = DocumentType(**self.document_type_payload)
        dt.save(user=self.user)
        self.assertIsNotNone(dt.id)
        self.assertEqual(dt.code, 'CLAIM_FORM')
        self.assertTrue(dt.is_active)

    def test_document_type_str(self):
        dt = DocumentType(**self.document_type_payload)
        dt.save(user=self.user)
        self.assertIn('CLAIM_FORM', str(dt))

    def test_document_type_soft_delete(self):
        dt = DocumentType(**self.document_type_payload)
        dt.save(user=self.user)
        dt.delete(user=self.user)
        self.assertTrue(dt.is_deleted)


class EngineConfigModelTest(TestCase, ClaimlensTestDataMixin):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.user = LogInHelper().get_or_create_user_api()

    def test_create_engine_config(self):
        payload = {k: v for k, v in self.engine_config_payload.items() if k != 'api_key'}
        ec = EngineConfig(**payload)
        ec.save(user=self.user)
        self.assertIsNotNone(ec.id)
        self.assertEqual(ec.adapter, 'mistral')
        self.assertTrue(ec.is_primary)

    def test_engine_config_choices(self):
        self.assertIn('mistral', dict(EngineConfig.Adapter.choices))
        self.assertIn('gemini', dict(EngineConfig.Adapter.choices))
        self.assertIn('deepseek', dict(EngineConfig.Adapter.choices))


class DocumentModelTest(TestCase, ClaimlensTestDataMixin):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.user = LogInHelper().get_or_create_user_api()

    def test_create_document(self):
        doc = Document(**self.document_payload)
        doc.save(user=self.user)
        self.assertIsNotNone(doc.id)
        self.assertEqual(doc.status, Document.Status.PENDING)

    def test_document_status_transitions(self):
        doc = Document(**self.document_payload)
        doc.save(user=self.user)

        doc.status = Document.Status.PREPROCESSING
        doc.save(user=self.user)
        self.assertEqual(doc.status, Document.Status.PREPROCESSING)

        doc.status = Document.Status.COMPLETED
        doc.save(user=self.user)
        self.assertEqual(doc.status, Document.Status.COMPLETED)


class ExtractionResultModelTest(TestCase, ClaimlensTestDataMixin):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.user = LogInHelper().get_or_create_user_api()

    def test_create_extraction_result(self):
        doc = Document(**self.document_payload)
        doc.save(user=self.user)

        er = ExtractionResult(
            document=doc,
            structured_data={'patient_name': 'John Doe'},
            field_confidences={'patient_name': 0.98},
            aggregate_confidence=0.95,
            processing_time_ms=1500,
            tokens_used=200,
        )
        er.save(user=self.user)
        self.assertIsNotNone(er.id)
        self.assertEqual(er.aggregate_confidence, 0.95)


class AuditLogModelTest(TestCase, ClaimlensTestDataMixin):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.user = LogInHelper().get_or_create_user_api()

    def test_create_audit_log(self):
        doc = Document(**self.document_payload)
        doc.save(user=self.user)

        log = AuditLog(
            document=doc,
            action=AuditLog.Action.UPLOAD,
            details={'filename': doc.original_filename},
        )
        log.save(user=self.user)
        self.assertIsNotNone(log.id)
        self.assertEqual(log.action, AuditLog.Action.UPLOAD)

    def test_audit_log_ordering(self):
        doc = Document(**self.document_payload)
        doc.save(user=self.user)

        log1 = AuditLog(document=doc, action=AuditLog.Action.UPLOAD, details={})
        log1.save(user=self.user)
        log2 = AuditLog(document=doc, action=AuditLog.Action.PREPROCESS, details={})
        log2.save(user=self.user)

        logs = AuditLog.objects.filter(document=doc)
        self.assertEqual(logs.first().action, AuditLog.Action.PREPROCESS)
