import uuid

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from claimlens.models.base import Base, TimestampMixin, UUIDPKMixin


class ExtractionResult(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "extraction_results"

    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id"), index=True
    )

    engine_used: Mapped[str] = mapped_column(String(64))
    engine_version: Mapped[str | None] = mapped_column(String(64), nullable=True)
    prompt_version: Mapped[str | None] = mapped_column(String(64), nullable=True)

    raw_response: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    structured_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    field_confidences: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    aggregate_confidence: Mapped[float | None] = mapped_column(nullable=True)

    classification: Mapped[str | None] = mapped_column(String(128), nullable=True)
    routing_decision: Mapped[str | None] = mapped_column(String(32), nullable=True)
    processing_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    error_detail: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    document: Mapped["Document"] = relationship(back_populates="extraction_results")


from claimlens.models.document import Document  # noqa: E402
