from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class DocumentCreate(BaseModel):
    source: str | None = None
    metadata: dict | None = Field(None, alias="metadata")


class DocumentResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    tracking_id: str
    original_filename: str
    mime_type: str
    file_size_bytes: int
    page_count: int | None = None
    status: str
    classification: str | None = None
    class_confidence: float | None = None
    created_at: datetime
    updated_at: datetime


class DocumentStatusResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    tracking_id: str
    status: str
    classification: str | None = None
    class_confidence: float | None = None
    error_detail: str | None = None
    updated_at: datetime
