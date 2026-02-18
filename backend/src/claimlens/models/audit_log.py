import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from claimlens.models.base import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_type: Mapped[str] = mapped_column(String(64), index=True)
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True)
    action: Mapped[str] = mapped_column(String(64))

    actor_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    actor_role: Mapped[str | None] = mapped_column(String(32), nullable=True)
    details: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)

    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )
