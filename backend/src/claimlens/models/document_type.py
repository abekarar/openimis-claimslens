from sqlalchemy import Boolean, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from claimlens.models.base import Base, TimestampMixin, UUIDPKMixin


class DocumentType(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "document_types"

    name: Mapped[str] = mapped_column(String(128))
    code: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    extraction_template: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    field_definitions: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    confidence_config: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    output_routing: Mapped[str | None] = mapped_column(String(32), nullable=True)
    language_config: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    documents: Mapped[list["Document"]] = relationship(back_populates="document_type")


from claimlens.models.document import Document  # noqa: E402
