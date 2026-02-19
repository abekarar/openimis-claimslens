# ClaimLens

AI-powered document processing module for [openIMIS](https://openimis.org/) — classifies and extracts structured data from health insurance claim documents using LLM engines.

## Structure

```
backend/     # openIMIS backend module (Django) — openimis-be-claimlens_py
frontend/    # openIMIS frontend module (React) — openimis-fe-claimlens_js
```

## Backend

Django module providing:
- Document upload, classification, and data extraction via Celery pipeline
- Multi-engine LLM support via OpenAI-compatible API (OpenRouter, Mistral, DeepSeek)
- MinIO-based document storage
- GraphQL API (queries + mutations)

### Install into openIMIS backend

Add to your `openimis.json` modules list, then install:

```bash
pip install -e /path/to/openimis-claimslens/backend
```

## Frontend

React module providing:
- Document upload panel with drag-and-drop
- Document list with filtering and search
- Extraction result viewer with confidence scores
- Processing timeline and status tracking

### Install into openIMIS frontend

Add to your `openimis.json` modules list, then install:

```bash
yarn add file:/path/to/openimis-claimslens/frontend
```

## Infrastructure Services

The `docker-compose.yml` provides supporting services:

- **MinIO** — object storage for uploaded documents (ports 9000/9001)
- **Redis** — Celery broker for async task processing (port 6380)
- **Celery worker** — processes document pipeline queues

```bash
docker compose up -d
```

## License

AGPL-3.0 — see [LICENSE](LICENSE).
