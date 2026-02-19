# ClaimLens

AI-powered document processing module for [openIMIS](https://openimis.org/) — classifies and extracts structured data from health insurance claim documents using LLM vision models.

## Structure

```
backend/     # openIMIS backend module (Django) — openimis-be-claimlens_py
frontend/    # openIMIS frontend module (React) — openimis-fe-claimlens_js
devtools/    # Docker Compose config for openimis-dev-tools integration
test-data/   # Sample invoice PDFs and generation scripts
```

## Backend

Django module providing:
- Document upload, classification, and data extraction via Celery pipeline
- Multi-engine LLM support via OpenAI-compatible API (default: OpenRouter with Pixtral Large)
- Configurable prompt templates for classification and extraction
- Automatic PDF-to-PNG conversion for vision model compatibility
- Intelligent engine routing based on language and document type
- Upstream/downstream validation pipeline with registry update proposals
- MinIO-based document storage
- GraphQL API (14 queries + 14 mutations)

### Install into openIMIS backend

Add to your `openimis.json` modules list, then install:

```bash
pip install -e /path/to/openimis-claimslens/backend
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENROUTER_API_KEY` | API key for OpenRouter (or other OpenAI-compatible provider) |
| `CELERY_BROKER_URL` | Redis URL for Celery (default: `redis://redis-claimlens:6379/0`) |

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

## Dev Environment Setup

### Quick Start

1. Clone and symlink into dev-tools:

```bash
ln -s ~/projects/openimis-claimslens/backend ~/projects/openimis-dev-tools/backend-packages/openimis-be-claimlens_py
ln -s ~/projects/openimis-claimslens/frontend ~/projects/openimis-dev-tools/frontend-packages/openimis-fe-claimlens_js
```

2. Copy Docker config into dev-tools:

```bash
cp devtools/compose.yml devtools/compose-version.yml devtools/.env.example ~/projects/openimis-dev-tools/
cd ~/projects/openimis-dev-tools
cp .env.example .env
```

3. Start the full stack:

```bash
cd ~/projects/openimis-dev-tools
docker compose up --build -d
```

4. Run migrations:

```bash
docker compose exec backend bash -c 'cd /openimis-be/openIMIS && python manage.py migrate claimlens'
```

### Test Data

The `test-data/` directory contains sample medical invoice PDFs for testing the OCR pipeline:

```bash
# Generate new invoices (requires reportlab)
python test-data/generate_invoice.py
python test-data/generate_invoice_2.py
python test-data/generate_invoice_3.py
```

## License

AGPL-3.0 — see [LICENSE](LICENSE).
