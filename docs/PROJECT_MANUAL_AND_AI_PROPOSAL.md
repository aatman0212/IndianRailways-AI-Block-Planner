# Indian Railways: AI-Powered Automatic Block Planning System
## Comprehensive Project Manual & Advanced AI Upgrade Roadmap

---

# PART 1: CURRENT PROJECT MANUAL

## 1. Executive Summary & Problem Context
* **Smart India Hackathon Problem Statement**: AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways.
* **Corridor Prototype**: Prayagraj — Kanpur Central high-density trunk route (North Central Railway).

### The Real-World Challenge:
Indian Railways manages fixed railway infrastructure across three siloed engineering wings:
1. **Engineering (P.Way)**: Rail fractures, weld defects, track tamping, deep screening (recorded in **TMS**).
2. **TRD (Traction Distribution)**: Overhead equipment (OHE) wire sag, neutral section checks, power feeds (recorded in **TDMS**).
3. **S&T (Signalling & Telecom)**: Point machines, signal gears, track circuit relays (recorded in **SMMS**).

Historically, each department books corridor shutdowns (called **"Traffic/Power Blocks"**) independently in **BDMS**, decoupled from real-time train paths in **COA** (Control Office Application). This causes:
* **Severe train delays**: Separate 2-hour shutdowns by Engineering and TRD on the exact same track segment double the disruption window.
* **Safety & Prioritization Failures**: High-risk rail cracks compete randomly with routine bush cutting.
* **Controller Fatigue**: Section Controllers manually negotiate conflicting paper memos under immense operational pressure.

---

## 2. System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                          DATA SOURCES & SYSTEMS                        │
├─────────────────┬──────────────────┬─────────────────┬─────────────────┤
│    TMS (P.Way)  │    TDMS (TRD)    │    SMMS (S&T)   │    COA / IRCTC  │
│  Track Defects  │    OHE Cables    │   Signal Faults │  Timetable Gaps │
└────────┬────────┴────────┬─────────┴────────┬────────┴────────┬────────┘
         │                 │                  │                 │
         ▼                 ▼                  ▼                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 1. Unified Multi-Department Data Ingestion                             │
│    Normalizes heterogeneous inputs into standardized UnifiedTask &     │
│    CorridorBlockWindow entities.                                       │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 2. AI Prioritization Engine (MCDA 0–100 Scoring)                       │
│    Calculates mathematical urgency + generates plain-English rationale │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 3. Constraint-Based Optimization Engine (Google OR-Tools CP-SAT)       │
│    Solves spatial-temporal allocation with multi-department bundling   │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 4. FastAPI REST API Layer (Port 8000)                                  │
│    Endpoints for Health, Sections, Tasks, Current Plan, Approval,      │
│    What-If Simulation, and Defect Injection.                           │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 5. React 18 + Vite Interactive Dashboard (Port 5173)                   │
│    Gantt Matrix | Track Mimic | What-If Simulator | Official Bulletins │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Core Engine Deep-Dive

### A. AI Prioritization Engine (MCDA: Multi-Criteria Decision Analysis)
Located in `backend/app/prioritization.py`. Every maintenance demand receives a priority score between **0.0 and 100.0**:

$$\text{Priority Score} = S_{\text{severity}} + S_{\text{overdue}} + S_{\text{density}} + S_{\text{statutory}} + S_{\text{speed\_restriction}}$$

* **Safety Severity ($S_{\text{severity}}$, max 40 pts)**:
  * Emergency IOM / Rail Flaw: 40.0 pts
  * Critical: 25.0 pts
  * Routine: 10.0 pts
* **Overdue Duration ($S_{\text{overdue}}$, max 20 pts)**:
  * Evaluated as $\min(20, \text{days\_overdue} \times 5.0)$.
* **Corridor Traffic Density ($S_{\text{density}}$, max 15 pts)**:
  * Scaled against 150 GMT (Gross Million Tonnes) high-density corridor traffic.
* **Statutory Compliance ($S_{\text{statutory}}$, 15 pts)**:
  * Awarded if task has mandatory regulatory deadline under railway safety norms.
* **Speed Restrictions ($S_{\text{speed\_restriction}}$, 10 pts)**:
  * Awarded if track has active Caution Order (trains slowed to 20–30 km/h) to restore sectional speed.

**Explainability Output**: Generates human-readable explanations displayed directly to controllers in the UI (*"Emergency safety severity (40 pts), 4 days overdue (+20 pts), active 30 km/h Caution Order (+10 pts)"*).

---

### B. Constraint Optimization Engine (Google OR-Tools CP-SAT)
Located in `backend/app/optimizer.py`. Formulated as a Constraint Satisfaction and Integer Programming model:

1. **Variables**:
   * $x_{t, w} \in \{0, 1\}$: Task $t$ assigned to Window $w$.
   * $y_w \in \{0, 1\}$: Window $w$ is actively utilized for maintenance.
   * $b_w \in \{0, 1\}$: Window $w$ is bundled (contains 2 or more distinct departments).
2. **Hard Constraints**:
   * **Single Execution**: $\sum_w x_{t, w} \le 1$ (each task executed at most once).
   * **Duration & Safety Buffer**: $\text{Window Duration} \ge \text{Task Duration} + 15\text{ min safety clearance buffer}$.
   * **Spatial Co-location**: Task section must match window section.
3. **Objective Function**:
   $$\max \sum_{t, w} (\text{Priority}_t \times x_{t, w}) + (\text{Bundling Bonus} \times b_w) - (\text{Disruption Penalty} \times y_w)$$
   * **Bundling Mechanism**: Automatically clusters Engineering (Track) + TRD (OHE) + S&T (Signals) into the same time slot, slashing total train possession time by **50% to 75%**.

---

## 4. Frontend Modules & Capabilities
1. **Executive KPI Ribbon**: Track Asset Availability (>97%), Bundling Ratio, Idle Window Reduction, and Overdue Backlog Count.
2. **Corridor Gantt Matrix**: Spatial-temporal matrix showing sections vs. time windows with colored multi-department tags.
3. **Track Mimic / Schematic**: Mimics real railway Section Control display boards, highlighting active section occupations.
4. **What-If Scenario Simulator**: Sliders to adjust optimization weights in real time and preview the resulting schedule.
5. **Defect Injection Portal**: Add live emergency defects and observe automatic dynamic re-planning.
6. **Controller Audit & Bulletin Modal**: Human-in-the-loop review, approval, and generation of official Indian Railways Block Grant memos.

---

## 5. How to Run the Project
* **One-Click Master Launcher**:
  ```bash
  python run.py
  ```
* **Endpoints**:
  * Dashboard: `http://localhost:5173`
  * REST API & Docs: `http://127.0.0.1:8000/docs`
  * Health Endpoint: `http://127.0.0.1:8000/api/health`

---
---

# PART 2: PROPOSED ADVANCED AI UPGRADE (FOR TEAM APPROVAL)

To elevate this project from a standard hackathon prototype to a **cutting-edge, industry-grade AI platform**, we propose 4 strategic AI additions:

---

### Feature 1: IR-Copilot — LLM + RAG over Railway Safety Rulebooks
* **The Problem**: Controllers and Junior Engineers must constantly check massive physical manuals (IRPWM, G&SR, ACTM, SEM) to ensure approved blocks comply with statutory safety precautions, caution order wording, and power isolation rules.
* **The AI Solution**:
  * Ingest official Railway Manuals into a local vector database (ChromaDB / FAISS).
  * **Automated Caution Order Generator**: When a block is approved, the LLM analyzes defect parameters and auto-generates the legally exact **Indian Railways Caution Order memo** (e.g., speed restrictions, earthing discharge rod placements, neutral section isolation).
  * **Interactive Rulebook Chat**: Controllers can query: *"What are the mandatory precautions under IRPWM Para 605 for deep screening on 60kg LWR track?"*
* **Impact**: Saves 15–20 minutes per block approval; eliminates safety violations.

---

### Feature 2: Natural Language Re-Planning Agent (Function Calling)
* **The Problem**: During live operations, unexpected events occur (e.g., *"Rajdhani Express is delayed by 40 minutes near Kanpur"*). Controllers cannot navigate multiple GUI screens to manually tweak 10 solver parameters while handling urgent radio traffic.
* **The AI Solution**:
  * An AI Controller Agent with **Function Calling / Tool Use** connected to the FastAPI backend.
  * Controller inputs natural language prompt:
    > *"Rajdhani Express is 45 min late at Kanpur. Re-schedule all routine OHE blocks between Panki and Bhaupur to protect passenger punctuality, but keep emergency rail fractures."*
  * The Agent automatically extracts constraints, calls `/api/plan/optimize`, and returns a clear situational briefing comparing before/after delays.
* **Impact**: Instant demo appeal; mimics autonomous AI assistants deployed in modern aerospace/rail traffic centers.

---

### Feature 3: Predictive Track Quality & Degradation ML (Condition-Based Planning)
* **The Problem**: The current system is **reactive** (plans blocks only after a defect is reported). Indian Railways is moving toward **Predictive Maintenance**.
* **The AI Solution**:
  * Train an ML model (LightGBM / Random Forest) using Track Recording Car (TRC) synthetic metrics:
    * Cumulative **GMT** (Gross Million Tonnes)
    * Track Quality Index (TQI)
    * Ambient temperature variance ($\Delta T$, buckling risk)
    * Welded joint age
  * The model outputs a **7-day Failure Probability Score** and proactively recommends preemptive maintenance blocks before cracks physically occur.
* **Impact**: Transforms the tool into a forward-looking predictive platform.

---

### Feature 4: Knock-on Train Delay & Disruption Propagation Simulator
* **The Problem**: Controllers need to know: *"If I give this 90-minute block now, how many passenger and freight trains behind it will suffer cascading delays?"*
* **The AI Solution**:
  * A lightweight **queuing and delay propagation model** that calculates:
    * Train Punctuality Loss (%)
    * Total passenger delay minutes
    * Freight congestion penalty
  * Provides a clear cost-benefit visualization: *"Taking this block now delays 2 freight trains by 10 mins; deferring it risks an emergency breakdown halting 5 express trains tomorrow."*
* **Impact**: Directly addresses the operational punctuality KPI demanded by railway judges.

---

## Summary Comparison Matrix for Team Decision

| Proposed Feature | AI Technology | Value to Indian Railways | Implementation Complexity | Demo "Wow Factor" |
|---|---|---|:---:|:---:|
| **1. IR-Copilot (RAG Rulebook)** | LLM + Vector Store (RAG) | Absolute safety compliance & auto-drafting | Moderate (1–2 hrs) | ⭐⭐⭐⭐⭐ |
| **2. Conversational Agent** | LLM Tool / Function Calling | Hands-free emergency re-optimization | Moderate (1–2 hrs) | ⭐⭐⭐⭐⭐ |
| **3. Predictive ML Degradation** | LightGBM / Scikit-Learn | Shifts from reactive to predictive maintenance | Moderate (1 hr) | ⭐⭐⭐⭐ |
| **4. Delay Propagation Model** | Queuing / Simulation ML | Quantifies train delay & financial trade-offs | Low-Moderate (1 hr) | ⭐⭐⭐⭐ |
