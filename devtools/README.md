# Dev-Tools Configuration

These files are copies of the `openimis-dev-tools` Docker Compose configuration
with ClaimLens integration (OPENROUTER_API_KEY, celery worker, MinIO, Redis,
backend symlinks).

## Setup

1. Copy these files into your `openimis-dev-tools` directory:

```bash
cp compose.yml compose-version.yml .env.example ~/projects/openimis-dev-tools/
```

2. Copy `.env.example` to `.env` and adjust values if needed:

```bash
cd ~/projects/openimis-dev-tools
cp .env.example .env
```

3. Start the full stack:

```bash
docker compose up --build -d
```
