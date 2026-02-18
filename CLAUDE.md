# ClaimLens — AI-Powered OCR Microservice for OpenIMIS

Standalone microservice (not an openIMIS plugin) that extracts structured data from scanned claim documents using LLM vision models. Integrates with OpenIMIS via REST API.

PRD: `docs/product/openimis-claimlens-prd.md`

## Project Structure

```
openimis-claimslens/
├── backend/                       # Python 3.12+ / FastAPI / Celery
│   ├── pyproject.toml             # Dependencies and tool config (hatchling build)
│   ├── Dockerfile                 # Multi-stage: base → builder → api / worker
│   ├── alembic.ini
│   └── src/claimlens/             # Main package
│       ├── main.py                # FastAPI app factory with lifespan
│       ├── config.py              # Pydantic Settings (CLAIMLENS_* env vars)
│       ├── dependencies.py        # FastAPI DI providers
│       ├── api/v1/                # Routers: documents, processing, health
│       ├── models/                # SQLAlchemy 2.0 async models
│       ├── schemas/               # Pydantic v2 request/response schemas
│       ├── services/              # Business logic layer
│       ├── engine/                # LLM abstraction (base ABC → adapters/mistral)
│       ├── worker/                # Celery app + task modules
│       ├── db/                    # Async engine + session factory
│       ├── storage/               # MinIO client wrapper
│       ├── preprocessing/         # File validation, image quality utils
│       ├── prompts/               # LLM prompt templates (.txt)
│       └── migrations/            # Alembic (async, imports all models)
├── frontend/                      # Next.js 15 / React 19 / TypeScript / Tailwind
│   ├── package.json
│   ├── Dockerfile                 # Multi-stage: deps → builder → runner (standalone)
│   └── src/
│       ├── app/                   # App Router pages: upload, documents, documents/[id]
│       ├── components/            # layout/, upload/, documents/, ui/
│       ├── lib/                   # api-client.ts, types.ts, utils.ts
│       └── hooks/                 # use-upload, use-documents
├── docker/                        # postgres/init.sql, redis/redis.conf
├── docker-compose.yml             # 6 services: api, worker, frontend, postgres, redis, minio
├── docker-compose.override.yml    # Dev: hot reload, volume mounts, debug logging
├── .env.example                   # All CLAIMLENS_* env vars with defaults
├── Makefile                       # dev, down, logs, test, lint, migrate, etc.
└── docs/product/                  # PRD lives here
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend API | Python 3.12+ / FastAPI / Pydantic v2 |
| Database | SQLAlchemy 2.0 async + asyncpg + PostgreSQL 16 |
| Task Queue | Celery + Redis 7 |
| Object Storage | MinIO (S3-compatible) |
| LLM Engine | Adapter pattern — Mistral API (MVP default) |
| Frontend | Next.js 15 / React 19 / TypeScript / Tailwind CSS v4 / TanStack Query |
| Containers | Docker Compose, multi-stage Dockerfiles, uv for pip |

## Port Strategy (avoids openIMIS conflicts)

| Service | ClaimLens | openIMIS |
|---------|-----------|----------|
| API | 8001 | 8000 |
| Frontend | 3001 | 3000 |
| PostgreSQL | 5433 | 5432 |
| Redis | 6380 | — |
| MinIO API | 9000 | — |
| MinIO Console | 9001 | — |

## Commands

```bash
make dev            # docker compose up --build -d (copies .env.example → .env if missing)
make down           # docker compose down
make logs           # docker compose logs -f
make logs-api       # api logs only
make migrate        # alembic upgrade head (inside api container)
make migrate-create msg="description"  # autogenerate migration
make test           # pytest backend/tests/
make lint           # ruff check + eslint
make format         # ruff format + prettier
make type-check     # mypy + tsc --noEmit
make health         # curl localhost:8001/api/v1/health
```

## API Endpoints (v1)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Liveness check |
| GET | `/api/v1/ready` | Readiness (db, redis, minio) |
| POST | `/api/v1/documents` | Upload document (multipart) |
| GET | `/api/v1/documents/{id}` | Get document metadata |
| GET | `/api/v1/documents/{id}/status` | Poll processing status |
| POST | `/api/v1/documents/{id}/process` | Start processing pipeline |
| GET | `/api/v1/documents/{id}/result` | Get extraction result |

## Key Models

- **Document** — Tracks uploaded files through status pipeline (pending → preprocessing → classifying → extracting → completed/failed/review_required)
- **ExtractionResult** — LLM output: structured_data, field_confidences, aggregate_confidence
- **DocumentType** — Configurable registry with extraction templates and field definitions
- **EngineConfig** — LLM engine settings: adapter, endpoint, model, deployment_mode (hosted_api/self_hosted)
- **AuditLog** — Immutable audit trail (entity_type, action, details JSONB)

## Conventions

- Default branch: `develop`
- Python: ruff for lint+format, structlog for structured logging, Pydantic v2 for all schemas
- All models use UUID primary keys + created_at/updated_at timestamps (UUIDPKMixin, TimestampMixin)
- API versioned under `/api/v1/`, routers in `api/v1/`
- Environment config: Pydantic Settings with nested settings classes, all prefixed `CLAIMLENS_`
- Celery tasks: queue routing (preprocessing, classification, extraction queues)
- LLM engines: adapter pattern via `BaseLLMEngine` ABC; register in `engine/manager.py`
- Frontend: App Router, TanStack Query for server state, react-dropzone for uploads
- No type annotations on trivial functions; use them on public APIs and complex signatures
- Prompt templates are plain .txt files in `prompts/` — {variable} substitution at runtime

## Architecture Notes

- **Processing pipeline**: Document upload → Celery chain (preprocess → classify → extract) → store ExtractionResult → route by confidence
- **Confidence routing**: auto-approve (≥0.90) / human review (0.60–0.90) / reject (<0.60) — thresholds configurable per document type
- **Engine manager**: primary-fallback strategy; extensible to confidence cascade and A/B testing
- **MVP inference**: Hosted APIs (Mistral, Gemini, DeepSeek) — no GPU needed. On-premise via vLLM/Ollama is post-MVP
