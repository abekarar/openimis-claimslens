import uuid

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from claimlens.models.document import Document, DocumentStatus
from claimlens.preprocessing.validation import validate_file
from claimlens.storage.minio_client import MinIOClient

logger = structlog.get_logger()


class DocumentService:
    def __init__(self, session: AsyncSession, storage: MinIOClient):
        self.session = session
        self.storage = storage

    async def create_document(
        self,
        file_data: bytes,
        filename: str,
        content_type: str | None = None,
        source: str | None = None,
        metadata: dict | None = None,
    ) -> Document:
        mime_type = validate_file(file_data, filename, content_type)

        object_name = await self.storage.upload(file_data, filename, mime_type)

        tracking_id = f"CL-{uuid.uuid4().hex[:12].upper()}"

        document = Document(
            tracking_id=tracking_id,
            file_path=object_name,
            original_filename=filename,
            mime_type=mime_type,
            file_size_bytes=len(file_data),
            source=source,
            metadata_=metadata,
            status=DocumentStatus.PENDING,
        )

        self.session.add(document)
        await self.session.commit()
        await self.session.refresh(document)

        logger.info(
            "document_created",
            document_id=str(document.id),
            tracking_id=tracking_id,
            filename=filename,
        )
        return document

    async def get_document(self, document_id: uuid.UUID) -> Document | None:
        result = await self.session.execute(select(Document).where(Document.id == document_id))
        return result.scalar_one_or_none()

    async def get_document_by_tracking_id(self, tracking_id: str) -> Document | None:
        result = await self.session.execute(
            select(Document).where(Document.tracking_id == tracking_id)
        )
        return result.scalar_one_or_none()

    async def update_status(
        self,
        document_id: uuid.UUID,
        status: DocumentStatus,
        error_detail: str | None = None,
    ) -> Document | None:
        document = await self.get_document(document_id)
        if document is None:
            return None
        document.status = status
        if error_detail:
            document.error_detail = error_detail
        await self.session.commit()
        await self.session.refresh(document)
        return document
