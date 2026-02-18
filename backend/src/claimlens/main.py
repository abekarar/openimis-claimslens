from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from claimlens.api.router import api_router
from claimlens.config import settings
from claimlens.db.session import close_db, init_db
from claimlens.dependencies import get_minio_client

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    logger.info("claimlens_starting", env=settings.env)
    await init_db()
    minio = get_minio_client()
    await minio.init_bucket()
    logger.info("claimlens_ready")
    yield
    await close_db()
    logger.info("claimlens_shutdown")


app = FastAPI(
    title="ClaimLens",
    description="AI-powered OCR microservice for OpenIMIS",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.debug else [],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
