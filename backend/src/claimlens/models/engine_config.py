import enum

from sqlalchemy import Boolean, Enum, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from claimlens.models.base import Base, TimestampMixin, UUIDPKMixin


class DeploymentMode(enum.StrEnum):
    HOSTED_API = "hosted_api"
    SELF_HOSTED = "self_hosted"


class EngineConfig(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "engine_configs"

    engine_name: Mapped[str] = mapped_column(String(64))
    adapter_type: Mapped[str] = mapped_column(String(64))
    deployment_mode: Mapped[DeploymentMode] = mapped_column(
        Enum(DeploymentMode), default=DeploymentMode.HOSTED_API
    )

    endpoint_url: Mapped[str] = mapped_column(String(512))
    model_id: Mapped[str] = mapped_column(String(128))
    api_key_encrypted: Mapped[str | None] = mapped_column(String(1024), nullable=True)

    parameters: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    timeout_seconds: Mapped[int] = mapped_column(Integer, default=60)

    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    data_sovereignty_ack: Mapped[bool] = mapped_column(Boolean, default=False)
    cost_tracking_enabled: Mapped[bool] = mapped_column(Boolean, default=True)

    health_status: Mapped[str | None] = mapped_column(String(32), nullable=True)
