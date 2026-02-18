from dataclasses import dataclass
from io import BytesIO
from unittest.mock import patch, MagicMock

from django.test import TestCase, override_settings
from django.urls import path, include
from rest_framework.test import APIClient

from core.models import User
from core.test_helpers import create_test_interactive_user
from graphql_jwt.shortcuts import get_token

from claimlens.tests.data import ClaimlensTestDataMixin


@dataclass
class DummyContext:
    user: User


# Test URL conf — includes claimlens URLs so the routes resolve
urlpatterns = [
    path('api/claimlens/', include('claimlens.urls')),
]


@override_settings(ROOT_URLCONF='claimlens.tests.test_views')
class UploadViewTest(TestCase, ClaimlensTestDataMixin):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.user = create_test_interactive_user(username='claimlens_view_test')
        cls.token = get_token(cls.user, DummyContext(user=cls.user))

    def setUp(self):
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    @patch('claimlens.views.ClaimlensStorage')
    @patch('claimlens.views.DocumentService')
    def test_upload_success(self, mock_service_cls, mock_storage_cls):
        mock_storage = MagicMock()
        mock_storage_cls.return_value = mock_storage

        mock_service = MagicMock()
        mock_service.upload.return_value = {
            'success': True,
            'data': {'uuid': 'test-uuid'},
        }
        mock_service_cls.return_value = mock_service

        file_content = b'%PDF-1.4 fake pdf content'
        file = BytesIO(file_content)
        file.name = 'test_claim.pdf'

        response = self.client.post(
            '/api/claimlens/upload/',
            {'file': file},
            format='multipart',
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['success'])

    def test_upload_no_file(self):
        response = self.client.post('/api/claimlens/upload/', {}, format='multipart')
        self.assertEqual(response.status_code, 400)

    @patch('claimlens.views.ClaimlensStorage')
    @patch('claimlens.views.DocumentService')
    def test_upload_storage_failure(self, mock_service_cls, mock_storage_cls):
        mock_storage = MagicMock()
        mock_storage.save.side_effect = Exception("Storage unavailable")
        mock_storage_cls.return_value = mock_storage

        file_content = b'%PDF-1.4 fake pdf content'
        file = BytesIO(file_content)
        file.name = 'test_claim.pdf'

        response = self.client.post(
            '/api/claimlens/upload/',
            {'file': file},
            format='multipart',
        )
        self.assertEqual(response.status_code, 500)


@override_settings(ROOT_URLCONF='claimlens.tests.test_views')
class HealthCheckViewTest(TestCase):

    def test_health_check(self):
        client = APIClient()
        response = client.get('/api/claimlens/health/')
        self.assertEqual(response.status_code, 200)
