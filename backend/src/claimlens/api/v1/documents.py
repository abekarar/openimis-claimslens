from uuid import UUID

import structlog
from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from claimlens.db.session import get_session
from claimlens.dependencies import get_minio_client
from claimlens.preprocessing.validation import ValidationError
from claimlens.schemas.document import DocumentResponse, DocumentStatusResponse
from claimlens.services.document_service import DocumentService

logger = structlog.get_logger()
router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("", response_model=DocumentResponse, status_code=201)
async def upload_document(
    file: UploadFile,
    source: str | None = None,
    session: AsyncSession = Depends(get_session),
) -> DocumentResponse:
    data = await file.read()
    storage = get_minio_client()
    service = DocumentService(session, storage)

    try:
        document = await service.create_document(
            file_data=data,
            filename=file.filename or "unknown",
            content_type=file.content_type,
            source=source,
        )
    except ValidationError as e:
        raise HTTPException(status_code=422, detail={"code": e.code, "message": e.message}) from e

    return DocumentResponse.model_validate(document)


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> DocumentResponse:
    storage = get_minio_client()
    service = DocumentService(session, storage)
    document = await service.get_document(document_id)
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    return DocumentResponse.model_validate(document)


@router.get("/{document_id}/status", response_model=DocumentStatusResponse)
async def get_document_status(
    document_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> DocumentStatusResponse:
    storage = get_minio_client()
    service = DocumentService(session, storage)
    document = await service.get_document(document_id)
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    return DocumentStatusResponse.model_validate(document)
