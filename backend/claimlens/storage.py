import logging
from io import BytesIO

from django.core.files.base import ContentFile
from storages.backends.s3boto3 import S3Boto3Storage

from claimlens.apps import ClaimlensConfig

logger = logging.getLogger(__name__)


class ClaimlensStorage:

    def __init__(self):
        self._storage = None

    @property
    def storage(self):
        if self._storage is None:
            self._storage = S3Boto3Storage(
                bucket_name=ClaimlensConfig.storage_bucket_name,
                endpoint_url=ClaimlensConfig.storage_endpoint_url,
                access_key=ClaimlensConfig.storage_access_key,
                secret_key=ClaimlensConfig.storage_secret_key,
                default_acl=None,
                file_overwrite=False,
            )
        return self._storage

    def save(self, key, content, content_type=None):
        if isinstance(content, bytes):
            file_obj = ContentFile(content)
        elif hasattr(content, 'read'):
            file_obj = content
        else:
            file_obj = ContentFile(content)

        self.storage.save(key, file_obj)
        logger.info("Saved object: %s", key)

    def read(self, key):
        f = self.storage.open(key, 'rb')
        data = f.read()
        f.close()
        return data

    def delete(self, key):
        self.storage.delete(key)
        logger.info("Deleted object: %s", key)

    def exists(self, key):
        return self.storage.exists(key)

    def health_check(self):
        try:
            self.storage.connection
            return True
        except Exception:
            return False
