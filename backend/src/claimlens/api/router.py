from fastapi import APIRouter

from claimlens.api.v1 import documents, health, processing

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(health.router)
api_router.include_router(documents.router)
api_router.include_router(processing.router)
