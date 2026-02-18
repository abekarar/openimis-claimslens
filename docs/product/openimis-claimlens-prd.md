# Product Requirements Document (PRD)

## OpenIMIS ClaimLens — AI-Powered Intelligent OCR Module

| Field               | Value                                              |
|---------------------|----------------------------------------------------|
| **Document ID**     | PRD-OIMIS-CLAIMLENS-2026-001                       |
| **Version**         | 1.1                                                |
| **Status**          | Draft                                              |
| **Author**          | Abe — Solution Architect, Augentis-AI              |
| **Date**            | February 18, 2026                                  |
| **Classification**  | Internal / Stakeholder Review                      |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals and Success Metrics](#3-goals-and-success-metrics)
4. [Scope and Assumptions](#4-scope-and-assumptions)
5. [User Personas and Workflows](#5-user-personas-and-workflows)
6. [Functional Requirements](#6-functional-requirements)
7. [System Architecture](#7-system-architecture)
8. [AI/OCR Engine Layer](#8-aiocr-engine-layer)
9. [Data Model and Schema Mapping](#9-data-model-and-schema-mapping)
10. [Human-in-the-Loop Review System](#10-human-in-the-loop-review-system)
11. [Non-Functional Requirements](#11-non-functional-requirements)
12. [Security and Compliance](#12-security-and-compliance)
13. [Integration Architecture](#13-integration-architecture)
14. [Configuration and Administration](#14-configuration-and-administration)
15. [Phased Delivery Plan](#15-phased-delivery-plan)
16. [Risk Register](#16-risk-register)
17. [Appendices](#17-appendices)

---

## 1. Executive Summary

**ClaimLens** is a standalone microservice module for OpenIMIS that delivers intelligent AI-powered OCR capabilities for insurance claim documents being scanned into the system. The module leverages configurable Large Language Model (LLM) vision capabilities — including Mistral, DeepSeek, Gemini Pro, and other compatible models — to extract structured data from scanned claim documents with high accuracy across both printed and handwritten content.

The system implements a **dual-mode inference architecture** that supports both **hosted API-based models** (e.g., Mistral API, Google Gemini API, DeepSeek API) and **self-hosted on-premise models** (via vLLM, Ollama, or any OpenAI-compatible inference server). The inference mode is fully configurable per engine, per document type, or globally — allowing deployments to mix hosted and on-premise models as needed.

**For the MVP, the recommended default is to use hosted API-based models.** This strategy prioritizes the fastest path to a validated end-to-end flow by leveraging the highest-accuracy commercially hosted models without the upfront complexity of GPU infrastructure procurement, model deployment, and inference server management. Once the full pipeline is proven and accuracy benchmarks are established, deployments can migrate to self-hosted open-source models for data sovereignty, cost optimization, or regulatory compliance — with the confidence that the system behavior and accuracy expectations are well-understood.

ClaimLens implements a confidence-based human review workflow for low-confidence extractions and supports configurable output routing — either mapping extracted data directly to OpenIMIS claim submission schemas or staging it in an intermediary review system. The system is designed to handle high-throughput environments processing 2,000+ documents per day, with configurable language support per deployment.

ClaimLens replaces the existing basic OCR tooling with a modern, LLM-vision-powered pipeline that supports an extensible set of document types including standardized claim forms, hospital invoices, prescriptions, lab results, ID documents, and referral letters.

---

## 2. Problem Statement

### 2.1 Current State

Insurance claim processing in OpenIMIS-deployed environments currently relies on a basic OCR tool supplemented by manual data entry from paper-based or scanned claim documents. This process is characterized by:

- **Limited OCR accuracy**: The existing basic OCR tool struggles with handwritten content, degraded scans, multilingual documents, and non-standardized layouts, resulting in extraction accuracy that falls well below production-grade thresholds.
- **High manual correction overhead**: Claims officers spend significant time correcting OCR output and manually transcribing fields the existing tool cannot reliably extract — consuming an estimated 5–15 minutes per claim depending on document complexity.
- **Error-prone processing**: The combination of weak OCR and manual transcription introduces data entry errors at an estimated rate of 2–5%, leading to claim adjudication delays, payment inaccuracies, and downstream reconciliation issues.
- **Processing bottlenecks**: At volumes of 2,000+ documents per day, the current pipeline creates backlogs during high-volume periods (e.g., end of coverage cycles, outbreak-related surges), delaying reimbursement to healthcare providers.
- **No document intelligence**: The existing tool performs flat text extraction without understanding document structure, field relationships, or semantic context — requiring all interpretation to be done by human operators.
- **Limited document type support**: The current OCR handles only a narrow set of standardized forms, with no ability to adapt to new document types without significant manual configuration.

### 2.2 Desired State

An intelligent, LLM-vision-powered OCR pipeline that can ingest heterogeneous claim documents, classify them by type, extract structured data with high confidence, route low-confidence results to human reviewers, and deliver validated data into OpenIMIS — all within a self-hosted, configurable deployment that adapts to local languages, document types, and regulatory requirements.

---

## 3. Goals and Success Metrics

### 3.1 Primary Goals

| ID   | Goal                                                                                     |
|------|------------------------------------------------------------------------------------------|
| G-01 | Achieve ≥ 95% field-level extraction accuracy on printed documents and ≥ 85% on handwritten documents within Phase 2. |
| G-02 | Reduce average claim processing time from 5–15 minutes to under 2 minutes per document (including human review for flagged items). |
| G-03 | Support 2,000+ documents per day with horizontal scalability for higher throughput.       |
| G-04 | Eliminate dependency on the existing basic OCR tool entirely by end of Phase 3.           |
| G-05 | Enable configurable deployment across languages, document types, LLM engines, and output schemas. |

### 3.2 Success Metrics

| Metric                              | Target         | Measurement Method                              |
|--------------------------------------|----------------|-------------------------------------------------|
| Field-level extraction accuracy (printed) | ≥ 95%      | Automated comparison against ground-truth dataset |
| Field-level extraction accuracy (handwritten) | ≥ 85%  | Automated comparison against ground-truth dataset |
| Document classification accuracy     | ≥ 98%          | Confusion matrix on labeled test set             |
| Avg. processing time per document    | < 30 seconds   | Pipeline telemetry (ingestion to output)         |
| Human review rate                    | < 15% of total | Percentage of documents routed to review queue   |
| Human review turnaround time         | < 5 minutes    | Time from queue entry to reviewer sign-off       |
| System uptime                        | ≥ 99.5%        | Infrastructure monitoring                        |
| Daily throughput capacity            | ≥ 2,500 docs   | Load testing under sustained volume              |

---

## 4. Scope and Assumptions

### 4.1 In Scope

- AI-powered OCR extraction from scanned documents (images, PDFs) using LLM vision models.
- **Dual-mode inference architecture**: support for both hosted API-based models (Mistral API, Google Gemini API, DeepSeek API) and self-hosted on-premise models (vLLM, Ollama, OpenAI-compatible servers), configurable per engine.
- Configurable multi-engine support: Mistral, DeepSeek, Gemini Pro, and any OpenAI-compatible vision API.
- Document classification, field extraction, and structured data output.
- Support for printed, handwritten, and mixed-format documents.
- Confidence scoring with configurable thresholds for automated approval vs. human review routing.
- Human-in-the-loop review interface for low-confidence extractions.
- Configurable output routing: direct OpenIMIS claim schema mapping or intermediary staging system.
- Configurable language and script support per deployment.
- Document types: standardized claim forms, hospital invoices and receipts, prescriptions, lab results, ID documents, referral letters, and an extensible type registry.
- Deployment via Docker containers (application tier is always on-premise; LLM inference may be hosted or on-premise).
- REST API for integration with OpenIMIS and external systems.
- Administrative dashboard for configuration, monitoring, and analytics.
- Replacement of the existing basic OCR tool.

### 4.2 Out of Scope

- Modification of OpenIMIS core codebase (integration via API only).
- Claim adjudication or payment processing logic.
- Physical scanner hardware procurement or driver management.
- Real-time video or live camera capture (batch/scan input only).
- Training custom LLM models from scratch (the system uses pre-trained models with prompt engineering and fine-tuning adapters).
- Hosting the ClaimLens application tier as a cloud SaaS (the application itself is always deployed on-premise; only the LLM inference layer may optionally use hosted APIs).

### 4.3 Assumptions

| ID   | Assumption                                                                                 |
|------|--------------------------------------------------------------------------------------------|
| A-01 | **MVP deployments will use hosted API-based LLM models** (e.g., Mistral API, Google Gemini API, DeepSeek API) as the default inference mode. This requires outbound HTTPS connectivity from the ClaimLens application server to the respective API endpoints. |
| A-02 | For deployments transitioning to on-premise inference, environments have GPU-capable hardware (NVIDIA CUDA-compatible) and the capacity to host model serving infrastructure (vLLM, Ollama, or equivalent). |
| A-03 | Scanned documents are provided as image files (JPEG, PNG, TIFF) or PDF at a minimum resolution of 200 DPI. |
| A-04 | OpenIMIS exposes stable REST API endpoints for claim submission and status tracking.        |
| A-05 | Deployment teams have Docker and container orchestration capabilities (Docker Compose or Kubernetes). |
| A-06 | Ground-truth labeled datasets will be available or created during Phase 1 for accuracy benchmarking. |
| A-07 | The existing basic OCR tool will remain operational in parallel during the phased rollout until ClaimLens is validated for full replacement. |
| A-08 | API keys and usage quotas for hosted LLM providers will be provisioned prior to MVP deployment. Cost implications of API-based inference at target volume (2,000+ docs/day) have been reviewed and approved by stakeholders. |

### 4.4 MVP Inference Strategy: Hosted-First, On-Premise When Ready

The ClaimLens inference architecture is designed around a deliberate **hosted-first migration path**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     INFERENCE MIGRATION PATH                            │
│                                                                         │
│  ┌─────────────┐      ┌──────────────────┐      ┌─────────────────┐   │
│  │  PHASE 1-3  │      │  PHASE 4         │      │  PHASE 5+       │   │
│  │  MVP        │─────▶│  Transition      │─────▶│  Mature         │   │
│  │             │      │                  │      │                 │   │
│  │  Hosted API │      │  Hybrid          │      │  On-premise     │   │
│  │  models     │      │  (hosted +       │      │  open-source    │   │
│  │  (default)  │      │   on-prem eval)  │      │  models         │   │
│  └─────────────┘      └──────────────────┘      └─────────────────┘   │
│                                                                         │
│  Benefits:             Benefits:                  Benefits:             │
│  • Fastest time to     • A/B accuracy             • Full data           │
│    validated E2E flow    comparison                  sovereignty        │
│  • Best-in-class       • Gradual GPU              • Zero API costs     │
│    model accuracy        infrastructure           • Regulatory         │
│  • Zero GPU infra        build-out                  compliance         │
│    dependency          • Risk-free cutover        • Predictable cost   │
│  • Establishes           with rollback              at scale           │
│    accuracy baseline                                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

**Rationale**: Starting with hosted APIs ensures the development team can focus on building and validating the end-to-end document processing pipeline — ingestion, pre-processing, classification, extraction, review, and OpenIMIS integration — without the parallel complexity of GPU infrastructure procurement, model deployment, quantization tuning, and inference server optimization. The accuracy benchmarks established with hosted models also serve as the acceptance threshold that on-premise models must meet before cutover.

---

## 5. User Personas and Workflows

### 5.1 Personas

#### P-01: Claims Data Entry Officer

- **Role**: Scans and enters claim data into OpenIMIS.
- **Pain points**: Repetitive manual transcription; correcting poor OCR output; handling illegible handwritten documents.
- **Goals**: Faster claim entry with fewer errors; ability to focus on exception handling rather than routine transcription.
- **Interaction with ClaimLens**: Uploads scanned documents, reviews auto-extracted data, corrects flagged fields, and submits to OpenIMIS.

#### P-02: Claims Reviewer / Supervisor

- **Role**: Reviews flagged claims and validates data quality.
- **Pain points**: High volume of review requests; lack of visibility into extraction confidence; no audit trail.
- **Goals**: Clear prioritization of review queue; side-by-side document and data view; confidence indicators per field.
- **Interaction with ClaimLens**: Reviews low-confidence extractions in the review interface; approves, corrects, or rejects submissions.

#### P-03: System Administrator

- **Role**: Deploys, configures, and maintains the ClaimLens module.
- **Pain points**: Complex configuration of OCR tools; lack of monitoring; difficulty onboarding new document types.
- **Goals**: Simple deployment; centralized configuration; real-time monitoring and alerting.
- **Interaction with ClaimLens**: Manages LLM engine configuration, confidence thresholds, document type registry, language settings, and system health via the admin dashboard.

#### P-04: OpenIMIS Integration Engineer

- **Role**: Integrates ClaimLens with OpenIMIS and other enterprise systems.
- **Pain points**: Inconsistent APIs; lack of documentation; tight coupling with OCR internals.
- **Goals**: Clean API contracts; webhook support; schema mapping configurability.
- **Interaction with ClaimLens**: Configures API endpoints, schema mappings, and webhook subscriptions.

### 5.2 Core Workflow

```
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐    ┌──────────────┐
│  Document    │───▶│  Ingestion   │───▶│  AI Processing  │───▶│  Confidence  │
│  Scan/Upload │    │  & Pre-proc  │    │  Pipeline       │    │  Evaluation  │
└─────────────┘    └──────────────┘    └─────────────────┘    └──────┬───────┘
                                                                     │
                                              ┌──────────────────────┼──────────────────────┐
                                              │                      │                      │
                                              ▼                      ▼                      ▼
                                     ┌────────────────┐   ┌──────────────────┐   ┌──────────────────┐
                                     │  HIGH Conf.    │   │  LOW Conf.       │   │  REJECTED        │
                                     │  Auto-approve  │   │  Human Review    │   │  Flag & Notify   │
                                     └───────┬────────┘   └────────┬─────────┘   └──────────────────┘
                                             │                     │
                                             ▼                     ▼
                                     ┌───────────────────────────────────────┐
                                     │  Output Router                       │
                                     │  ┌─────────────────────────────────┐ │
                                     │  │ Option A: Direct OpenIMIS Push  │ │
                                     │  │ Option B: Staging/Review System │ │
                                     │  └─────────────────────────────────┘ │
                                     └───────────────────────────────────────┘
```

### 5.3 Detailed Workflow Steps

1. **Document Ingestion**: Claims officer scans a physical document or uploads a digital file (PDF, JPEG, PNG, TIFF) via the ClaimLens web interface or OpenIMIS integration endpoint.
2. **Pre-processing**: The system performs image enhancement (deskew, noise reduction, contrast normalization, resolution upscaling if below threshold) and page segmentation for multi-page documents.
3. **Document Classification**: The LLM vision engine classifies the document type from the extensible type registry (e.g., claim form, invoice, prescription, lab result, ID document, referral letter).
4. **Field Extraction**: Based on the classified document type, the system applies the appropriate extraction prompt template to the LLM vision engine, extracting structured fields with per-field confidence scores.
5. **Confidence Evaluation**: Each extracted field is evaluated against configurable confidence thresholds. The document receives an aggregate confidence score.
6. **Routing Decision**:
   - **High confidence** (all fields above threshold): Auto-approved and routed to the configured output destination.
   - **Low confidence** (one or more fields below threshold): Routed to the human review queue with flagged fields highlighted.
   - **Rejected** (overall confidence below minimum or document unreadable): Flagged for manual processing with notification to the claims officer.
7. **Human Review** (if applicable): Reviewer sees the original document side-by-side with extracted data. Flagged fields are highlighted. Reviewer corrects, approves, or rejects.
8. **Output Routing**: Validated data is sent to the configured destination — either pushed directly to OpenIMIS via claim submission API, or staged in the intermediary review system for downstream processing.
9. **Audit Logging**: Every step is recorded in the audit trail with timestamps, user actions, confidence scores, engine used, and processing duration.

---

## 6. Functional Requirements

### 6.1 Document Ingestion (FR-100)

| ID     | Requirement                                                                                          | Priority |
|--------|------------------------------------------------------------------------------------------------------|----------|
| FR-101 | The system shall accept document uploads via a web-based UI supporting drag-and-drop and file browser selection. | Must     |
| FR-102 | The system shall accept document submissions via REST API endpoint for programmatic integration.       | Must     |
| FR-103 | The system shall support the following input formats: JPEG, PNG, TIFF, PDF (single and multi-page).   | Must     |
| FR-104 | The system shall support batch upload of multiple documents in a single operation (up to 50 documents). | Must     |
| FR-105 | The system shall validate uploaded files for format, minimum resolution (200 DPI), file size limits (configurable, default 50 MB), and corruption before entering the processing pipeline. | Must     |
| FR-106 | The system shall support watched folder ingestion — automatically processing documents placed in a designated directory on the host filesystem. | Should   |
| FR-107 | The system shall assign a unique document tracking ID to each ingested document for end-to-end traceability. | Must     |
| FR-108 | The system shall support associating metadata with uploaded documents (e.g., claim reference, patient ID, facility code) at the time of submission. | Must     |

### 6.2 Document Pre-processing (FR-200)

| ID     | Requirement                                                                                          | Priority |
|--------|------------------------------------------------------------------------------------------------------|----------|
| FR-201 | The system shall automatically detect and correct document skew (rotation correction).                | Must     |
| FR-202 | The system shall apply noise reduction and contrast normalization to improve extraction quality.       | Must     |
| FR-203 | The system shall detect and upscale images below the minimum resolution threshold using super-resolution techniques. | Should   |
| FR-204 | The system shall segment multi-page documents into individual pages and process each page independently while maintaining document-level association. | Must     |
| FR-205 | The system shall detect and handle duplex (double-sided) scans where both sides are captured in a single image. | Should   |
| FR-206 | The system shall remove blank pages from multi-page documents automatically.                          | Should   |
| FR-207 | The system shall generate a pre-processing quality score indicating the readability of the input document. | Must     |

### 6.3 Document Classification (FR-300)

| ID     | Requirement                                                                                          | Priority |
|--------|------------------------------------------------------------------------------------------------------|----------|
| FR-301 | The system shall classify each document into a type from the configurable document type registry.      | Must     |
| FR-302 | The system shall support the following built-in document types at launch: standardized claim form, hospital invoice/receipt, prescription, lab result, ID document (national ID, insurance card), and referral letter. | Must     |
| FR-303 | The system shall allow administrators to add, modify, and deactivate document types in the registry without code changes. | Must     |
| FR-304 | The system shall assign a classification confidence score to each document.                            | Must     |
| FR-305 | The system shall support multi-label classification where a single document may contain elements of multiple types (e.g., a claim form with an attached prescription). | Should   |
| FR-306 | The system shall route unclassifiable documents (below classification confidence threshold) to the human review queue with a "classification required" flag. | Must     |

### 6.4 Field Extraction (FR-400)

| ID     | Requirement                                                                                          | Priority |
|--------|------------------------------------------------------------------------------------------------------|----------|
| FR-401 | The system shall extract structured fields from documents based on the classified document type and its associated extraction template. | Must     |
| FR-402 | The system shall assign a per-field confidence score (0.0 to 1.0) to each extracted value.            | Must     |
| FR-403 | The system shall extract the following common fields across all claim-related documents: patient name, patient ID/insurance number, date of service, facility/provider name, facility code, diagnosis codes (ICD-10), procedure codes, line-item descriptions, quantities, unit costs, total amounts, and currency. | Must     |
| FR-404 | The system shall extract document-type-specific fields as defined in the extraction template (e.g., prescription: drug name, dosage, frequency, prescribing physician; lab result: test name, result value, reference range, units). | Must     |
| FR-405 | The system shall support extraction from tabular data within documents (e.g., itemized invoices with line items). | Must     |
| FR-406 | The system shall handle multi-currency amounts and detect the currency from context or document metadata. | Should   |
| FR-407 | The system shall extract dates in multiple formats and normalize to ISO 8601 (YYYY-MM-DD).            | Must     |
| FR-408 | The system shall identify and flag potentially fraudulent or anomalous data patterns during extraction (e.g., duplicate claim numbers, amounts exceeding configurable thresholds, date inconsistencies). | Should   |
| FR-409 | The system shall support extraction from documents containing mixed languages within a single page.    | Should   |
| FR-410 | The system shall preserve the spatial location (bounding box coordinates) of each extracted field relative to the source document for visual verification in the review interface. | Must     |

### 6.5 Confidence Scoring and Routing (FR-500)

| ID     | Requirement                                                                                          | Priority |
|--------|------------------------------------------------------------------------------------------------------|----------|
| FR-501 | The system shall calculate an aggregate document-level confidence score based on individual field confidence scores using a configurable weighting scheme. | Must     |
| FR-502 | The system shall support configurable confidence thresholds per document type: auto-approve threshold (default: 0.90), human review threshold (default: 0.60), and rejection threshold (default: below 0.60). | Must     |
| FR-503 | The system shall route documents exceeding the auto-approve threshold directly to the configured output destination. | Must     |
| FR-504 | The system shall route documents between the review and auto-approve thresholds to the human review queue with flagged fields highlighted. | Must     |
| FR-505 | The system shall reject documents below the rejection threshold and notify the originating claims officer with a reason code. | Must     |
| FR-506 | The system shall support per-field threshold overrides (e.g., patient ID and total amount fields may require higher confidence than address fields). | Should   |
| FR-507 | The system shall log all routing decisions with the associated confidence scores for audit and model improvement purposes. | Must     |

### 6.6 Human-in-the-Loop Review (FR-600)

| ID     | Requirement                                                                                          | Priority |
|--------|------------------------------------------------------------------------------------------------------|----------|
| FR-601 | The system shall provide a web-based review interface accessible to authorized reviewers.              | Must     |
| FR-602 | The review interface shall display the original document image side-by-side with the extracted structured data. | Must     |
| FR-603 | The review interface shall highlight low-confidence fields with visual indicators (color-coded by confidence level). | Must     |
| FR-604 | The review interface shall allow reviewers to edit any extracted field value directly.                  | Must     |
| FR-605 | The review interface shall display bounding box overlays on the document image corresponding to each extracted field, enabling click-to-navigate between fields and their source locations. | Must     |
| FR-606 | The review interface shall support keyboard shortcuts for efficient review workflows (tab between fields, approve, reject). | Should   |
| FR-607 | The review interface shall support a review queue with configurable sort and filter options (by document type, confidence score, submission date, assigned reviewer). | Must     |
| FR-608 | The system shall support reviewer assignment — either automatic round-robin distribution or manual assignment by supervisors. | Should   |
| FR-609 | The system shall track review metrics: time-to-review per document, corrections per document, reviewer throughput. | Must     |
| FR-610 | The system shall capture reviewer corrections as training signal data for continuous model improvement. | Should   |
| FR-611 | Reviewers shall be able to approve, reject, or escalate documents. Escalation routes the document to a senior reviewer or supervisor. | Must     |
| FR-612 | The review interface shall support zooming, panning, and rotating the source document image for better readability. | Must     |

### 6.7 Output and Schema Mapping (FR-700)

| ID     | Requirement                                                                                          | Priority |
|--------|------------------------------------------------------------------------------------------------------|----------|
| FR-701 | The system shall support two configurable output modes: (A) direct push to OpenIMIS claim submission API, and (B) staging in an intermediary review/holding system. | Must     |
| FR-702 | Output mode shall be configurable per document type (e.g., standardized claim forms auto-push to OpenIMIS; non-standard documents stage for manual review). | Must     |
| FR-703 | The system shall maintain a configurable field mapping layer that maps extracted fields to OpenIMIS claim schema fields. | Must     |
| FR-704 | The schema mapping layer shall support transformation rules (e.g., date format conversion, code lookups, field concatenation, conditional mappings). | Must     |
| FR-705 | The system shall validate mapped data against OpenIMIS schema constraints (required fields, data types, value ranges, code list validation) before submission. | Must     |
| FR-706 | The system shall support output in JSON format conforming to the OpenIMIS FHIR-based claim resource schema. | Must     |
| FR-707 | The system shall provide a staging table/queue for intermediary output mode, with a UI for downstream review and manual push to OpenIMIS. | Must     |
| FR-708 | The system shall generate extraction result packages containing: structured data (JSON), original document reference, confidence report, and processing metadata. | Must     |
| FR-709 | The system shall support webhook notifications on output events (document processed, review completed, claim submitted, submission failed). | Should   |

### 6.8 Administration and Configuration (FR-800)

| ID     | Requirement                                                                                          | Priority |
|--------|------------------------------------------------------------------------------------------------------|----------|
| FR-801 | The system shall provide a web-based administration dashboard for system configuration and monitoring. | Must     |
| FR-802 | Administrators shall be able to configure and switch between LLM vision engines (Mistral, DeepSeek, Gemini Pro, and any OpenAI-compatible vision API) without system restart. | Must     |
| FR-803 | Administrators shall be able to configure engine-specific parameters: API endpoint (for self-hosted models), model identifier, temperature, max tokens, and timeout. | Must     |
| FR-804 | Administrators shall be able to manage the document type registry: add, edit, activate/deactivate document types and their associated extraction templates. | Must     |
| FR-805 | Administrators shall be able to configure extraction prompt templates per document type using a template editor with variable substitution and preview. | Must     |
| FR-806 | Administrators shall be able to configure confidence thresholds at the global, document type, and field levels. | Must     |
| FR-807 | Administrators shall be able to configure language and locale settings per deployment.                 | Must     |
| FR-808 | Administrators shall be able to configure output routing rules per document type.                      | Must     |
| FR-809 | The admin dashboard shall display real-time system metrics: queue depth, processing rate, average latency, engine utilization, error rate, and review queue status. | Must     |
| FR-810 | The admin dashboard shall provide historical analytics: accuracy trends, throughput trends, top correction fields, engine comparison metrics. | Should   |
| FR-811 | The system shall support role-based access control (RBAC) with at minimum the following roles: administrator, reviewer, claims officer, and read-only auditor. | Must     |

---

## 7. System Architecture

### 7.1 Architecture Overview

ClaimLens follows a microservice architecture deployed as a set of Docker containers orchestrated via Docker Compose (with optional Kubernetes support for large-scale deployments).

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          ClaimLens Deployment                                │
│                                                                              │
│  ┌────────────────┐  ┌──────────────────────────────────────────────────┐   │
│  │  Web UI         │  │  Core API Gateway (REST)                        │   │
│  │  - Review UI    │  │  - Document Ingestion API                       │   │
│  │  - Admin Panel  │  │  - Processing Status API                        │   │
│  │  - Staging UI   │  │  - Review Management API                        │   │
│  │  (React/Next.js)│  │  - Configuration API                            │   │
│  └───────┬────────┘  │  - Output/Webhook API                            │   │
│          │           └──────────────────┬───────────────────────────────┘   │
│          │                              │                                    │
│          │           ┌──────────────────▼───────────────────────────────┐   │
│          │           │  Processing Pipeline (Async Worker Pool)          │   │
│          │           │  ┌──────────┐ ┌──────────┐ ┌─────────────────┐  │   │
│          │           │  │ Pre-proc │▶│ LLM OCR  │▶│ Post-processing │  │   │
│          │           │  │ Worker   │ │ Worker   │ │ & Routing       │  │   │
│          │           │  └──────────┘ └────┬─────┘ └─────────────────┘  │   │
│          │           └─────────────────────┼────────────────────────────┘   │
│          │                                 │                                 │
│          │           ┌─────────────────────▼────────────────────────────┐   │
│          │           │  LLM Engine Abstraction Layer                     │   │
│          │           │  ┌──────────┐ ┌──────────┐ ┌──────────┐         │   │
│          │           │  │ Mistral  │ │ DeepSeek │ │ Gemini   │  ...    │   │
│          │           │  │ Adapter  │ │ Adapter  │ │ Adapter  │         │   │
│          │           │  └──────────┘ └──────────┘ └──────────┘         │   │
│          │           └─────────────────────────────────────────────────┘   │
│          │                                                                   │
│  ┌───────▼────────────────────────────────────────────────────────────────┐ │
│  │  Data Layer                                                             │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │ │
│  │  │ PostgreSQL   │  │ Redis        │  │ MinIO/S3     │                 │ │
│  │  │ (Metadata,   │  │ (Queue,      │  │ (Document    │                 │ │
│  │  │  Config,     │  │  Cache,      │  │  Storage)    │                 │ │
│  │  │  Audit)      │  │  Sessions)   │  │              │                 │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                 │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
         │                                           │
         ▼                                           ▼
┌─────────────────┐                        ┌───────────────────────────────┐
│  OpenIMIS API   │                        │  LLM Inference (Dual-Mode)   │
│  (Claim Submit) │                        │                               │
└─────────────────┘                        │  MVP Default:                 │
                                           │  ┌─────────────────────────┐ │
                                           │  │ Hosted APIs             │ │
                                           │  │ • Mistral API           │ │
                                           │  │ • Google Gemini API     │ │
                                           │  │ • DeepSeek API          │ │
                                           │  └─────────────────────────┘ │
                                           │                               │
                                           │  On-Premise (when ready):     │
                                           │  ┌─────────────────────────┐ │
                                           │  │ Self-hosted Server      │ │
                                           │  │ • vLLM / Ollama / TGI   │ │
                                           │  │ • Open-source models    │ │
                                           │  └─────────────────────────┘ │
                                           └───────────────────────────────┘
```

### 7.2 Component Inventory

| Component                   | Technology              | Purpose                                                    |
|-----------------------------|-------------------------|------------------------------------------------------------|
| **API Gateway**             | FastAPI (Python)        | REST API for all system interactions                       |
| **Web UI**                  | Next.js / React         | Review interface, admin dashboard, staging queue UI        |
| **Processing Pipeline**     | Celery + Redis          | Async document processing with worker pool management      |
| **LLM Engine Layer**        | Custom abstraction      | Pluggable adapter pattern for LLM vision model providers — supports both hosted APIs and self-hosted servers via the same interface |
| **Database**                | PostgreSQL 16           | Metadata, configuration, audit logs, extraction results    |
| **Cache / Message Queue**   | Redis 7                 | Job queue, session cache, rate limiting, real-time updates |
| **Document Storage**        | MinIO (S3-compatible)   | Immutable storage for original and processed documents     |
| **LLM Inference (Hosted)**  | Mistral API, Gemini API, DeepSeek API | **MVP default** — hosted API-based inference via provider endpoints |
| **LLM Inference (On-Prem)** | vLLM / Ollama / TGI     | **Post-MVP option** — self-hosted model serving for on-premise inference |
| **Monitoring**              | Prometheus + Grafana    | System metrics, alerting, and dashboards                   |
| **Log Aggregation**         | Loki + Promtail         | Centralized logging and log search                         |

### 7.3 Deployment Topology

```yaml
# Simplified Docker Compose Service Map
services:
  claimlens-api:        # FastAPI application server
  claimlens-ui:         # Next.js frontend
  claimlens-worker:     # Celery workers (scalable: 1-N replicas)
  claimlens-scheduler:  # Celery Beat scheduler
  postgres:             # PostgreSQL database
  redis:                # Redis cache and message broker
  minio:                # MinIO object storage
  prometheus:           # Metrics collection
  grafana:              # Monitoring dashboards

  # LLM Inference — ONE of the following (configured per deployment):
  #
  # Option A (MVP Default): Hosted API — no local LLM container needed.
  #   Workers call hosted APIs (Mistral, Gemini, DeepSeek) directly via HTTPS.
  #   Requires: outbound HTTPS access + API keys configured in engine settings.
  #
  # Option B (Post-MVP): Self-hosted on-premise inference server.
  #   llm-server:       # vLLM / Ollama instance serving vision models
  #   Requires: GPU hardware (NVIDIA CUDA-compatible).
```

Worker replicas are horizontally scalable. For 2,000+ documents/day throughput, an initial deployment of 4–8 worker replicas is recommended, adjustable based on observed processing latency and queue depth.

---

## 8. AI/OCR Engine Layer

### 8.1 Architecture: Pluggable Engine Abstraction

The LLM Engine Layer implements the **Adapter Pattern**, providing a unified interface for interacting with different LLM vision models regardless of whether they are accessed via hosted APIs or self-hosted inference servers. Each adapter speaks to a configurable endpoint — a hosted provider URL for the MVP, or a local inference server URL for on-premise deployments. This enables engine switching, A/B testing, hosted-to-on-premise migration, and fallback strategies without modifying the core processing pipeline.

```
┌─────────────────────────────────────────────────┐
│            Engine Manager                        │
│  - Engine selection (primary, fallback)          │
│  - Load balancing across engine instances        │
│  - Circuit breaker for failed engines            │
│  - A/B testing and engine comparison             │
│  - Deployment mode awareness (hosted vs on-prem) │
└────────────────────┬────────────────────────────┘
                     │
        ┌────────────┼────────────┬───────────────┐
        ▼            ▼            ▼               ▼
  ┌───────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐
  │ Mistral   │ │ DeepSeek │ │ Gemini   │ │ OpenAI-    │
  │ Adapter   │ │ Adapter  │ │ Adapter  │ │ Compatible │
  │           │ │          │ │          │ │ Adapter    │
  └─────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬──────┘
        │            │            │              │
        ▼            ▼            ▼              ▼
  ┌──────────────────────────────────────────────────────┐
  │  Configurable Endpoint (per engine instance)          │
  │                                                       │
  │  HOSTED API (MVP Default)     ON-PREMISE (Post-MVP)  │
  │  ┌─────────────────────┐    ┌──────────────────────┐ │
  │  │ api.mistral.ai      │    │ local-gpu:8000/v1    │ │
  │  │ generativelanguage  │    │ ollama:11434         │ │
  │  │   .googleapis.com   │    │ vllm-server:8000     │ │
  │  │ api.deepseek.com    │    │ tgi-server:8080      │ │
  │  └─────────────────────┘    └──────────────────────┘ │
  └──────────────────────────────────────────────────────┘
```

### 8.2 Engine Interface Contract

Each engine adapter must implement the following interface:

```python
class BaseLLMEngine(ABC):
    """Abstract base class for LLM vision engine adapters."""

    @abstractmethod
    async def classify_document(
        self,
        image: bytes,
        document_types: list[DocumentType],
        language_hint: str | None = None,
    ) -> ClassificationResult:
        """Classify a document image into a registered document type."""

    @abstractmethod
    async def extract_fields(
        self,
        image: bytes,
        document_type: DocumentType,
        extraction_template: ExtractionTemplate,
        language_hint: str | None = None,
    ) -> ExtractionResult:
        """Extract structured fields from a document image."""

    @abstractmethod
    async def health_check(self) -> EngineHealthStatus:
        """Check engine availability and responsiveness."""

    @abstractmethod
    def get_capabilities(self) -> EngineCapabilities:
        """Return engine capability metadata (supported languages, max image size, etc.)."""
```

### 8.3 Supported Engines (Launch)

Each engine adapter supports both hosted API and self-hosted inference modes. The `deployment_mode` configuration determines which endpoint type is used.

| Engine        | Hosted API (MVP Default)       | Self-hosted (Post-MVP)         | Vision Model Examples               | Notes                                      |
|---------------|--------------------------------|--------------------------------|--------------------------------------|--------------------------------------------|
| **Mistral**   | `api.mistral.ai`              | vLLM, Ollama                   | Mistral Large, Pixtral              | Strong multilingual support; recommended as primary engine for European and African language deployments. |
| **DeepSeek**  | `api.deepseek.com`            | vLLM, Ollama                   | DeepSeek-VL2, DeepSeek-V3          | Competitive extraction accuracy; strong on tabular and structured data. |
| **Gemini Pro**| Google Gemini API (`generativelanguage.googleapis.com`) | Vertex AI proxy or compatible local server | Gemini 2.0 Pro Vision | Excellent handwriting recognition; Google API provides the simplest hosted path. |
| **OpenAI-Compatible** | Any hosted API exposing `/v1/chat/completions` (e.g., OpenAI, Together AI, Fireworks AI) | Any self-hosted server exposing `/v1/chat/completions` (vLLM, Ollama, TGI) | LLaVA, InternVL, Qwen-VL | Catch-all adapter for any model served via OpenAI-compatible API — works identically for hosted and self-hosted endpoints. |

> **MVP Recommendation**: Configure Mistral API or Gemini API as the primary engine and DeepSeek API as the fallback. This provides best-in-class accuracy with zero GPU infrastructure requirements, allowing the team to focus entirely on pipeline validation and OpenIMIS integration.

### 8.4 Engine Selection Strategy

The Engine Manager supports the following selection strategies, configurable per document type or globally:

- **Primary-Fallback**: Uses a designated primary engine; falls back to secondary if the primary fails or times out.
- **Confidence-Based Cascade**: Sends to the primary engine first; if the result confidence is below a configurable cascade threshold, re-sends to a secondary engine and uses the higher-confidence result.
- **Round-Robin**: Distributes requests evenly across configured engines (useful for load balancing identical engine instances).
- **A/B Split**: Routes a configurable percentage of documents to each engine for comparative accuracy analysis.

### 8.5 Prompt Engineering Framework

Extraction accuracy is heavily dependent on prompt quality. ClaimLens implements a structured prompt engineering framework:

- **System prompt**: Sets the extraction context, output format requirements (strict JSON), and confidence scoring instructions.
- **Document type prompt**: Specific instructions per document type, including expected fields, data types, and validation rules.
- **Language prompt**: Locale-specific instructions for script recognition and language-specific formatting conventions.
- **Few-shot examples**: Configurable per document type — administrators can upload annotated example documents that are included as few-shot examples in the extraction prompt.

Prompts are stored as versioned templates in the database and are editable via the admin dashboard without code deployment.

---

## 9. Data Model and Schema Mapping

### 9.1 Core Data Model

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ Document          │     │ ExtractionResult  │     │ ReviewTask       │
├──────────────────┤     ├──────────────────┤     ├──────────────────┤
│ id (UUID)         │────▶│ id (UUID)         │────▶│ id (UUID)         │
│ tracking_id       │     │ document_id (FK)  │     │ extraction_id(FK)│
│ file_path (MinIO) │     │ engine_used       │     │ assigned_to      │
│ original_filename │     │ engine_version    │     │ status           │
│ mime_type         │     │ prompt_version    │     │ corrections[]    │
│ file_size_bytes   │     │ raw_response      │     │ started_at       │
│ page_count        │     │ structured_data   │     │ completed_at     │
│ dpi               │     │ field_confidences │     │ reviewer_notes   │
│ preproc_quality   │     │ aggregate_conf    │     └──────────────────┘
│ classification    │     │ classification    │
│ class_confidence  │     │ routing_decision  │     ┌──────────────────┐
│ metadata (JSONB)  │     │ processing_ms     │     │ OutputRecord     │
│ source            │     │ created_at        │     ├──────────────────┤
│ status            │     └──────────────────┘     │ id (UUID)         │
│ created_at        │                               │ extraction_id(FK)│
│ created_by        │     ┌──────────────────┐     │ output_mode      │
└──────────────────┘     │ DocumentType      │     │ target_schema    │
                          ├──────────────────┤     │ mapped_payload   │
                          │ id (UUID)         │     │ validation_result│
                          │ name              │     │ submission_status│
                          │ code              │     │ openimis_ref     │
                          │ extraction_template│    │ error_detail     │
                          │ field_definitions │     │ submitted_at     │
                          │ confidence_config │     └──────────────────┘
                          │ output_routing    │
                          │ is_active         │     ┌──────────────────┐
                          │ language_config   │     │ AuditLog         │
                          └──────────────────┘     ├──────────────────┤
                                                    │ id (UUID)         │
                          ┌──────────────────┐     │ entity_type      │
                          │ EngineConfig      │     │ entity_id        │
                          ├──────────────────┤     │ action           │
                          │ id (UUID)         │     │ actor_id         │
                          │ engine_name       │     │ actor_role       │
                          │ adapter_type      │     │ details (JSONB)  │
                          │ deployment_mode   │     │ ip_address       │
                          │ endpoint_url      │     │ timestamp        │
                          │ model_id          │     └──────────────────┘
                          │ parameters (JSONB)│
                          │ is_primary        │
                          │ is_active         │
                          │ data_sov_ack      │
                          │ cost_tracking     │
                          │ health_status     │
                          └──────────────────┘
```

### 9.2 Schema Mapping Layer

The schema mapping layer translates extracted field data into the target output format. It supports:

- **Direct field mapping**: `extracted.patient_name` → `openimis.claim.insuree.other_names`
- **Computed/transformed mapping**: `extracted.total_amount` → apply currency conversion → `openimis.claim.claimed`
- **Conditional mapping**: If `extracted.document_type == "prescription"` then map to `openimis.claim.items[]` using drug code lookup.
- **Code list resolution**: Map extracted diagnosis text to ICD-10 codes via configurable lookup tables or LLM-assisted code matching.
- **Array/table mapping**: Map line-item tables from invoices to `openimis.claim.items[]` and `openimis.claim.services[]`.

Mapping configurations are stored as versioned JSON schemas and editable via the admin dashboard.

### 9.3 OpenIMIS FHIR Claim Schema Alignment

ClaimLens output conforms to the OpenIMIS FHIR-based Claim resource structure. Key mapping targets:

| ClaimLens Field         | OpenIMIS FHIR Path                           | Notes                              |
|-------------------------|----------------------------------------------|------------------------------------|
| patient_name            | Claim.patient → Patient.name                 | First/last name parsing            |
| insurance_number        | Claim.patient → Patient.identifier           | CHFID mapping                      |
| facility_code           | Claim.facility → Location.identifier         | HF code lookup                     |
| date_of_service         | Claim.billablePeriod.start                   | ISO 8601 normalization             |
| diagnosis_codes[]       | Claim.diagnosis[].diagnosisCodeableConcept   | ICD-10 code resolution             |
| items[]                 | Claim.item[]                                 | Line item mapping                  |
| total_amount            | Claim.total                                  | Currency-aware                     |
| claim_type              | Claim.type                                   | Emergency / Referral / Other       |

---

## 10. Human-in-the-Loop Review System

### 10.1 Review Queue Architecture

The review system operates as a managed work queue with the following characteristics:

- **Priority scoring**: Documents are prioritized in the review queue based on a composite score of: age in queue (older = higher priority), aggregate confidence score (lower = higher priority), document type priority weight (configurable), and whether the document was escalated.
- **Assignment strategy**: Configurable between automatic round-robin assignment and manual claim-from-queue. Round-robin considers reviewer availability, workload balance, and optional document type specialization.
- **SLA tracking**: Configurable SLA targets per document type with visual indicators in the queue (e.g., approaching SLA = yellow, breached SLA = red).
- **Concurrency control**: Documents are locked to the assigned reviewer to prevent duplicate work. Locks auto-release after a configurable timeout (default: 30 minutes).

### 10.2 Review Interface Specifications

The review interface is the primary workspace for claims reviewers and must be optimized for speed and accuracy:

**Layout**: Split-pane design with the original document on the left (zoomable, pannable, rotatable) and the structured extraction form on the right.

**Field interactions**:
- Each field displays: extracted value, confidence score (as a visual bar and numeric value), and source highlight (bounding box on the document).
- Clicking a field in the form highlights the corresponding region on the document image.
- Clicking a region on the document image navigates to the corresponding field in the form.
- Fields below the confidence threshold are highlighted in amber; fields below the rejection threshold are highlighted in red.
- Tab key navigates between flagged fields only (skip high-confidence fields); Shift+Tab reverses direction.

**Actions**:
- **Approve**: Accept all fields as-is (or as corrected). Keyboard shortcut: `Ctrl+Enter`.
- **Reject**: Mark the document as unprocessable with a mandatory reason code. Keyboard shortcut: `Ctrl+Shift+R`.
- **Escalate**: Route to a senior reviewer with optional notes. Keyboard shortcut: `Ctrl+E`.
- **Save Draft**: Save partial corrections without completing the review. Keyboard shortcut: `Ctrl+S`.

**Performance target**: A reviewer should be able to process a typical low-confidence document (3–5 flagged fields) in under 3 minutes using the keyboard-driven workflow.

### 10.3 Correction Feedback Loop

Reviewer corrections are captured as structured training signals:

```json
{
  "document_id": "uuid",
  "extraction_id": "uuid",
  "corrections": [
    {
      "field_name": "patient_name",
      "original_value": "John Smth",
      "corrected_value": "John Smith",
      "confidence_was": 0.72,
      "correction_type": "spelling"
    }
  ],
  "reviewer_id": "uuid",
  "review_duration_ms": 47000
}
```

This data is stored in a dedicated corrections table and can be exported for model fine-tuning, prompt improvement analysis, and accuracy trend reporting.

---

## 11. Non-Functional Requirements

### 11.1 Performance

| Requirement | Target | Notes |
|-------------|--------|-------|
| Document pre-processing latency | < 5 seconds per page | Includes deskew, noise reduction, quality scoring |
| LLM extraction latency | < 20 seconds per page | Dependent on model and hardware; measured at P95 |
| End-to-end processing (ingestion to output) | < 30 seconds per document | Single-page document, excluding human review time |
| Concurrent document processing | ≥ 50 documents in parallel | Based on 8 worker replicas |
| Daily throughput | ≥ 2,500 documents | Sustained over 8-hour operational window |
| API response time (non-processing endpoints) | < 200ms at P95 | Status checks, configuration reads, queue queries |
| Review interface load time | < 2 seconds | Including document image rendering |

### 11.2 Scalability

- Horizontal scaling of processing workers via container replication.
- Database connection pooling with PgBouncer for high-concurrency access.
- MinIO storage scales independently via disk/volume expansion.
- Redis cluster mode for high-availability message queuing at scale.
- Stateless API and worker services enable zero-downtime scaling.

### 11.3 Availability and Reliability

- Target uptime: 99.5% during operational hours.
- Graceful degradation: If the LLM engine is unavailable, documents queue for processing and the system notifies administrators. The review interface and admin dashboard remain available.
- Worker crash recovery: Celery workers automatically retry failed tasks (configurable retry count, default: 3 with exponential backoff).
- Database backups: Automated daily backups with configurable retention (default: 30 days).
- Document storage durability: MinIO erasure coding for data integrity.

### 11.4 Observability

- **Metrics**: Prometheus metrics exported from all services (processing latency histograms, queue depth gauges, error rate counters, engine utilization).
- **Logging**: Structured JSON logging to stdout; aggregated via Loki/Promtail; log levels configurable per service.
- **Tracing**: OpenTelemetry-compatible distributed tracing across the processing pipeline.
- **Alerting**: Grafana alerting rules for: queue depth exceeding threshold, error rate spike, engine health failure, SLA breach rate, and disk utilization.

---

## 12. Security and Compliance

### 12.1 Data Protection

| Control | Implementation |
|---------|----------------|
| **Encryption at rest** | AES-256 encryption for MinIO storage; PostgreSQL TDE or volume-level encryption. |
| **Encryption in transit** | TLS 1.3 for all API communication, inter-service communication, and LLM engine connections. |
| **Data minimization** | Configurable retention policies per document type. Original documents and extraction results are purged after the retention period. |
| **Access control** | Role-based access control (RBAC) with four default roles. Fine-grained permissions per API endpoint and UI feature. |
| **Authentication** | Integration with OpenIMIS authentication or standalone JWT-based auth with support for LDAP/Active Directory and OIDC providers. |
| **Audit trail** | Immutable audit log for all data access, modifications, configuration changes, and processing events. |
| **PII handling** | Extracted PII fields (patient name, ID, address) are flagged in the data model and subject to enhanced access controls and logging. |

### 12.2 Compliance Considerations

ClaimLens is designed to be deployable in environments subject to various regulatory frameworks. The dual-mode inference architecture provides flexibility to meet varying compliance requirements:

- **MVP (hosted API mode)**: The ClaimLens application tier (API, UI, database, document storage) is deployed on-premise. However, document images are transmitted to hosted LLM API providers for extraction processing. This mode is appropriate for MVP validation and deployments where the hosted provider's data processing agreements are acceptable. Administrators must explicitly acknowledge data transmission implications per engine via the `data_sovereignty_ack` configuration flag.
- **Post-MVP (self-hosted mode)**: Full data sovereignty — all processing, including LLM inference, occurs on-premise. No document data leaves the deployment environment. This mode satisfies the strictest data residency requirements.
- **Hybrid mode**: Some document types or engines can use hosted APIs while others use self-hosted models — allowing deployments to balance accuracy, cost, and compliance per use case.

The following compliance-relevant features are built-in regardless of inference mode:

- **GDPR readiness**: Data subject access and deletion capabilities via the admin API. Configurable retention periods. Consent tracking integration points.
- **HIPAA considerations**: Encryption at rest and in transit. Access controls and audit logging. BAA-compatible deployment when paired with appropriate infrastructure controls.
- **Country-specific health data regulations**: The configurable nature of retention policies, access controls, inference mode, and data handling rules allows adaptation to local regulatory requirements.

### 12.3 LLM-Specific Security Controls

| Risk | Mitigation |
|------|------------|
| **Prompt injection** | Input sanitization before prompt construction; extraction prompts use structured templates that isolate document content from instructions. Output validation against expected schema prevents instruction leakage. |
| **Data leakage to model providers** | The `deployment_mode` field explicitly tracks whether data is being sent externally. Hosted API usage requires administrator acknowledgment (`data_sovereignty_ack`). All external API calls are logged with document ID and engine identifier for audit. Deployments requiring full data sovereignty should use `self_hosted` mode. For MVP deployments using hosted APIs, administrators should review each provider's data processing agreement and ensure compliance with local regulations. |
| **Model output hallucination** | Confidence scoring identifies uncertain extractions. Schema validation rejects structurally invalid outputs. Human review catches semantic errors on low-confidence documents. |
| **Adversarial documents** | File type validation, malware scanning on upload, and size limits. Image bomb detection (decompression bomb prevention). Rate limiting on submission endpoints. |
| **API key compromise (hosted mode)** | API keys encrypted at rest (AES-256). Key rotation support via admin dashboard. Per-engine budget caps and rate limits prevent runaway usage. Alert on anomalous API usage patterns. |

---

## 13. Integration Architecture

### 13.1 OpenIMIS Integration

ClaimLens integrates with OpenIMIS exclusively via its published REST API, ensuring zero modifications to OpenIMIS core.

**Inbound integrations (OpenIMIS → ClaimLens)**:
- OpenIMIS can submit documents for processing via the ClaimLens ingestion API.
- OpenIMIS can query processing status and retrieve extraction results.
- OpenIMIS can embed the ClaimLens review interface via iframe or deep-link integration.

**Outbound integrations (ClaimLens → OpenIMIS)**:
- ClaimLens pushes validated claim data to the OpenIMIS claim submission API.
- ClaimLens queries OpenIMIS reference data (facility codes, insuree lookups, diagnosis code lists) for field validation and code resolution.
- ClaimLens receives webhooks from OpenIMIS for claim status updates (submitted, accepted, rejected) to close the feedback loop.

### 13.2 API Specification Summary

| Endpoint                                | Method | Purpose                                          |
|-----------------------------------------|--------|--------------------------------------------------|
| `POST /api/v1/documents`                | POST   | Submit a document for processing                 |
| `POST /api/v1/documents/batch`          | POST   | Submit a batch of documents                      |
| `GET /api/v1/documents/{id}`            | GET    | Retrieve document status and metadata            |
| `GET /api/v1/documents/{id}/result`     | GET    | Retrieve extraction result                       |
| `GET /api/v1/documents/{id}/image`      | GET    | Retrieve original document image                 |
| `GET /api/v1/review/queue`              | GET    | List review queue items with filters             |
| `POST /api/v1/review/{id}/approve`      | POST   | Approve a reviewed document                      |
| `POST /api/v1/review/{id}/reject`       | POST   | Reject a reviewed document                       |
| `POST /api/v1/review/{id}/escalate`     | POST   | Escalate a document to senior reviewer           |
| `PUT /api/v1/review/{id}/corrections`   | PUT    | Submit field corrections                         |
| `GET /api/v1/staging`                   | GET    | List staged output records                       |
| `POST /api/v1/staging/{id}/submit`      | POST   | Push staged record to OpenIMIS                   |
| `GET /api/v1/admin/engines`             | GET    | List configured LLM engines                      |
| `PUT /api/v1/admin/engines/{id}`        | PUT    | Update engine configuration                      |
| `GET /api/v1/admin/document-types`      | GET    | List document type registry                      |
| `POST /api/v1/admin/document-types`     | POST   | Create a new document type                       |
| `GET /api/v1/admin/metrics`             | GET    | Retrieve system metrics summary                  |
| `POST /api/v1/webhooks/subscribe`       | POST   | Subscribe to event notifications                 |

Full OpenAPI 3.1 specification will be maintained in the project repository.

### 13.3 Webhook Events

| Event                        | Payload Summary                                      |
|------------------------------|------------------------------------------------------|
| `document.processed`         | Document ID, classification, aggregate confidence     |
| `document.auto_approved`     | Document ID, extraction result summary, output mode   |
| `document.review_required`   | Document ID, flagged fields, queue position           |
| `document.rejected`          | Document ID, rejection reason code                    |
| `review.completed`           | Document ID, reviewer ID, corrections count           |
| `output.submitted`           | Document ID, OpenIMIS claim reference, status         |
| `output.submission_failed`   | Document ID, error detail                             |
| `engine.health_changed`      | Engine name, old status, new status                   |

---

## 14. Configuration and Administration

### 14.1 Configuration Hierarchy

ClaimLens uses a layered configuration system:

1. **Environment variables** (highest priority): Deployment-specific overrides (database URLs, secret keys, feature flags).
2. **Database configuration**: Runtime-editable settings managed via the admin dashboard (engine configs, document types, confidence thresholds, routing rules).
3. **Default configuration files**: Shipped with the application; provides sensible defaults for all configurable parameters.

### 14.2 Key Configuration Parameters

#### Global Settings

| Parameter                          | Default       | Description                                              |
|------------------------------------|---------------|----------------------------------------------------------|
| `CLAIMLENS_MAX_FILE_SIZE_MB`       | 50            | Maximum upload file size in megabytes                    |
| `CLAIMLENS_MIN_DPI`               | 200           | Minimum accepted document resolution                     |
| `CLAIMLENS_DEFAULT_LANGUAGE`       | en            | Default extraction language                              |
| `CLAIMLENS_SUPPORTED_LANGUAGES`    | en            | Comma-separated list of enabled languages                |
| `CLAIMLENS_RETENTION_DAYS`         | 365           | Document and result retention period                     |
| `CLAIMLENS_BATCH_MAX_SIZE`         | 50            | Maximum documents per batch upload                       |
| `CLAIMLENS_WORKER_CONCURRENCY`     | 8             | Number of concurrent tasks per worker process            |

#### Confidence Thresholds

| Parameter                          | Default       | Description                                              |
|------------------------------------|---------------|----------------------------------------------------------|
| `CONFIDENCE_AUTO_APPROVE`          | 0.90          | Minimum aggregate score for auto-approval                |
| `CONFIDENCE_REVIEW_THRESHOLD`      | 0.60          | Minimum aggregate score before rejection                 |
| `CONFIDENCE_CLASSIFICATION_MIN`    | 0.80          | Minimum classification confidence                        |

#### Engine Configuration (per engine, via admin dashboard)

| Parameter            | Description                                                    |
|----------------------|----------------------------------------------------------------|
| `engine_name`        | Human-readable engine identifier                               |
| `adapter_type`       | Adapter class: `mistral`, `deepseek`, `gemini`, `openai_compat` |
| `deployment_mode`    | **`hosted_api`** (MVP default) or **`self_hosted`** — determines data handling controls, compliance logging, and connectivity requirements. |
| `endpoint_url`       | URL of the inference endpoint — hosted API URL (e.g., `https://api.mistral.ai/v1`) or self-hosted server URL (e.g., `http://gpu-server:8000/v1`). |
| `model_id`           | Specific model identifier (e.g., `pixtral-large-latest`)      |
| `api_key`            | Authentication key (encrypted at rest). Required for hosted APIs; optional for self-hosted. |
| `temperature`        | Inference temperature (default: 0.1 for deterministic output)  |
| `max_tokens`         | Maximum response tokens (default: 4096)                        |
| `timeout_seconds`    | Request timeout (default: 60)                                  |
| `is_primary`         | Whether this engine is the primary for document processing     |
| `is_active`          | Whether this engine is available for use                       |
| `data_sovereignty_ack` | Boolean — for `hosted_api` mode, administrators must explicitly acknowledge that document data will be transmitted to the external provider. This acknowledgment is logged in the audit trail. Defaults to `false`; engine cannot be activated in `hosted_api` mode until set to `true`. |
| `cost_tracking_enabled` | Boolean — enables API usage cost tracking and budget alerting for hosted API engines (default: `true` for `hosted_api` mode). |

### 14.3 Admin Dashboard Features

- **Engine Management**: Add, configure, test, activate/deactivate LLM engines. Live health status indicators per engine with latency and error rate graphs.
- **Document Type Registry**: CRUD operations on document types. Template editor with field definitions, extraction prompt templates, and example document upload for few-shot examples.
- **Confidence Tuning**: Adjust global and per-document-type confidence thresholds. Simulation tool showing the impact of threshold changes on historical data (what percentage would be auto-approved vs. sent to review).
- **Schema Mapping Editor**: Visual mapping editor showing source fields (extraction output) → target fields (OpenIMIS schema) with transformation rule configuration.
- **User Management**: RBAC user management with role assignment. Integration with external identity providers (LDAP, OIDC).
- **System Health**: Real-time dashboard showing queue depth, processing rate, error rate, engine utilization, and review queue status. Historical trend charts.
- **Audit Log Viewer**: Searchable audit log with filters by action type, user, entity, and date range.

---

## 15. Phased Delivery Plan

### Phase 1: Foundation with Hosted APIs (Weeks 1–4)

**Objective**: Establish core infrastructure, processing pipeline, and basic extraction capability using hosted LLM APIs as the default inference mode.

| Deliverable                                          | Sprint |
|------------------------------------------------------|--------|
| Project scaffolding: Docker Compose, CI/CD pipeline, repository structure | S1     |
| Database schema design and migration framework (PostgreSQL) | S1     |
| MinIO document storage integration                    | S1     |
| Document ingestion API (single file upload, validation) | S1     |
| Pre-processing pipeline: deskew, noise reduction, quality scoring | S2     |
| LLM Engine Abstraction Layer with `deployment_mode` support (hosted_api / self_hosted) | S2 |
| Mistral API adapter (hosted mode — MVP default primary engine) | S2     |
| Basic document classification (claim form, invoice)   | S2     |
| Basic field extraction with confidence scoring        | S3     |
| Celery worker pipeline with Redis queue               | S3     |
| Processing status API                                 | S3     |
| API cost tracking and usage logging for hosted engines | S3     |
| Unit and integration test framework                   | S3     |

**Phase 1 Exit Criteria**: System can ingest a scanned claim form via hosted Mistral API, classify it, extract basic fields with confidence scores, and return structured JSON output via API. Hosted API cost tracking is operational.

### Phase 2: Intelligence and Review (Weeks 5–10)

**Objective**: Add full extraction capabilities, human review system, and additional hosted engine support. All engines default to hosted API mode.

| Deliverable                                          | Sprint |
|------------------------------------------------------|--------|
| DeepSeek API and Gemini API engine adapters (hosted mode) | S4     |
| OpenAI-compatible generic adapter (supports both hosted and self-hosted endpoints) | S4     |
| Engine Manager: primary-fallback and confidence cascade strategies | S4     |
| Full document type registry with 6 built-in types     | S4     |
| Advanced field extraction: tables, multi-currency, date normalization | S5     |
| Prompt engineering framework with versioned templates  | S5     |
| Human review UI: split-pane viewer, field editing, bounding box overlays | S5–S6  |
| Review queue management with priority scoring          | S6     |
| Keyboard-driven review workflow                        | S6     |
| Batch upload API                                       | S6     |
| Correction feedback capture and storage                | S7     |
| Data sovereignty acknowledgment workflow for hosted engine configuration | S7 |

**Phase 2 Exit Criteria**: Full multi-engine extraction (via hosted APIs) across all 6 document types. Human review interface operational. Review queue with assignment and SLA tracking. Accuracy baselines established per engine for migration comparison.

### Phase 3: Integration and Output (Weeks 11–14)

**Objective**: OpenIMIS integration, schema mapping, output routing, and production hardening.

| Deliverable                                          | Sprint |
|------------------------------------------------------|--------|
| Schema mapping layer with transformation rules        | S8     |
| OpenIMIS FHIR claim schema mapping configuration      | S8     |
| Direct OpenIMIS push integration (claim submission API) | S8     |
| Staging system with intermediary review UI             | S8     |
| Output validation against OpenIMIS schema constraints  | S9     |
| Webhook notification system                            | S9     |
| OpenIMIS reference data integration (facility codes, insuree lookup, ICD-10 codes) | S9 |
| Watched folder ingestion                               | S9     |
| Anomaly detection flags during extraction              | S9     |

**Phase 3 Exit Criteria**: End-to-end flow from document scan to OpenIMIS claim submission. Both output modes (direct push and staging) operational. Webhook notifications firing.

### Phase 4: Administration and Production Readiness (Weeks 15–18)

**Objective**: Admin dashboard, monitoring, security hardening, and production deployment.

| Deliverable                                          | Sprint |
|------------------------------------------------------|--------|
| Admin dashboard: engine management, document type registry, confidence tuning | S10    |
| Admin dashboard: schema mapping editor, user management | S10    |
| RBAC implementation and authentication integration     | S10    |
| Prometheus metrics, Grafana dashboards, and alerting rules | S11    |
| Loki log aggregation and OpenTelemetry tracing         | S11    |
| Security hardening: TLS configuration, input sanitization, rate limiting | S11    |
| Load testing: 2,500+ documents/day sustained throughput validation | S12    |
| Accuracy benchmarking against ground-truth dataset     | S12    |
| Deployment documentation and runbooks                  | S12    |
| Operator training materials                            | S12    |

**Phase 4 Exit Criteria**: Full admin dashboard. Monitoring and alerting operational. Security audit passed. Load test targets met. Accuracy benchmarks met. Deployment documentation complete.

### Phase 5: On-Premise Migration and Optimization (Weeks 19+)

**Objective**: Migrate from hosted APIs to self-hosted open-source models for data sovereignty, cost optimization, and regulatory compliance. Continuous accuracy improvement and feature expansion.

| Deliverable                                          | Timeline |
|------------------------------------------------------|----------|
| **On-premise model evaluation**: Deploy candidate open-source vision models (e.g., Pixtral, Qwen-VL, InternVL, LLaVA) via vLLM/Ollama on GPU infrastructure and benchmark against hosted API accuracy baselines | Priority |
| **A/B engine testing framework**: Route a configurable percentage of production traffic to on-premise models alongside hosted APIs for direct accuracy comparison | Priority |
| **Migration toolkit**: Automated migration workflow — validate on-premise model meets accuracy thresholds → switch engine `deployment_mode` from `hosted_api` to `self_hosted` → monitor for regression → rollback if needed | Priority |
| Prompt optimization based on correction feedback analysis | Ongoing |
| Fine-tuning adapter support for deployment-specific model improvement | TBD |
| Additional document type onboarding toolkit            | TBD |
| Multi-language expansion based on deployment feedback   | TBD |
| Advanced analytics: fraud pattern detection, cost trend analysis | TBD |
| API v2 with GraphQL support                            | TBD |

**Phase 5 Exit Criteria for On-Premise Migration**: Self-hosted models meet or exceed the accuracy baselines established with hosted APIs during Phases 1–4. Hosted API engines can be deactivated without degradation in processing quality. Zero external data transmission confirmed via audit log review.

---

## 16. Risk Register

| ID   | Risk                                               | Likelihood | Impact | Mitigation                                                                                |
|------|----------------------------------------------------|------------|--------|-------------------------------------------------------------------------------------------|
| R-01 | LLM vision model accuracy falls below targets on handwritten documents in non-Latin scripts. | Medium | High | Multi-engine cascade strategy allows fallback. Hosted APIs provide access to frontier models with best-in-class accuracy. Few-shot examples improve per-deployment accuracy. Phase 5 includes fine-tuning adapter support. |
| R-02 | **Hosted API cost escalation** at high volume (2,000+ docs/day) exceeds budget projections. | Medium | Medium | Cost tracking and budget alerting built into engine configuration. Per-document cost logging enables accurate forecasting. Volume-based pricing negotiations with providers. Phase 5 on-premise migration eliminates API costs entirely. |
| R-03 | **Hosted API rate limits or availability issues** impact processing throughput. | Medium | Medium | Multi-engine fallback ensures continuity if a single provider is throttled or down. Circuit breaker pattern prevents cascade failures. Queue-based processing buffers during outages. |
| R-04 | **Data sovereignty concerns** with hosted API mode — document data transmitted to external providers during MVP. | Medium | High | `data_sovereignty_ack` flag requires explicit administrator acknowledgment. All external API calls are audit-logged. Provider data processing agreements reviewed pre-deployment. Phase 5 on-premise migration path provides full data sovereignty when ready. Sensitive deployments can accelerate on-premise timeline. |
| R-05 | OpenIMIS API changes break the integration layer. | Low | Medium | Schema mapping is configurable and decoupled from core logic. Integration tests run against OpenIMIS API contract. Staging mode provides a fallback if direct push fails. |
| R-06 | Human review becomes a bottleneck at high volume. | Medium | Medium | Continuous accuracy improvement reduces review rate target to < 15%. Keyboard-optimized UI minimizes review time. Reviewer assignment balancing prevents individual overload. |
| R-07 | LLM prompt injection via malicious document content. | Low | High | Input content is isolated in prompt templates. Output is schema-validated. Documents are treated as untrusted input in all prompt construction. |
| R-08 | Data retention non-compliance in a specific jurisdiction. | Low | High | Configurable retention policies per document type. Automated purge jobs with audit trail. Compliance configuration checklist included in deployment documentation. |
| R-09 | **On-premise model accuracy gap** — self-hosted open-source models do not match hosted API accuracy baselines during Phase 5 migration. | Medium | High | A/B testing framework provides direct comparison before cutover. Accuracy thresholds are configurable; migration only proceeds when on-premise models meet or exceed the established baseline. Hosted APIs can remain as fallback indefinitely. Fine-tuning adapters can close accuracy gaps for deployment-specific document types. |
| R-10 | Network latency to hosted API endpoints degrades throughput. | Low | Medium | Timeout configuration and retry logic with exponential backoff. Queue-based processing absorbs latency spikes. Multiple provider endpoints in different regions can be configured for geographic optimization. |
| R-11 | **Hosted provider deprecates or changes model versions**, causing extraction regressions. | Low | Medium | Model versions are pinned in engine configuration (`model_id`). Provider deprecation timelines monitored. Multi-engine fallback ensures continuity. On-premise models are version-locked and immune to provider changes. |

---

## 17. Appendices

### Appendix A: Glossary

| Term                 | Definition                                                                                 |
|----------------------|--------------------------------------------------------------------------------------------|
| **ClaimLens**        | The name of this AI-powered OCR module for OpenIMIS.                                       |
| **LLM Vision**       | Large Language Model with image/vision understanding capabilities.                         |
| **Confidence Score** | A numeric value (0.0–1.0) indicating the model's certainty about an extracted field value. |
| **Extraction Template** | A configurable prompt template that defines which fields to extract from a specific document type. |
| **Document Type Registry** | The configurable catalog of supported document types and their associated extraction configurations. |
| **FHIR**             | Fast Healthcare Interoperability Resources — the healthcare data exchange standard used by OpenIMIS. |
| **CHFID**            | Claim Health Facility ID — the unique insuree identifier in OpenIMIS.                      |
| **Engine Adapter**   | A software component that implements the LLM Engine interface for a specific model provider. |
| **Deployment Mode**  | The inference connectivity mode for an engine: `hosted_api` (calls external provider API over HTTPS) or `self_hosted` (calls a locally deployed inference server). |
| **Hosted-First Strategy** | The MVP approach of defaulting to hosted API-based LLM models to validate the end-to-end pipeline before migrating to self-hosted on-premise models. |
| **Confidence Cascade** | An engine selection strategy that re-processes a document with a secondary engine if the primary engine's confidence is below threshold. |
| **Staging**          | An intermediary holding area for extraction results before they are submitted to OpenIMIS.  |

### Appendix B: Reference Documents

| Document                                     | Location / Link                                |
|----------------------------------------------|------------------------------------------------|
| OpenIMIS REST API Documentation              | https://openimis.atlassian.net/wiki/           |
| OpenIMIS FHIR Implementation Guide           | https://openimis.github.io/openimis_fhir_r4_ig/|
| Mistral Vision Model Documentation           | https://docs.mistral.ai/                       |
| DeepSeek Vision Model Documentation          | https://platform.deepseek.com/docs             |
| Google Gemini API Documentation              | https://ai.google.dev/docs                     |
| vLLM Documentation                           | https://docs.vllm.ai/                          |
| Ollama Documentation                         | https://ollama.com/                             |
| FHIR Claim Resource Specification            | https://www.hl7.org/fhir/claim.html            |

### Appendix C: Technology Stack Summary

| Layer               | Technology                    | Version    |
|---------------------|-------------------------------|------------|
| API Server          | Python + FastAPI              | 3.12+ / 0.110+ |
| Frontend            | Next.js + React + TypeScript  | 15+ / 19+  |
| Task Queue          | Celery + Redis                | 5.4+ / 7+  |
| Database            | PostgreSQL                    | 16+        |
| Object Storage      | MinIO                         | Latest     |
| LLM Serving         | vLLM / Ollama                 | Latest     |
| Monitoring          | Prometheus + Grafana          | Latest     |
| Logging             | Loki + Promtail               | Latest     |
| Tracing             | OpenTelemetry                 | Latest     |
| Containerization    | Docker + Docker Compose       | 27+ / 2.29+|
| Orchestration (opt.)| Kubernetes                    | 1.30+      |

### Appendix D: Hardware Sizing Recommendations

#### MVP Deployment with Hosted APIs (2,000–5,000 docs/day)

No GPU infrastructure required. The LLM inference is handled by hosted API providers.

| Component              | CPU     | RAM     | Storage  | GPU | Notes                          |
|------------------------|---------|---------|----------|-----|--------------------------------|
| ClaimLens Application  | 8 cores | 16 GB   | 100 GB SSD | —  | API + 4–8 workers              |
| PostgreSQL             | 4 cores | 8 GB    | 200 GB SSD | —  | Dedicated or shared             |
| Redis                  | 2 cores | 4 GB    | —        | —   | In-memory only                  |
| MinIO                  | 2 cores | 4 GB    | 1 TB HDD | —  | Expandable; RAID recommended    |

**Network requirement**: Outbound HTTPS access to hosted API endpoints (e.g., `api.mistral.ai`, `generativelanguage.googleapis.com`, `api.deepseek.com`). Estimated bandwidth: ~2–5 MB per document round-trip.

**Estimated API costs** (for budgeting purposes at 2,000 docs/day — actual costs vary by provider, model, and document complexity):

| Provider     | Estimated Cost per Document | Estimated Monthly Cost (2K docs/day) |
|--------------|----------------------------|--------------------------------------|
| Mistral API  | $0.01–$0.05               | $600–$3,000                          |
| Gemini API   | $0.01–$0.04               | $600–$2,400                          |
| DeepSeek API | $0.005–$0.02              | $300–$1,200                          |

*Note: These are rough estimates based on typical vision model token pricing at time of writing. Actual costs should be validated with current provider pricing and representative document samples during Phase 1.*

#### Post-MVP On-Premise Deployment (2,000–3,000 docs/day)

Required when migrating to self-hosted models for data sovereignty or cost optimization.

| Component              | CPU     | RAM     | Storage  | GPU               | Notes                          |
|------------------------|---------|---------|----------|-------------------|--------------------------------|
| ClaimLens Application  | 8 cores | 16 GB   | 100 GB SSD | —               | API + 4 workers                |
| PostgreSQL             | 4 cores | 8 GB    | 200 GB SSD | —               | Dedicated or shared             |
| Redis                  | 2 cores | 4 GB    | —        | —                 | In-memory only                  |
| MinIO                  | 2 cores | 4 GB    | 1 TB HDD | —                | Expandable; RAID recommended    |
| LLM Inference Server   | 8 cores | 32 GB   | 100 GB SSD | 1× NVIDIA A10 (24 GB) or equivalent | Quantized models reduce VRAM requirement |

#### Post-MVP On-Premise Production Deployment (5,000+ docs/day)

| Component              | CPU      | RAM     | Storage  | GPU               | Notes                          |
|------------------------|----------|---------|----------|-------------------|--------------------------------|
| ClaimLens Application  | 16 cores | 32 GB   | 200 GB SSD | —               | API + 8 workers                |
| PostgreSQL             | 8 cores  | 16 GB   | 500 GB SSD | —               | Dedicated with PgBouncer       |
| Redis                  | 4 cores  | 8 GB    | —        | —                 | Sentinel for HA                 |
| MinIO                  | 4 cores  | 8 GB    | 4 TB HDD | —                | Multi-node recommended          |
| LLM Inference Server   | 16 cores | 64 GB   | 200 GB SSD | 2× NVIDIA A100 (40 GB) or equivalent | Supports concurrent inference  |

---

*End of Document*

*This PRD is a living document and will be updated as requirements evolve through stakeholder review and technical discovery.*
