from unittest.mock import patch, MagicMock
from django.test import TestCase

from claimlens.engine.base import ADAPTER_REGISTRY
from claimlens.engine.types import LLMResponse
from claimlens.engine.manager import EngineManager
from claimlens.engine.adapters.openai_compatible import OpenAICompatibleEngine
from claimlens.engine.adapters.gemini import GeminiEngine
from claimlens.tests.data import ClaimlensTestDataMixin


class AdapterRegistryTest(TestCase):

    def test_all_adapters_registered(self):
        self.assertIn('openai_compatible', ADAPTER_REGISTRY)
        self.assertIn('gemini', ADAPTER_REGISTRY)
        self.assertIn('mistral', ADAPTER_REGISTRY)
        self.assertIn('deepseek', ADAPTER_REGISTRY)

    def test_adapter_classes(self):
        self.assertEqual(ADAPTER_REGISTRY['openai_compatible'], OpenAICompatibleEngine)
        self.assertEqual(ADAPTER_REGISTRY['gemini'], GeminiEngine)
        # Legacy aliases point to the same class
        self.assertIs(ADAPTER_REGISTRY['mistral'], OpenAICompatibleEngine)
        self.assertIs(ADAPTER_REGISTRY['deepseek'], OpenAICompatibleEngine)


class OpenAICompatibleEngineTest(TestCase, ClaimlensTestDataMixin):

    def setUp(self):
        self.engine = OpenAICompatibleEngine({
            'name': 'test-openai-compat',
            'endpoint_url': 'https://openrouter.ai/api',
            'api_key': 'test-key',
            'model_name': 'mistralai/pixtral-large-latest',
        })

    @patch('claimlens.engine.base.httpx.Client')
    def test_classify_success(self, mock_client_cls):
        mock_response = MagicMock()
        mock_response.json.return_value = {
            'choices': [{'message': {'content': '{"document_type_code": "CLAIM_FORM", "confidence": 0.95, "reasoning": "test"}'}}],
            'usage': {'total_tokens': 100},
        }
        mock_response.raise_for_status = MagicMock()
        mock_client = MagicMock()
        mock_client.post.return_value = mock_response
        mock_client.__enter__ = MagicMock(return_value=mock_client)
        mock_client.__exit__ = MagicMock(return_value=False)
        mock_client_cls.return_value = mock_client

        doc_types = [{'code': 'CLAIM_FORM', 'name': 'Claim Form', 'classification_hints': 'test'}]
        result = self.engine.classify(b'fake-image-bytes', 'image/jpeg', doc_types)

        self.assertTrue(result.success)
        self.assertEqual(result.data['document_type_code'], 'CLAIM_FORM')
        self.assertEqual(result.confidence, 0.95)

    @patch('claimlens.engine.base.httpx.Client')
    def test_extract_success(self, mock_client_cls):
        mock_response = MagicMock()
        mock_response.json.return_value = {
            'choices': [{'message': {'content': '{"fields": {"patient_name": {"value": "John", "confidence": 0.98}}, "aggregate_confidence": 0.95}'}}],
            'usage': {'total_tokens': 150},
        }
        mock_response.raise_for_status = MagicMock()
        mock_client = MagicMock()
        mock_client.post.return_value = mock_response
        mock_client.__enter__ = MagicMock(return_value=mock_client)
        mock_client.__exit__ = MagicMock(return_value=False)
        mock_client_cls.return_value = mock_client

        template = {'patient_name': {'type': 'string'}}
        result = self.engine.extract(b'fake-image-bytes', 'image/jpeg', template)

        self.assertTrue(result.success)
        self.assertEqual(result.data['fields']['patient_name']['value'], 'John')
        self.assertEqual(result.confidence, 0.95)

    def test_classify_network_error(self):
        result = self.engine.classify(b'fake', 'image/jpeg', [])
        self.assertFalse(result.success)
        self.assertIsNotNone(result.error)


class EngineManagerTest(TestCase):

    @patch('claimlens.engine.manager.EngineConfig')
    def test_no_engines_returns_error(self, mock_model):
        mock_model.objects.filter.return_value.order_by.return_value = []
        manager = EngineManager()
        manager.load_engines()
        result = manager.classify(b'fake', 'image/jpeg', [])
        self.assertFalse(result.success)
        self.assertIn('No active engines', result.error)

    @patch('claimlens.engine.manager.EngineConfig')
    @patch('claimlens.engine.manager.EngineConfigService')
    def test_fallback_on_failure(self, mock_service, mock_model):
        mock_config1 = MagicMock()
        mock_config1.adapter = 'mistral'
        mock_config1.name = 'primary'
        mock_config1.is_primary = True
        mock_config1.api_key_encrypted = b'encrypted'
        mock_config1.endpoint_url = 'https://fail.example.com'
        mock_config1.model_name = 'test'
        mock_config1.max_tokens = 4096
        mock_config1.temperature = 0.1
        mock_config1.timeout_seconds = 5

        mock_config2 = MagicMock()
        mock_config2.adapter = 'gemini'
        mock_config2.name = 'fallback'
        mock_config2.is_primary = False
        mock_config2.api_key_encrypted = b'encrypted'
        mock_config2.endpoint_url = 'https://also-fail.example.com'
        mock_config2.model_name = 'test'
        mock_config2.max_tokens = 4096
        mock_config2.temperature = 0.1
        mock_config2.timeout_seconds = 5

        mock_model.objects.filter.return_value.order_by.return_value = [mock_config1, mock_config2]
        mock_service.decrypt_api_key.return_value = 'test-key'

        manager = EngineManager()
        manager.load_engines()
        self.assertEqual(len(manager._engines), 2)
