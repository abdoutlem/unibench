1️⃣ FRONTEND STACK (Web + Mobile)
✅ Web (Primary UI)

Framework

Next.js (React, App Router)

Server Components later

Perfect for dashboards, filtering, auth

Claude is excellent at generating Next.js code

Language

TypeScript (strict mode)
→ Critical for large analytics platforms

Styling

Tailwind CSS

Fast iteration for Phase 0

Easy design system later

shadcn/ui

Enterprise-grade components

Accessible, clean, customizable

Charts & Visualization

Recharts (Phase 0–2)

Optional later: ECharts or Vega-Lite for complex analytics

State & Data Fetching

TanStack Query (React Query)

Mock APIs → real APIs with zero refactor

Local mock store (JSON / TS objects) in Phase 0

Routing & Layout

Next.js App Router

Layouts per:

Portfolio

Benchmarks

Comparisons

Admin / Glossary

📱 Mobile (Secondary)

Framework

React Native (Expo)

Why

Shares logic & types with web

Read-only dashboards

Fast iteration once web UX is validated

2️⃣ BACKEND STACK (Phase 1+)
✅ Core Backend

Framework

FastAPI (Python)

Extremely clear API contracts

Built-in OpenAPI (critical for governance)

Claude generates excellent FastAPI code

Language

Python 3.11+

API Style

REST (GraphQL later only if needed)

Strict versioning (/v1/metrics/...)

🗄️ Database Layer

Primary Database

PostgreSQL 15+

Key Features You’ll Use

JSONB (semi-structured data)

Window functions (time-series)

CTEs for analytics

Row-level security (RLS)

Temporal Strategy

Valid time + system time (bitemporal)

Immutable fact tables + corrections

📦 Data Modeling & Validation

Pydantic v2 (API + data contracts)

Explicit schemas everywhere

Metric definitions as first-class objects

3️⃣ DATA INGESTION & PIPELINES (Phase 2+)
Internal Data (Workstream 1)

pandas

openpyxl

PyMuPDF

python-pptx

Manual + semi-automated validation UI

External Data (Workstream 2)

APIs (where available)

Scraping (only if permitted)

AI extraction only for unstructured content

Pipeline Orchestration

Prefect (preferred)

Observable

Retryable

Python-native

(Airflow is overkill at this stage)

4️⃣ AUTH, SECURITY & GOVERNANCE
Authentication

Auth.js (NextAuth) for web

JWT / OAuth2 compatible

Authorization

Role-based access control (RBAC)

Internal vs external data enforced at API + DB level

Secrets & Config

Environment-based config

Vault later if needed

5️⃣ DEV & INFRA STACK
Local Development

Docker + docker-compose

PostgreSQL container

Mock API service

Environments

Local → Staging → Production

Strict separation of internal/external pipelines

Observability (Phase 4)

OpenTelemetry

Prometheus + Grafana

Structured logging