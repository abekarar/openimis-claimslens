import io
import uuid

import structlog
from miniopy_async import Minio

from claimlens.config import settings

logger = structlog.get_logger()


class MinIOClient:
    def __init__(self) -> None:
        self.client = Minio(
            endpoint=settings.minio.endpoint,
            access_key=settings.minio.access_key,
            secret_key=settings.minio.secret_key,
            secure=settings.minio.secure,
        )
        self.bucket = settings.minio.bucket

    async def init_bucket(self) -> None:
        exists = await self.client.bucket_exists(self.bucket)
        if not exists:
            await self.client.make_bucket(self.bucket)
            logger.info("minio_bucket_created", bucket=self.bucket)

    async def upload(self, data: bytes, filename: str, content_type: str) -> str:
        object_name = f"{uuid.uuid4()}/{filename}"
        await self.client.put_object(
            self.bucket,
            object_name,
            io.BytesIO(data),
            length=len(data),
            content_type=content_type,
        )
        logger.info("minio_upload", object_name=object_name, size=len(data))
        return object_name

    async def download(self, object_name: str) -> bytes:
        response = await self.client.get_object(self.bucket, object_name)
        data = await response.read()
        response.close()
        await response.release()
        return data

    async def presigned_url(self, object_name: str, expires_hours: int = 1) -> str:
        from datetime import timedelta

        return await self.client.presigned_get_object(
            self.bucket, object_name, expires=timedelta(hours=expires_hours)
        )

    async def health_check(self) -> bool:
        try:
            await self.client.bucket_exists(self.bucket)
            return True
        except Exception:
            return False
