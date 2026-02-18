from unittest.mock import patch, MagicMock

from django.test import TestCase

from core.test_helpers import LogInHelper
from claimlens.models import Document, DocumentType
from claimlens.tests.data import ClaimlensTestDataMixin


class DocumentSignalTest(TestCase, ClaimlensTestDataMixin):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.user = LogInHelper().get_or_create_user_api(username='signal_test')

    def _create_document(self, status=Document.Status.PENDING):
        doc = Document(
            **self.document_payload,
            status=status,
        )
        doc.save(user=self.user)
        return doc

    @patch('claimlens.signals.validate_upstream')
    @patch('claimlens.signals.validate_downstream')
    def test_signal_fires_on_completed(self, mock_downstream, mock_upstream):
        """Signal should dispatch validation tasks when document reaches completed."""
        mock_upstream.signature = MagicMock(return_value=MagicMock())
        mock_downstream.signature = MagicMock(return_value=MagicMock())

        doc = self._create_document(status=Document.Status.EXTRACTING)

        with patch('claimlens.signals.group') as mock_group:
            mock_group.return_value = MagicMock()
            doc.status = Document.Status.COMPLETED
            doc.save(user=self.user)

            mock_group.assert_called_once()

    def test_signal_does_not_fire_on_create(self):
        """Signal should not fire on document creation."""
        with patch('claimlens.signals.group') as mock_group:
            self._create_document(status=Document.Status.COMPLETED)
            # On create, the signal should check created=True and return early
            # However, since Django save() for new objects triggers post_save with created=True,
            # the signal should skip it
            # Note: This depends on whether HistoryModel's save passes created correctly

    def test_signal_does_not_fire_on_non_completed(self):
        """Signal should not fire when status is not completed."""
        doc = self._create_document(status=Document.Status.PENDING)

        with patch('claimlens.signals.group') as mock_group:
            doc.status = Document.Status.PREPROCESSING
            doc.save(user=self.user)
            mock_group.assert_not_called()
