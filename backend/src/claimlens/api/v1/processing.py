from uuid import UUID

import structlog
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from claimlens.db.session import get_session
from claimlens.dependencies import get_minio_client
from claimlens.models.extraction import ExtractionResult
from claimlens.schemas.extraction import ExtractionResultResponse
from claimlens.services.document_service import DocumentService
from claimlens.services.processing_service import ProcessingService

logger = structlog.get_logger()
router = APIRouter(prefix="/documents", tags=["processing"])


@router.post("/{document_id}/process", status_code=202)
async def start_processing(
    document_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> dict:
    storage = get_minio_client()
    doc_service = DocumentService(session, storage)
    processing_service = ProcessingService(doc_service)

    success = await processing_service.submit_for_processing(document_id)
    if not success:
        raise HTTPException(
            status_code=400,
            detail="Document not found or not in pending state",
        )
    return {"status": "processing", "document_id": str(document_id)}


@router.get("/{document_id}/result", response_model=ExtractionResultResponse)
async def get_extraction_result(
    document_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> ExtractionResultResponse:
    result = await session.execute(
        select(ExtractionResult)
        .where(ExtractionResult.document_id == document_id)
        .order_by(ExtractionResult.created_at.desc())
        .limit(1)
    )
    extraction = result.scalar_one_or_none()
    if extraction is None:
        raise HTTPException(status_code=404, detail="No extraction result found")
    return ExtractionResultResponse.model_validate(extraction)
