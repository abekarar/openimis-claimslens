# Dev-Tools Configuration

Pre-configured `openimis-dev-tools` Docker Compose files with ClaimLens integration.

Includes:
- `OPENROUTER_API_KEY` passed to backend and celery worker
- Celery worker with ClaimLens queues (preprocessing, classification, extraction)
- MinIO object storage and Redis broker
- Backend and frontend volume mounts for the claimlens module
- Fixed `entrypoint-dev.sh` with correct dependency install order and symlink setup
- Fixed `craco.config.js` with webpack resolve.modules for symlinked packages

## Setup

1. Clone the ClaimLens monorepo and symlink into dev-tools:

```bash
cd ~/projects
git clone git@github.com:abekarar/openimis-claimslens.git
ln -s ~/projects/openimis-claimslens/backend ~/projects/openimis-dev-tools/backend-packages/openimis-be-claimlens_py
ln -s ~/projects/openimis-claimslens/frontend ~/projects/openimis-dev-tools/frontend-packages/openimis-fe-claimlens_js
```

2. Copy these config files into your dev-tools directory:

```bash
cp compose.yml compose-version.yml .env.example ~/projects/openimis-dev-tools/
cp craco.config.js ~/projects/openimis-dev-tools/frontend/
cp entrypoint-dev.sh ~/projects/openimis-dev-tools/frontend/script/
```

3. Create your `.env` from the example:

```bash
cd ~/projects/openimis-dev-tools
cp .env.example .env
```

4. Build and start the full stack:

```bash
docker compose up --build -d
```

5. Run ClaimLens migrations:

```bash
docker compose exec backend bash -c 'cd /openimis-be/openIMIS && python manage.py migrate claimlens'
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| backend | 8000 | openIMIS Django backend (with ClaimLens module) |
| frontend | 3000 | openIMIS React frontend |
| db | 5432 | PostgreSQL database |
| minio | 9000/9001 | Object storage for uploaded documents |
| redis-claimlens | 6380 | Celery broker for async tasks |
| celery-claimlens | - | Worker processing ClaimLens queues |

## Environment Variables

The `.env.example` includes all required variables. Key ClaimLens-specific variable:

| Variable | Description |
|----------|-------------|
| `OPENROUTER_API_KEY` | API key for the OCR vision model (OpenRouter) |
