# ClaimLens Operations Guide

This guide covers the configuration and operation of the ClaimLens OCR pipeline — from engine selection and confidence scoring to human review thresholds and the AI validation pipeline.

All configuration is done via GraphQL mutations. Examples use the openIMIS GraphQL endpoint (typically `POST /api/graphql`).

---

## 1. OCR Model Selection

ClaimLens supports multiple OCR/LLM engines simultaneously. The routing system decides which engine handles each document based on three layers: **explicit routing rules**, **capability scores**, and **fallback ordering**.

### Adding an Engine

Create an engine configuration pointing to any OpenAI-compatible endpoint:

```graphql
mutation {
  createClaimlensEngineConfig(input: {
    clientMutationId: "add-engine"
    name: "Pixtral Large via OpenRouter"
    adapter: "openai_compatible"
    endpointUrl: "https://openrouter.ai/api"
    apiKey: "sk-or-..."
    modelName: "mistralai/pixtral-large-2411"
    deploymentMode: "cloud"
    isPrimary: true
    isFallback: false
    isActive: true
    maxTokens: 4096
    temperature: 0.1
    timeoutSeconds: 120
  }) {
    clientMutationId
  }
}
```

Setting `isPrimary: true` automatically demotes any existing primary engine. The primary engine is the default fallback when routing produces no match.

### Capability Scores

Each engine can have per-language, per-document-type capability scores that feed into composite routing:

```graphql
mutation {
  createClaimlensCapabilityScore(input: {
    clientMutationId: "score-1"
    engineConfigId: "<engine-uuid>"
    language: "fr"
    documentTypeId: "<doc-type-uuid>"
    accuracyScore: 85
    costPerPage: "0.0020"
    speedScore: 70
    isActive: true
  }) {
    clientMutationId
  }
}
```

**Auto-scoring**: After each successful extraction, ClaimLens automatically updates capability scores using an exponential moving average (EMA, alpha=0.2). You can seed initial scores manually and let the system refine them over time.

### Routing Rules (Explicit Overrides)

Routing rules take precedence over composite scoring. Use them for deterministic routing like "always use Engine X for French medical invoices":

```graphql
mutation {
  createClaimlensEngineRoutingRule(input: {
    clientMutationId: "rule-1"
    name: "French invoices → Pixtral"
    engineConfigId: "<engine-uuid>"
    language: "fr"
    documentTypeId: "<invoice-doc-type-uuid>"
    minConfidence: 0.0
    priority: 90
    isActive: true
  }) {
    clientMutationId
  }
}
```

**Priority levels**:
| Priority | Meaning |
|----------|---------|
| 10 | Low — only if no better match |
| 50 | Medium (default) |
| 90 | High — preferred over scoring |
| 100 | Override — always use this engine |

Rules are evaluated highest-priority-first. A health check is performed before selection — if the engine is down, the next rule (or composite scoring) is tried.

### Routing Policy Weights

The composite scoring formula is:

```
score = (accuracy_weight * accuracy) + (cost_weight * inverted_cost) + (speed_weight * speed)
```

Adjust weights to match your priorities:

```graphql
mutation {
  updateClaimlensRoutingPolicy(input: {
    clientMutationId: "policy-1"
    accuracyWeight: 0.60
    costWeight: 0.20
    speedWeight: 0.20
  }) {
    clientMutationId
  }
}
```

### Querying Current Configuration

```graphql
query {
  claimlensEngineConfigs(isActive: true) {
    edges { node { uuid name adapter modelName isPrimary } }
  }
  claimlensCapabilityScores {
    edges { node { uuid language accuracyScore speedScore costPerPage engineConfig { name } } }
  }
  claimlensEngineRoutingRules {
    edges { node { uuid name language priority isActive engineConfig { name } } }
  }
  claimlensRoutingPolicy { accuracyWeight costWeight speedWeight }
}
```

### Worked Example: Adding a Self-Hosted Engine for Arabic

1. Deploy a local LLM (e.g., Qwen2-VL) with an OpenAI-compatible API
2. Register the engine:
   ```graphql
   mutation { createClaimlensEngineConfig(input: {
     clientMutationId: "qwen-ar"
     name: "Qwen2-VL (self-hosted)"
     adapter: "openai_compatible"
     endpointUrl: "http://llm-server:8000/v1"
     modelName: "qwen2-vl-72b"
     deploymentMode: "self_hosted"
     isPrimary: false
     isActive: true
   }) { clientMutationId } }
   ```
3. Add a capability score for Arabic:
   ```graphql
   mutation { createClaimlensCapabilityScore(input: {
     clientMutationId: "qwen-ar-score"
     engineConfigId: "<qwen-uuid>"
     language: "ar"
     accuracyScore: 75
     costPerPage: "0.0000"
     speedScore: 60
   }) { clientMutationId } }
   ```
4. (Optional) Add a routing rule to force Arabic documents to this engine:
   ```graphql
   mutation { createClaimlensEngineRoutingRule(input: {
     clientMutationId: "rule-ar"
     name: "Arabic → Qwen2-VL"
     engineConfigId: "<qwen-uuid>"
     language: "ar"
     priority: 100
   }) { clientMutationId } }
   ```
5. Process an Arabic document — celery logs will show `Rule 'Arabic → Qwen2-VL' selected engine Qwen2-VL (self-hosted) (priority=100)`

---

## 2. Confidence Scoring

### Where Confidence Originates

Confidence scores come from the LLM extraction prompt. The extraction prompt asks the model to return a `confidence` value (0.0–1.0) for each extracted field. These are:

- **Field confidences** — stored in `ExtractionResult.field_confidences` as `{"field_name": 0.95, ...}`
- **Aggregate confidence** — the overall document confidence, stored in `ExtractionResult.aggregate_confidence`

The aggregate confidence is typically the mean of field confidences, but the LLM may also return its own `aggregate_confidence` value.

### Where Confidence is Stored

| Model | Field | Description |
|-------|-------|-------------|
| `Document` | `classification_confidence` | Confidence of document type classification |
| `ExtractionResult` | `field_confidences` | Per-field confidence map |
| `ExtractionResult` | `aggregate_confidence` | Overall extraction confidence |
| `EngineCapabilityScore` | `accuracy_score` | Historical accuracy (0-100), auto-updated |

### Inspecting via GraphQL

```graphql
query {
  claimlensDocument(uuid: "<doc-uuid>") {
    uuid originalFilename status classificationConfidence language
    extractionResult {
      aggregateConfidence
      fieldConfidences
      processingTimeMs
      tokensUsed
    }
  }
}
```

To see how capability scores have evolved over time:

```graphql
query {
  claimlensCapabilityScores(isActive: true) {
    edges {
      node {
        uuid
        engineConfig { name }
        language
        documentType { code name }
        accuracyScore
        speedScore
        costPerPage
      }
    }
  }
}
```

---

## 3. Human Review Thresholds

### The 3-Tier Decision Logic

After extraction, ClaimLens assigns a final status based on the aggregate confidence:

| Confidence Range | Status | Meaning |
|-----------------|--------|---------|
| `>= auto_approve_threshold` (default 0.90) | `completed` | High confidence — auto-approved |
| `>= review_threshold` (default 0.60) | `review_required` | Medium confidence — needs human review |
| `< review_threshold` | `failed` | Low confidence — extraction unreliable |

### Changing Thresholds

Use the module config mutation to adjust thresholds at runtime:

```graphql
mutation {
  updateClaimlensModuleConfig(input: {
    clientMutationId: "thresholds-1"
    autoApproveThreshold: 0.85
    reviewThreshold: 0.50
  }) {
    clientMutationId
  }
}
```

This updates the `ModuleConfiguration` for the `claimlens` module and immediately reloads the thresholds into the running application. No restart required.

### Default Values

| Setting | Default | Description |
|---------|---------|-------------|
| `auto_approve_threshold` | 0.90 | Minimum confidence for auto-approval |
| `review_threshold` | 0.60 | Minimum confidence before marking as failed |

### Worked Example: Lowering Thresholds for a Pilot

During initial deployment when training data is limited:

1. Lower thresholds to send more documents through review instead of failing them:
   ```graphql
   mutation { updateClaimlensModuleConfig(input: {
     clientMutationId: "pilot-thresholds"
     autoApproveThreshold: 0.95
     reviewThreshold: 0.40
   }) { clientMutationId } }
   ```
2. Monitor the review queue — as extraction quality improves (tracked via auto-scored capability scores), tighten thresholds back to production levels.

---

## 4. AI Validation Pipeline

The validation pipeline runs **after** extraction and compares OCR results against openIMIS data. It operates in two stages that run in parallel:

### Upstream Validation (OCR vs Claim)

Compares extracted document fields against the linked openIMIS Claim. This catches data entry errors and OCR misreads.

**Prerequisite**: The document must be linked to a claim.

### Downstream Validation (Business Rules)

Runs configurable business rules against the extracted data:

| Rule Code | Name | Type | What It Checks |
|-----------|------|------|---------------|
| `ELIG_001` | Active Policy Check | eligibility | Insuree has an active policy covering the claim date |
| `CLIN_001` | Diagnosis-Service Compatibility | clinical | Services are appropriate for the ICD diagnosis |
| `FRAUD_001` | Duplicate Claim Detection | fraud | No existing claim matches the same insuree + date + facility |
| `REG_001` | Registry Update Detection | registry | Detects when OCR data (phone, email, fax) differs from registry |

### Linking Documents to Claims

Before upstream validation can run, link the document to a claim:

```graphql
mutation {
  linkClaimlensDocumentToClaim(input: {
    clientMutationId: "link-1"
    documentUuid: "<document-uuid>"
    claimUuid: "<claim-uuid>"
  }) {
    clientMutationId
  }
}
```

This sets `document.claim_uuid` and creates an audit log entry. The claim UUID is validated against the `claim` module if installed.

### Running Validation

Trigger both upstream and downstream validation in parallel:

```graphql
mutation {
  runClaimlensValidation(input: {
    clientMutationId: "validate-1"
    documentUuid: "<document-uuid>"
  }) {
    clientMutationId
  }
}
```

This dispatches two Celery tasks (`validate_upstream` and `validate_downstream`) to the `claimlens.validation` queue.

### Reviewing Results

```graphql
query {
  claimlensValidationResults(documentUuid: "<document-uuid>") {
    edges {
      node {
        uuid
        validationType
        overallStatus
        matchScore
        discrepancyCount
        summary
        findings {
          uuid findingType severity field description
          resolutionStatus
        }
        registryProposals {
          uuid targetModel fieldName currentValue proposedValue status
        }
      }
    }
  }
}
```

### Configuring Validation Rules

Create or modify rules to customize downstream validation behavior:

```graphql
mutation {
  createClaimlensValidationRule(input: {
    clientMutationId: "rule-1"
    code: "CUSTOM_001"
    name: "Maximum Claim Amount Check"
    ruleType: "fraud"
    severity: "warning"
    ruleDefinition: "{\"max_amount\": 50000}"
    isActive: true
  }) {
    clientMutationId
  }
}
```

### Handling Registry Update Proposals

When the `REG_001` rule detects that OCR data differs from the registry (e.g., a new phone number for an insuree), it creates a `RegistryUpdateProposal`. Review and apply:

```graphql
# Review the proposal
mutation {
  reviewClaimlensRegistryProposal(input: {
    clientMutationId: "review-1"
    id: "<proposal-uuid>"
    status: "approved"
  }) { clientMutationId }
}

# Apply the approved proposal (writes to the target model)
mutation {
  applyClaimlensRegistryProposal(input: {
    clientMutationId: "apply-1"
    id: "<proposal-uuid>"
  }) { clientMutationId }
}
```

### Resolving Validation Findings

Individual findings can be accepted, rejected, or deferred:

```graphql
mutation {
  resolveClaimlensValidationFinding(input: {
    clientMutationId: "resolve-1"
    id: "<finding-uuid>"
    resolutionStatus: "accepted"
  }) { clientMutationId }
}
```

### Worked End-to-End Example

1. **Upload** a scanned medical invoice via the upload API
2. **Process** the document (classification → extraction):
   ```graphql
   mutation { processClaimlensDocument(input: {
     clientMutationId: "process-1"
     uuid: "<document-uuid>"
   }) { clientMutationId } }
   ```
3. Wait for extraction to complete (status becomes `completed` or `review_required`)
4. **Link** the document to a claim:
   ```graphql
   mutation { linkClaimlensDocumentToClaim(input: {
     clientMutationId: "link-1"
     documentUuid: "<document-uuid>"
     claimUuid: "<claim-uuid>"
   }) { clientMutationId } }
   ```
5. **Validate** against claim data and business rules:
   ```graphql
   mutation { runClaimlensValidation(input: {
     clientMutationId: "validate-1"
     documentUuid: "<document-uuid>"
   }) { clientMutationId } }
   ```
6. **Review** validation results:
   ```graphql
   query { claimlensValidationResults(documentUuid: "<document-uuid>") {
     edges { node {
       validationType overallStatus matchScore summary
       findings { field severity description resolutionStatus }
       registryProposals { targetModel fieldName currentValue proposedValue status }
     } }
   } }
   ```
7. **Resolve** any findings and **apply** registry proposals as needed
