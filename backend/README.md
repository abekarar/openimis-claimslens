# openIMIS Backend ClaimLens Module

AI-powered OCR extraction from scanned claim documents using LLM vision models.

## Features

- Document upload and S3/MinIO storage
- LLM-based document classification and data extraction
- OpenAI-compatible API adapter (supports OpenRouter, Mistral, DeepSeek, and any OpenAI-compatible endpoint)
- Configurable Markdown prompt templates for classification and extraction
- Automatic PDF-to-PNG conversion (via PyMuPDF) for vision model compatibility
- Intelligent engine routing based on language, document type, and capability scores
- Upstream/downstream validation pipeline with registry update proposals
- Confidence-based routing (auto-approve, review required, failed)
- Celery-based async processing pipeline (4 queues: preprocessing, classification, extraction, validation)
- Full audit trail

## Dependencies

`django`, `djangorestframework`, `openimis-be-core`, `django-storages`, `boto3`, `httpx`, `Pillow`, `celery`, `cryptography`, `PyMuPDF`

## Configuration

Module configuration is loaded from `ModuleConfiguration` in the database, with defaults defined in `apps.py`.

Key defaults:
- **Engine adapter**: `openai_compatible`
- **Confidence thresholds**: auto_approve=0.90, review=0.60
- **Storage**: MinIO at `http://minio:9000`, bucket `claimlens`
- **File limits**: 20MB max; PDF, JPEG, PNG, TIFF, WebP

## License

GNU AGPL v3
