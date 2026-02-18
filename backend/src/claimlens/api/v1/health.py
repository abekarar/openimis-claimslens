import redis.asyncio as aioredis
import structlog
from fastapi import APIRouter

from claimlens.config import settings
from claimlens.db.session import engine
from claimlens.dependencies import get_minio_client
from claimlens.schemas.health import HealthResponse, ReadyResponse

logger = structlog.get_logger()
router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse()


@router.get("/ready", response_model=ReadyResponse)
async def readiness() -> ReadyResponse:
    db_status = "ok"
    redis_status = "ok"
    minio_status = "ok"

    # Check database
    try:
        async with engine.connect() as conn:
            await conn.execute(__import__("sqlalchemy").text("SELECT 1"))
    except Exception as e:
        db_status = f"error: {e}"
        logger.error("readiness_db_failed", error=str(e))

    # Check Redis
    try:
        r = aioredis.from_url(settings.redis.url)
        await r.ping()
        await r.aclose()
    except Exception as e:
        redis_status = f"error: {e}"
        logger.error("readiness_redis_failed", error=str(e))

    # Check MinIO
    try:
        minio = get_minio_client()
        ok = await minio.health_check()
        if not ok:
            minio_status = "error: bucket check failed"
    except Exception as e:
        minio_status = f"error: {e}"
        logger.error("readiness_minio_failed", error=str(e))

    overall = (
        "ok" if all(s == "ok" for s in [db_status, redis_status, minio_status]) else "degraded"
    )

    return ReadyResponse(
        status=overall,
        database=db_status,
        redis=redis_status,
        minio=minio_status,
    )
