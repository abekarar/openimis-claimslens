from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "claimlens"
    version: str = "0.1.0"


class ReadyResponse(BaseModel):
    status: str
    database: str
    redis: str
    minio: str
