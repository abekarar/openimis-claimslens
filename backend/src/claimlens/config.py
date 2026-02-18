from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class DatabaseSettings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="CLAIMLENS_DB_")

    host: str = "localhost"
    port: int = 5432
    name: str = "claimlens"
    user: str = "claimlens"
    password: str = "claimlens_dev"

    @property
    def url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.user}:{self.password}@{self.host}:{self.port}/{self.name}"
        )

    @property
    def sync_url(self) -> str:
        return f"postgresql://{self.user}:{self.password}@{self.host}:{self.port}/{self.name}"


class RedisSettings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="CLAIMLENS_REDIS_")

    host: str = "localhost"
    port: int = 6379
    url: str = "redis://localhost:6379/0"


class MinIOSettings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="CLAIMLENS_MINIO_")

    endpoint: str = "localhost:9000"
    access_key: str = "claimlens"
    secret_key: str = "claimlens_dev"
    bucket: str = "claimlens-documents"
    secure: bool = False


class EngineSettings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="CLAIMLENS_")

    engine_default: str = "mistral"
    mistral_api_key: str = ""
    mistral_model: str = "pixtral-large-latest"
    mistral_endpoint: str = "https://api.mistral.ai/v1"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="CLAIMLENS_")

    env: str = "development"
    debug: bool = True
    log_level: str = "INFO"
    secret_key: str = "change-me-in-production"

    # Processing defaults
    max_file_size_mb: int = 50
    min_dpi: int = 200
    default_language: str = "en"
    worker_concurrency: int = 4

    # Confidence thresholds
    confidence_auto_approve: float = 0.90
    confidence_review_threshold: float = 0.60
    confidence_classification_min: float = 0.80

    # Celery
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"

    # Sub-settings
    database: DatabaseSettings = Field(default_factory=DatabaseSettings)
    redis: RedisSettings = Field(default_factory=RedisSettings)
    minio: MinIOSettings = Field(default_factory=MinIOSettings)
    engine: EngineSettings = Field(default_factory=EngineSettings)

    @property
    def database_url(self) -> str:
        return self.database.url


settings = Settings()
