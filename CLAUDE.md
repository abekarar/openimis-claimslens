# openIMIS ClaimLens

AI-powered OCR extraction module for scanned claim documents in the openIMIS ecosystem (AGPL v3).
Monorepo containing both the Django backend module and React/Redux frontend module.

## Project Structure

- `backend/` — Django/openIMIS backend module (`openimis-be-claimlens`)
  - `claimlens/` — Django app (models, GraphQL, services, Celery tasks, engine adapters)
  - `setup.py` — Package config, dependencies
- `frontend/` — React/Redux openIMIS frontend module (`@openimis/fe-claimlens`)
  - `src/` — Actions, reducer, components, pages, pickers, translations
  - `rollup.config.js` — Build config
- `devtools/` — Docker Compose config for openimis-dev-tools integration
  - `compose.yml`, `compose-version.yml`, `.env.example`
- `test-data/` — Sample invoice PDFs and generation scripts
- `docker-compose.yml` — Standalone infrastructure services (MinIO, Redis, Celery worker)

## Dev Environment

- **Primary repo**: Work here for all code changes and commits
- **Symlinked into dev-tools** for full-stack testing:
  - `~/projects/openimis-dev-tools/frontend-packages/openimis-fe-claimlens_js` → `./frontend`
  - `~/projects/openimis-dev-tools/backend-packages/openimis-be-claimlens_py` → `./backend`
- **Running the stack**: Copy `devtools/` files into dev-tools, then `docker compose up --build -d`
- **Branch**: `develop` (standard openIMIS convention)

## Backend Architecture

### Models (backend/claimlens/models.py)
12 models:
- **DocumentType** — code, name, extraction_template (JSON), field_definitions, classification_hints
- **EngineConfig** — adapter (openai_compatible/mistral/deepseek), endpoint_url, api_key_encrypted, model_name, deployment_mode, primary/fallback/active flags
- **Document** — original_filename, mime_type, storage_key, status, FK to DocumentType + EngineConfig, language, claim_uuid
- **ExtractionResult** — OneToOne with Document, structured_data (JSON), field_confidences, aggregate_confidence
- **AuditLog** — action, details (JSON), FK to Document + EngineConfig
- **DocumentMutation** — FK to Document + MutationLog (openIMIS mutation tracking)
- **EngineCapabilityScore** — FK to EngineConfig, language, document_type, accuracy/cost/speed scores
- **RoutingPolicy** — singleton with accuracy/cost/speed weights for engine selection
- **ValidationResult** — FK to Document, validation_type (upstream/downstream), overall_status, field_comparisons
- **ValidationRule** — code, name, rule_type (eligibility/clinical/fraud/registry), rule_definition, severity
- **ValidationFinding** — FK to ValidationResult + ValidationRule, finding_type, severity, resolution_status
- **RegistryUpdateProposal** — FK to Document + ValidationResult, target_model, field_name, current/proposed values, status

### Document Statuses
`pending` → `preprocessing` → `classifying` → `extracting` → `completed` | `failed` | `review_required`

### GraphQL API

**14 Queries**: claimlensDocuments, claimlensDocument, claimlensExtractionResult, claimlensDocumentTypes, claimlensEngineConfigs, claimlensAuditLogs, claimlensCapabilityScores, claimlensRoutingPolicy, claimlensValidationResults, claimlensValidationResult, claimlensValidationRules, claimlensValidationRule, claimlensValidationFindings, claimlensRegistryProposals

**14 Mutations**:
| Mutation | Required Fields |
|----------|----------------|
| processClaimlensDocument | uuid |
| createClaimlensDocumentType | code, name |
| updateClaimlensDocumentType | id, code, name |
| createClaimlensEngineConfig | name, adapter, endpointUrl, modelName |
| updateClaimlensEngineConfig | id, name, adapter, endpointUrl, modelName |
| createClaimlensCapabilityScore | engineConfigId, language, accuracyScore, costPerPage, speedScore |
| updateClaimlensCapabilityScore | id, accuracyScore, costPerPage, speedScore |
| updateClaimlensRoutingPolicy | accuracyWeight, costWeight, speedWeight |
| createClaimlensValidationRule | code, name, ruleType |
| updateClaimlensValidationRule | id, code, name, ruleType |
| runClaimlensValidation | documentUuid, validationType |
| reviewClaimlensRegistryProposal | id, status |
| applyClaimlensRegistryProposal | id |
| resolveClaimlensValidationFinding | id, resolutionStatus |

**Naming convention**: Python `CreateFooMutation` → GraphQL `createClaimlensFoo`

### REST Endpoints (backend/claimlens/urls.py)
- `POST /claimlens/upload/` — File upload with multipart form
- `GET /claimlens/health/` — Health check

### Celery Queues (backend/claimlens/tasks.py)
- `claimlens.preprocessing` — Document preprocessing
- `claimlens.classification` — Document classification
- `claimlens.extraction` — LLM extraction
- `claimlens.validation` — Upstream/downstream validation

### Engine Adapter System (backend/claimlens/engine/)
- `base.py` — Abstract base adapter with PDF-to-PNG conversion, prompt loading, JSON parsing
- `manager.py` — Adapter selection with primary/fallback logic and capability-based routing
- `adapters/openai_compatible.py` — OpenAI-compatible adapter (covers OpenRouter, Mistral, DeepSeek)
- `prompts/classification.md` — Configurable classification prompt template
- `prompts/extraction.md` — Configurable extraction prompt template
- `types.py` — LLMResponse dataclass

**Default engine**: OpenRouter with `mistralai/pixtral-large-2411` (configured via migration 0003)

### Permission Codes (backend/claimlens/apps.py)
159001–159018 covering: query/manage documents, extraction results, upload, process, document types, engine configs, validation results, validation rules, registry proposals, capability scores, routing policy

### Configuration Defaults (backend/claimlens/apps.py)
- Confidence thresholds: auto_approve=0.90, review=0.60
- Storage: MinIO at http://minio:9000, bucket "claimlens"
- Celery broker: redis://redis-claimlens:6379/0
- Default engine adapter: openai_compatible, timeout 120s, max retries 2
- File limits: 20MB, PDF/JPEG/PNG/TIFF/WebP

## Frontend Architecture

### Key Files
- `src/actions.js` — 12 action creators (6 queries, 5 mutations, 1 upload)
- `src/reducer.js` — Redux state for all action types
- `src/index.js` — Module config + re-exports all 12 action creators
- `src/constants.js` — Permission codes, routes, status enums, file config

### Components (src/components/)
ClaimLensMainMenu, DocumentSearcher, DocumentFilter, DocumentForm, DocumentMetadataPanel, UploadPanel, ExtractionResultPanel, ProcessingTimeline, StatusBadge, ConfidenceBar

### Pages (src/pages/)
DocumentsPage, DocumentDetailPage, UploadPage

### Pickers (src/pickers/)
DocumentClassificationPicker, DocumentStatusPicker

### Routes
- `claimlens/documents` — Document list
- `claimlens/documents/document/:uuid` — Document detail
- `claimlens/upload` — Upload page

## Conventions

- **Frontend mutations**: Required fields use `== null` checks with explicit throws; optional strings use truthiness guards; optional booleans/numbers use `!== undefined`
- **Action creators**: All re-exported from index.js for public API access
- **Build**: Rollup + Babel for frontend; setup.py for backend
- **Backend dependencies**: django, djangorestframework, openimis-be-core, django-storages, boto3, httpx, Pillow, celery, cryptography, PyMuPDF
- **Frontend externals**: All @openimis/*, @material-ui/*, react*, redux* are external (provided by assembly)

## Docker Infrastructure

### devtools/ (recommended for full-stack dev)
Pre-configured Docker Compose files for openimis-dev-tools with ClaimLens integration:
- Copy `devtools/` files into your `openimis-dev-tools/` directory
- Includes `OPENROUTER_API_KEY`, celery worker, MinIO, Redis, backend symlinks

### docker-compose.yml (standalone infrastructure)
Lightweight services that layer on top of dev-tools compose.yml:
- **minio**: Object storage (ports 9000/9001)
- **redis-claimlens**: Celery broker (port 6380)
- **celery-claimlens**: Worker processing 4 queues
