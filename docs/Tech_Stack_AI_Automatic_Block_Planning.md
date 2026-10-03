# Tech Stack

## AI-Powered Automatic Block Planning for Indian Railways

---

## 1. Overview

The stack is split into five layers matching the architecture in the PRD: data ingestion, data storage, AI/ML (prioritization + optimization), backend/API, and frontend dashboard. Choices favor an open-source, Python-centric ML/optimization core (since the hard problem here is scheduling optimization, not just a web CRUD app), with a standard modern web stack on top for the planner-facing dashboard.

---

## 2. Data Ingestion & Integration Layer

| Component | Choice | Why |
|---|---|---|
| Integration style | REST/GraphQL adapters per source system (TMS, SMMS, TDMS, COA) | Each legacy system exposes data differently; adapters isolate that variability |
| Ingestion framework | **Python + FastAPI** microservice(s), or **Apache Airflow** for scheduled batch pulls | Airflow if data arrives as periodic batch exports; FastAPI service if near-real-time API polling is needed |
| Data validation | **Pydantic** (schema validation) + **Great Expectations** (data-quality checks) | Catch missing/inconsistent fields from source systems before they hit the model |
| Synthetic data (prototype) | **Python (Faker, NumPy, pandas)** custom generator | Needed since live TMS/SMMS/TDMS/COA access is unlikely during a hackathon |
| Message/event bus (optional, for near-real-time defect updates) | **Apache Kafka** or **Redis Streams** | Enables dynamic re-prioritization as new defects arrive |

## 3. Data Storage

| Component | Choice | Why |
|---|---|---|
| Primary operational DB | **PostgreSQL** | Relational integrity for tasks/assets/corridors/departments; strong support for constraints and time-window queries |
| Time-series / analytics store (optional) | **TimescaleDB** (Postgres extension) or **InfluxDB** | For asset-availability and downtime trend analytics |
| Caching layer | **Redis** | Fast lookups for corridor availability windows during optimization runs |
| Object storage (for reports/exports) | **AWS S3** / **MinIO** (self-hosted equivalent) | Storing generated weekly/monthly plan exports, logs |

## 4. AI/ML & Optimization Core

| Component | Choice | Why |
|---|---|---|
| Prioritization/criticality scoring | **Python** — scikit-learn (gradient boosting / ranking model) or a transparent weighted multi-criteria scoring function | Explainability matters in a safety-critical domain; start rules-based/weighted, layer in learned ranking (e.g., **LightGBM Ranker**) as data matures |
| Constraint-based scheduling / optimization | **Google OR-Tools** (CP-SAT solver) | Purpose-built for constraint programming and scheduling/assignment problems — fits "assign tasks to block windows under constraints" well |
| Alternative/fallback for large search spaces | **DEAP** (genetic algorithms) or custom simulated annealing | If CP-SAT scales poorly at full network size, fall back to metaheuristics |
| Model experimentation & tracking | **Jupyter notebooks** + **MLflow** | Track prioritization model versions and evaluation metrics |
| Explainability | **SHAP** | Justify why a task was prioritized/deferred — needed for planner trust and audit |
| Numerical/data processing | **pandas, NumPy** | Standard data wrangling across all pipeline stages |

## 5. Backend / API Layer

| Component | Choice | Why |
|---|---|---|
| API framework | **Python — FastAPI** | Async-friendly, integrates cleanly with the ML/optimization stack (same language as the ML core, avoids a Python↔service hop) |
| Task orchestration (weekly/monthly plan generation runs) | **Celery + Redis** (or Airflow if already used for ingestion) | Scheduling recurring plan-generation jobs, handling long-running optimization tasks asynchronously |
| Auth / RBAC | **OAuth2 / JWT** via FastAPI's security utilities | Role-based access per department (Engineering, TRD, S&T, Controller, Manager) |
| API documentation | **OpenAPI/Swagger** (built into FastAPI) | Auto-generated docs for the integration layer |

## 6. Frontend — Planner Dashboard

| Component | Choice | Why |
|---|---|---|
| Framework | **React** (with **TypeScript**) | Team likely already comfortable with this; strong ecosystem for dashboards |
| UI component library | **Tailwind CSS** + **shadcn/ui** | Fast, clean, professional look without heavy custom CSS |
| Calendar / timeline visualization | **FullCalendar** or a custom **D3.js** Gantt/timeline view | Block plans are inherently a timeline-across-corridors view — a Gantt-style chart communicates this best |
| Charts (KPIs/analytics) | **Recharts** or **Chart.js** | Asset availability trends, block utilization %, backlog charts |
| State management | **React Query (TanStack Query)** | Clean handling of server state (plans, tasks, approvals) with caching |

## 7. Infrastructure & DevOps

| Component | Choice | Why |
|---|---|---|
| Containerization | **Docker** + **Docker Compose** (dev) | Consistent environment across ingestion, backend, ML, frontend services |
| Orchestration (if scaling beyond prototype) | **Kubernetes** | Only needed past hackathon/prototype scale |
| CI/CD | **GitHub Actions** | Automated testing/build for each service |
| Version control | **Git + GitHub** | Standard |
| Hosting (demo) | **Render / Railway.app / AWS free tier** | Quick, low-cost hosting for a hackathon demo |
| Monitoring/logging (optional, for maturity) | **Prometheus + Grafana** | Track optimization run times, API latency, job failures |

## 8. Summary Stack at a Glance

- **Languages:** Python (ML, optimization, backend), TypeScript (frontend)
- **Core ML/Optimization:** scikit-learn / LightGBM (prioritization) + Google OR-Tools CP-SAT (scheduling optimization) + SHAP (explainability)
- **Backend:** FastAPI + Celery + Redis
- **Database:** PostgreSQL (+ TimescaleDB for analytics)
- **Frontend:** React + TypeScript + Tailwind/shadcn + FullCalendar/D3 + Recharts
- **Infra:** Docker, GitHub Actions, cloud free-tier hosting for demo

## 9. Notes & Alternatives

- If the team is more comfortable with a **Node.js/Express** backend instead of FastAPI, the ML/optimization core can still run as a separate Python microservice invoked over REST/gRPC — slightly more moving parts but keeps ML and web concerns cleanly separated.
- If OR-Tools proves too slow or hard to model the full constraint set for the hackathon timeline, a simpler **greedy/heuristic scheduler** (sort by priority score, greedily assign to earliest feasible window) is a reasonable fallback for a working demo, with OR-Tools framed as the "production-grade" upgrade path in the pitch.
- Kafka/Airflow/Kubernetes/Prometheus are listed as the "scale-up" path — for the hackathon prototype itself, a simpler Docker Compose setup with FastAPI, PostgreSQL, Redis, and a scheduled Celery job is enough to demonstrate the full flow end-to-end.
