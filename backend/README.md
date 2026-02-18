# openIMIS Backend ClaimLens Module

AI-powered OCR extraction from scanned claim documents using LLM vision models.

## Features

- Document upload and S3 storage
- LLM-based document classification and data extraction
- Support for multiple LLM engines (Mistral Pixtral, Gemini, DeepSeek)
- Confidence-based routing (auto-approve, review required, failed)
- Celery-based async processing pipeline
- Full audit trail

## Configuration

Module configuration is loaded from `ModuleConfiguration` in the database, with defaults defined in `apps.py`.

## License

GNU AGPL v3
