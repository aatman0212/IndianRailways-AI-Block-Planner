# AI-Powered Automatic Block Planning — Streamlined Project Plan

> **Domain:** Smart India Hackathon — AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways  
> **Architecture Principle:** Simple, self-contained, zero external daemon dependencies (FastAPI + Google OR-Tools CP-SAT + React/Tailwind).

---

## Streamlined Atomic Task Roadmap (All Tasks Completed)

### Step 1: Environment & Dependency Setup
- [x] **TASK-01: Scaffolding Workspace Structure**
  - Directories created: `backend/`, `frontend/`, `data/`, `docs/`, and root `.gitignore`.
- [x] **TASK-02: Install Core Python Packages**
  - Installed FastAPI, Uvicorn, Pydantic, OR-Tools, scikit-learn, and Pandas into virtual environment (`venv`). Verified with `ALL_DEPS_READY`.

### Step 2: Domain Models & Realistic Synthetic Data
- [x] **TASK-03: Create Domain Data Models (TMS, SMMS, TDMS, COA, Unified Tasks)**
  - Implemented in `backend/app/models.py` covering Indian Railways divisions, sections, departmental defects, and block possessions.
- [x] **TASK-04: Generate Realistic Indian Railways Dataset**
  - Built `backend/app/synthetic_data.py` producing 8 high-density sections (Prayagraj - Kanpur), 13 multi-department defects, and 72 COA traffic windows in `data/synthetic_railway_data.json`.

### Step 3: AI Prioritization & Explainability Engine
- [x] **TASK-05: Implement Criticality Prioritization & Explainability Logic**
  - Implemented in `backend/app/prioritization.py` with 5-factor transparent MCDA scoring (Safety, Overdue, Density, Statutory, Speed Restrictions) and plain-English rationales.

### Step 4: Block Scheduling & Multi-Department Bundling Optimizer
- [x] **TASK-06: Implement Google OR-Tools Scheduling & Bundling Solver**
  - Implemented in `backend/app/optimizer.py` using Google OR-Tools CP-SAT. Verified: bundles Engineering, TRD, and S&T tasks on the same corridor possession, achieving 50% bundling ratio and 97.7% asset availability.

### Step 5: FastAPI Backend Service
- [x] **TASK-07: Build Simple REST API Endpoints**
  - Implemented in `backend/app/main.py`:
    - `GET /api/health`
    - `GET /api/network/sections`
    - `GET /api/tasks` & `POST /api/tasks`
    - `GET /api/windows`
    - `POST /api/plan/generate`
    - `GET /api/plan/current`
    - `POST /api/plan/blocks/{id}/approve`
    - `POST /api/plan/blocks/{id}/reject`
    - `GET /api/analytics`

### Step 6: Interactive Frontend Dashboard
- [x] **TASK-08: Scaffold React + Vite + Tailwind CSS Frontend**
  - Configured React 18, TypeScript, Vite, Tailwind CSS with Indian Railways theme, and Lucide icons in `frontend/`.
- [x] **TASK-09: Build Interactive Corridor Timeline (Gantt) & Explainability Modal**
  - Created `frontend/src/components/CorridorGantt.tsx` and `frontend/src/components/ExplainModal.tsx` with multi-department badges, factor contribution bars, and Section Controller actions.
- [x] **TASK-10: Build KPI Metrics, Task Inventory & Human Approval Workflow**
  - Created `frontend/src/components/KpiCards.tsx` and `frontend/src/components/TaskInventory.tsx`. Tested with `npm run build` (compiled in 45s with 0 errors).
  - Built 1-click launcher `run.py`.

### Advanced Hackathon Features
- [x] **FEAT-01: Live Defect & Emergency Injection with Dynamic AI Re-Planning**
  - Built `frontend/src/components/InjectDefectModal.tsx` with one-click demo presets (Emergency Rail Fracture, OHE Catenary Sag, Signal Point Machine Failure).
  - Enhanced `POST /api/tasks?auto_replan=true` to instantly re-score incoming defects and trigger Google OR-Tools CP-SAT re-planning in real-time.
  - Implemented high-priority toast alerts and instant Gantt matrix refresh.
- [x] **FEAT-02: Live Route Mimic & Digital Twin Schematic**
  - Built `frontend/src/components/TrackSchematic.tsx` showing the 191 km corridor across all 9 stations (PRYJ to CNB).
  - Visual track indicators showing real-time train movements (Rajdhani, Express, Heavy Freight) and active maintenance possession blocks with hazard striping.
- [x] **FEAT-03: Operational "What-If" Scenario Simulator**
  - Built `frontend/src/components/WhatIfSimulator.tsx` allowing Section Controllers to interactively adjust block duration and freight holdover rules, calculating the instant trade-off between safety and passenger punctuality.
- [x] **FEAT-04: Official Indian Railways Form T/409 Block Bulletin Export**
  - Built `frontend/src/components/OfficialBulletinModal.tsx` generating formatted Control Office block advice memos with digital verification, print-ready CSS (`window.print()`), and CSV data download.
- [x] **FEAT-05: Section Controller Mission-Control UI Overhaul**
  - Overhauled `frontend/src/App.tsx`, `CorridorGantt.tsx`, and `KpiCards.tsx` with Indian Railways branding, ticking live IST clock, 24-hour timeline ruler, night lull shading, and telemetry gauges.
- [x] **FEAT-06: Real-Time Upstream Train Delay & CP-SAT Autonomous Conflict Resolver**
  - Built `frontend/src/components/ConflictSimulatorModal.tsx` and `ConflictBanner.tsx` allowing Section Controllers to simulate upstream high-priority train delays (Rajdhani, Vande Bharat).
  - Added REST endpoints `POST /api/simulate/conflict` and `POST /api/simulate/resolve-conflict` triggering Google OR-Tools CP-SAT re-optimization to dynamically reschedule conflicting blocks into safe traffic lulls without train stoppage.

---

## How to Run the Solution
1. **One-Click Master Launcher:**
   ```bash
   python run.py
   ```
2. **Or Individual Terminals:**
   * Backend: `.\venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload`
   * Frontend: `cd frontend && npm run dev`
