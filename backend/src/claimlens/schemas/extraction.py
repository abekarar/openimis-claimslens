from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ExtractionResultResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    document_id: UUID
    engine_used: str
    structured_data: dict | None = None
    field_confidences: dict | None = None
    aggregate_confidence: float | None = None
    classification: str | None = None
    routing_decision: str | None = None
    processing_ms: int | None = None
    created_at: datetime
