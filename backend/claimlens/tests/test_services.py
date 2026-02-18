from django.test import TestCase

from core.test_helpers import LogInHelper
from claimlens.models import Document, DocumentType, EngineConfig
from claimlens.services import DocumentService, DocumentTypeService, EngineConfigService
from claimlens.tests.data import ClaimlensTestDataMixin


class DocumentTypeServiceTest(TestCase, ClaimlensTestDataMixin):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.user = LogInHelper().get_or_create_user_api()
        cls.service = DocumentTypeService(cls.user)

    def test_create_document_type(self):
        result = self.service.create({**self.document_type_payload})
        self.assertTrue(result.get('success'))
        obj_id = result['data']['id']
        self.assertTrue(DocumentType.objects.filter(id=obj_id).exists())

    def test_create_duplicate_code_fails(self):
        self.service.create({**self.document_type_payload})
        result = self.service.create({**self.document_type_payload})
        self.assertFalse(result.get('success'))

    def test_update_document_type(self):
        create_result = self.service.create({**self.document_type_payload_2})
        self.assertTrue(create_result.get('success'))
        obj_id = create_result['data']['id']

        update_result = self.service.update({
            'id': obj_id,
            'name': 'Updated Name',
        })
        self.assertTrue(update_result.get('success'))

    def test_delete_document_type(self):
        create_result = self.service.create({**self.document_type_payload})
        self.assertTrue(create_result.get('success'))
        obj_id = create_result['data']['id']

        delete_result = self.service.delete({'id': obj_id})
        self.assertTrue(delete_result.get('success'))
        self.assertTrue(DocumentType.objects.get(id=obj_id).is_deleted)


class EngineConfigServiceTest(TestCase, ClaimlensTestDataMixin):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.user = LogInHelper().get_or_create_user_api()
        cls.service = EngineConfigService(cls.user)

    def test_create_engine_config(self):
        result = self.service.create({**self.engine_config_payload})
        self.assertTrue(result.get('success'))

    def test_create_with_api_key_encryption(self):
        result = self.service.create({**self.engine_config_payload})
        self.assertTrue(result.get('success'))
        obj_id = result['data']['id']
        ec = EngineConfig.objects.get(id=obj_id)
        self.assertIsNotNone(ec.api_key_encrypted)
        decrypted = EngineConfigService.decrypt_api_key(ec.api_key_encrypted)
        self.assertEqual(decrypted, 'test-api-key-12345')

    def test_primary_engine_uniqueness(self):
        result1 = self.service.create({**self.engine_config_payload})
        self.assertTrue(result1.get('success'))
        first_id = result1['data']['id']

        payload2 = {**self.engine_config_payload, 'name': 'Second Engine', 'is_primary': True}
        result2 = self.service.create(payload2)
        self.assertTrue(result2.get('success'))

        first = EngineConfig.objects.get(id=first_id)
        self.assertFalse(first.is_primary)


class DocumentServiceTest(TestCase, ClaimlensTestDataMixin):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.user = LogInHelper().get_or_create_user_api()
        cls.service = DocumentService(cls.user)

    def test_upload_document(self):
        result = self.service.upload({**self.document_payload})
        self.assertTrue(result.get('success'))
        obj_id = result['data']['id']
        doc = Document.objects.get(id=obj_id)
        self.assertEqual(doc.status, Document.Status.PENDING)
        self.assertEqual(doc.audit_logs.count(), 1)

    def test_upload_invalid_mime_type(self):
        payload = {**self.document_payload, 'mime_type': 'text/plain'}
        result = self.service.upload(payload)
        self.assertFalse(result.get('success'))

    def test_upload_missing_storage_key(self):
        payload = {**self.document_payload}
        payload.pop('storage_key')
        result = self.service.upload(payload)
        self.assertFalse(result.get('success'))
