from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from claimlens.db.session import get_session
from claimlens.services.document_service import DocumentService
from claimlens.services.processing_service import ProcessingService
from claimlens.storage.minio_client import MinIOClient

_minio_client: MinIOClient | None = None


def get_minio_client() -> MinIOClient:
    global _minio_client
    if _minio_client is None:
        _minio_client = MinIOClient()
    return _minio_client


async def get_document_service(
    session: AsyncSession | None = None,
) -> AsyncGenerator[DocumentService, None]:
    storage = get_minio_client()
    if session is not None:
        yield DocumentService(session, storage)
    else:
        async for s in get_session():
            yield DocumentService(s, storage)


async def get_processing_service(
    session: AsyncSession | None = None,
) -> AsyncGenerator[ProcessingService, None]:
    async for doc_service in get_document_service(session):
        yield ProcessingService(doc_service)
