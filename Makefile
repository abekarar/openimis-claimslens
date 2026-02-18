.PHONY: dev down logs test lint migrate format clean build

# Development
dev:
	cp -n .env.example .env 2>/dev/null || true
	docker compose up --build -d

down:
	docker compose down

logs:
	docker compose logs -f

logs-api:
	docker compose logs -f api

logs-worker:
	docker compose logs -f worker

logs-frontend:
	docker compose logs -f frontend

# Database
migrate:
	docker compose exec api alembic upgrade head

migrate-create:
	docker compose exec api alembic revision --autogenerate -m "$(msg)"

migrate-down:
	docker compose exec api alembic downgrade -1

# Testing
test:
	cd backend && python -m pytest tests/ -v

test-cov:
	cd backend && python -m pytest tests/ -v --cov=src/claimlens --cov-report=html

# Linting
lint:
	cd backend && python -m ruff check src/ tests/
	cd frontend && npm run lint

format:
	cd backend && python -m ruff format src/ tests/
	cd frontend && npm run format

type-check:
	cd backend && python -m mypy src/claimlens/
	cd frontend && npm run type-check

# Build
build:
	docker compose build

# Cleanup
clean:
	docker compose down -v
	find backend -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	rm -rf backend/.pytest_cache backend/.mypy_cache
	rm -rf frontend/.next frontend/node_modules

# Status
ps:
	docker compose ps

health:
	@curl -sf http://localhost:8001/api/v1/health | python3 -m json.tool || echo "API not available"
