import enum
import uuid

from sqlalchemy import Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from claimlens.models.base import Base, TimestampMixin, UUIDPKMixin


class DocumentStatus(enum.StrEnum):
    PENDING = "pending"
    PREPROCESSING = "preprocessing"
    CLASSIFYING = "classifying"
    EXTRACTING = "extracting"
    COMPLETED = "completed"
    FAILED = "failed"
    REVIEW_REQUIRED = "review_required"


class Document(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "documents"

    tracking_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    file_path: Mapped[str] = mapped_column(Text)
    original_filename: Mapped[str] = mapped_column(String(512))
    mime_type: Mapped[str] = mapped_column(String(128))
    file_size_bytes: Mapped[int] = mapped_column(Integer)
    page_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    dpi: Mapped[int | None] = mapped_column(Integer, nullable=True)
    preproc_quality: Mapped[float | None] = mapped_column(nullable=True)

    classification: Mapped[str | None] = mapped_column(String(128), nullable=True)
    class_confidence: Mapped[float | None] = mapped_column(nullable=True)

    document_type_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("document_types.id"), nullable=True
    )

    metadata_: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True)
    source: Mapped[str | None] = mapped_column(String(64), nullable=True)
    status: Mapped[DocumentStatus] = mapped_column(
        Enum(DocumentStatus), default=DocumentStatus.PENDING
    )
    error_detail: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    document_type: Mapped["DocumentType | None"] = relationship(back_populates="documents")
    extraction_results: Mapped[list["ExtractionResult"]] = relationship(
        back_populates="document", cascade="all, delete-orphan"
    )


# Avoid circular import at module level
from claimlens.models.document_type import DocumentType  # noqa: E402
from claimlens.models.extraction import ExtractionResult  # noqa: E402
