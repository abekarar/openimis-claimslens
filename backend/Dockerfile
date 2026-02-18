## ---- Base ----
FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

## ---- Builder ----
FROM base AS builder

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

COPY pyproject.toml ./
COPY src/ ./src/
COPY alembic.ini ./

RUN uv pip install --system --no-cache-dir .

## ---- API ----
FROM builder AS api

EXPOSE 8000
CMD ["uvicorn", "claimlens.main:app", "--host", "0.0.0.0", "--port", "8000"]

## ---- Worker ----
FROM builder AS worker

CMD ["celery", "-A", "claimlens.worker.app:celery_app", "worker", "--loglevel=info", "--concurrency=4"]
