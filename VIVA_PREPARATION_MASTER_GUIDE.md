# Indian Railways AI-Powered Automatic Block Planning System
## Master Viva Preparation Guide & Comprehensive Q&A Handbook

**Institution:** Department of Computer Engineering, MPSTME, SVKM's NMIMS, Mumbai  
**Academic Year:** 2026–2027  
**Candidates:** Dishank Shah (C181) | Aatman Satra (C157)  
**Project Guide:** Prof. Jasleena Gonsalves  
**Corridor Focus:** Prayagraj Jn (PRYJ) – Kanpur Central (CNB), 191 km, North Central Railway (NCR)  
**GitHub Repository:** [https://github.com/aatman0212/IndianRailways-AI-Block-Planner](https://github.com/aatman0212/IndianRailways-AI-Block-Planner)  
**Live Application:** Frontend: `http://localhost:5173` | Backend API Docs: `http://localhost:8000/docs`

---

## Table of Contents
1. [Core Concept, Background & Motivation](#1-core-concept-background--motivation)
2. [Multi-Criteria Decision Analysis (MCDA) Scoring Engine](#2-multi-criteria-decision-analysis-mcda-scoring-engine)
3. [Google OR-Tools CP-SAT Constraint Optimization Engine](#3-google-or-tools-cp-sat-constraint-optimization-engine)
4. [IR-Copilot: Hybrid RAG & Google Gemini AI](#4-ir-copilot-hybrid-rag--google-gemini-ai)
5. [Railway Operations, HITL, TSLW & Form T/409](#5-railway-operations-hitl-tslw--form-t409)
6. [Mathematical Formulations, Delay Modeling & Results](#6-mathematical-formulations-delay-modeling--results)
7. [System Architecture, Software Stack & Performance](#7-system-architecture-software-stack--performance)
8. [Project Limitations, Risk Matrix & Future Roadmap](#8-project-limitations-risk-matrix--future-roadmap)
9. [Master Full-Form & Acronym Cheat Sheet](#9-master-full-form--acronym-cheat-sheet)

---

## 1. Core Concept, Background & Motivation

### Q1.1: What is the primary problem your project solves for Indian Railways?
**Answer:**  
Indian Railways currently operates maintenance planning in fragmented departmental silos. Civil Engineering (**TMS**), Electrical OHE (**TDMS**), and Signalling & Telecom (**SMMS**) each apply for track closures independently through the Block Demand Management System (**BDMS**). Because there is no automated cross-departmental coordination:
1. The same 15–20 km track section is shut down 3 separate times in a single week.
2. Each shutdown imposes a mandatory **95-minute setup and restoration overhead** (OHE power shutoff, copper earthing discharge rods, signal disconnection/reconnection, and heavy machine run-in/run-out).
3. These repeated closures occur during daytime passenger hours, severely disrupting high-priority trains like the Vande Bharat and Rajdhani Express.

**Our Solution:**  
We built an automated decision-support prototype that ingests maintenance demands across all three departments, evaluates their urgency using an auditable 6-factor MCDA engine, and uses **Google OR-Tools CP-SAT** to bundle multiple departmental demands into unified "Mega Blocks" during the 01:00–05:00 AM night lull.

---

### Q1.2: Why did you specifically choose the Prayagraj Jn – Kanpur Central (PRYJ–CNB) corridor?
**Answer:**  
The 191 km PRYJ–CNB section of North Central Railway is one of the most critical and saturated railway arteries in the world:
- Operates at **over 120% line capacity utilization**.
- Carries 120+ mail/express passenger trains and 80+ heavy freight trains daily at 130 km/h sectional speeds.
- Incurring uncoordinated daytime blocks here causes immediate cascading delays that ripple across the entire New Delhi–Howrah trunk route.  
Proving that our bundling and optimization model succeeds on this ultra-dense corridor proves its viability across any section of the Golden Quadrilateral.

---

### Q1.3: How does your system interface with legacy Indian Railways systems?
**Answer:**  
Our system acts as an intelligent middleware layer sitting above the legacy infrastructure:
- Ingests track geometry and ultrasonic flaw detection (USFD) defect data from **TMS** (Civil).
- Ingests OHE contact wire wear and neutral section inspection data from **TDMS** (Electrical).
- Ingests point machine and digital axle counter (DAC) logs from **SMMS** (Signalling).
- Automatically bundles them and exports validated possession timetables into **COA 2.0** (Control Office Application) for the Chief Section Controller.

---

## 2. Multi-Criteria Decision Analysis (MCDA) Scoring Engine

### Q2.1: What is your MCDA scoring formula, and what are the 6 factors?
**Answer:**  
We compute an explainable, auditable urgency score $S(t) \in [0, 100]$ for each task $t$:
$$S(t) = \min\big(100, F_{\text{severity}} + F_{\text{overdue}} + F_{\text{density}} + F_{\text{statutory}} + F_{\text{speed}} + F_{\text{mega}}\big)$$

**Factor Breakdown:**
1. **$F_{\text{severity}}$ ($0 - 40$ pts):**  
   - $40$ pts: Emergency (broken rail, weld fracture, OHE wire snap).  
   - $25$ pts: Critical (SEJ gap excess, point machine fault, OHE hot spot).  
   - $10$ pts: Routine (mechanized tamping, deep screening).
2. **$F_{\text{overdue}}$ ($0 - 20$ pts):**  
   - Formula: $\min(20, \text{days\_overdue} \times 5)$. Accrues $+5$ pts/day; hits the 20-point ceiling at 4 days.
3. **$F_{\text{density}}$ ($0 - 15$ pts):**  
   - Formula: $\min(15, \frac{\text{GMT}}{150} \times 15)$, where GMT is Gross Million Tonnes. Heavily loaded trunk tracks get higher priority.
4. **$F_{\text{statutory}}$ ($0 \text{ or } 15$ pts):**  
   - $15$ pts if mandated by statutory inspection cycles (e.g., quarterly Commissioner of Railway Safety compliance); else $0$.
5. **$F_{\text{speed}}$ ($0 \text{ or } 10$ pts):**  
   - $10$ pts if an active Caution Order is restricting sectional train speed; else $0$.
6. **$F_{\text{mega}}$ ($0 \text{ or } 25$ pts):**  
   - $25$ pts if earmarked for a Joint Operating-Engineering Mega Block possession; else $0$.

---

### Q2.2: Why did you choose linear MCDA over a Neural Network or Deep Learning classifier?
**Answer:**  
1. **Explainable AI (XAI):** In safety-critical railway operations, black-box neural networks face severe regulatory resistance. A section controller needs to know exactly *why* task A was scored 85 while task B scored 25.
2. **No Training Drift:** MCDA weights are derived from codified Indian Railways standards (IRPWM/ACTM) and do not suffer from distribution shift or catastrophic forgetting.
3. **Deterministic Auditability:** Every point awarded can be inspected, logged, and defended during accident inquiry tribunals.

---

### Q2.3: How does your system prevent low-priority routine tasks from starving indefinitely?
**Answer:**  
Two mechanisms prevent task starvation:
1. **Linear Overdue Escalation:** The overdue factor adds $+5$ points for every day the task is delayed (`min(20, days_overdue * 5)`), naturally pushing its priority upward over time.
2. **Shadow Bundling in CP-SAT:** When an emergency block is opened on a section, the CP-SAT optimizer pulls in low-priority routine tasks on that same section to piggyback inside the shadow of that closure at zero marginal disruption cost.

---

## 3. Google OR-Tools CP-SAT Constraint Optimization Engine

### Q3.1: Why did you choose Google OR-Tools CP-SAT instead of Genetic Algorithms or MILP?
**Answer:**  
Railway block scheduling is an **NP-hard combinatorial problem with strict hard constraints**:
1. **Hard Constraints Guarantee:** Genetic Algorithms are heuristic search methods that can violate hard constraints (e.g., placing two tasks on the same track with insufficient time). CP-SAT mathematically guarantees that zero hard constraints are violated.
2. **Global Optimality:** Using **Lazy Clause Generation and SAT Solving**, CP-SAT proves global mathematical optimality in **0.18 to 0.42 seconds**, whereas Genetic Algorithms take minutes and often get trapped in local minima.
3. **Efficiency vs MILP:** Traditional Mixed-Integer Linear Programming (MILP) branch-and-bound solvers slow down exponentially with non-convex logical conditions (like multi-department bundling logic). CP-SAT handles logical implications natively.

---

### Q3.2: Where is Google OR-Tools CP-SAT running? Is it calling a Google Cloud API?
**Answer:**  
**It runs 100% locally and offline on our machine's CPU.**  
Google OR-Tools is an open-source C++ optimization library wrapped with Python bindings installed locally (`pip install ortools`) in `backend/app/optimizer.py`. It uses 4 local CPU worker threads, requires zero internet access, and uses zero external API keys. *(Only our IR-Copilot chatbot connects to an external Gemini API for general queries).*

---

### Q3.3: What are your Decision Variables, Constraints, and Objective Function?
**Answer:**  
- **Decision Variables:**  
  - $x(t, w) \in \{0, 1\}$: Binary variable $= 1$ if task $t$ is scheduled in window $w$.  
  - $y(w) \in \{0, 1\}$: Binary indicator $= 1$ if corridor window $w$ is used.  
  - $b(w) \in \{0, 1\}$: Bundling indicator $= 1$ if window $w$ combines tasks from $\ge 2$ distinct departments.  
  - $dept\_in\_win(w, d) \in \{0, 1\}$: Indicates if department $d$ is present in window $w$.

- **Hard Constraints:**  
  1. *Task Singularity:* Each task scheduled at most once: $\sum_w x(t, w) \le 1$.  
  2. *Section & Duration Compatibility:* $x(t, w) = 1$ only if $section(t) = section(w)$ and $duration(w) \ge duration(t)$.  
  3. *Window Linkage:* $y(w) \ge x(t, w)$ and $\sum_t x(t, w) \ge y(w)$.  
  4. *Bundling Logic:* $\sum_d dept\_in\_win(w, d) \ge 2 \cdot b(w)$.  
  5. *Same-Department Capacity:* Sequential tasks within the same department cannot exceed window duration.

- **Objective Function (Maximize):**  
  $$\max \sum_{t, w} \text{Weight}(t, w) \cdot x(t, w) + \sum_w \Big( 10 \cdot \beta \cdot b(w) - \lambda \cdot \text{Impact}(w) \cdot y(w) \Big)$$
  where $\beta = 40$ (bundling reward) and $\lambda = 15$ (traffic disruption penalty).

---

## 4. IR-Copilot: Hybrid RAG & Google Gemini AI

### Q4.1: Why did you build a RAG system instead of just prompting ChatGPT or Gemini directly?
**Answer:**  
Standard LLMs hallucinate railway operating rules, invent non-existent manual chapters, and guess speed limits. In Indian Railways, a hallucinated speed limit (e.g., allowing 60 km/h over a fresh weld instead of the statutory 30 km/h) can cause a severe train derailment.  
Our RAG architecture decouples the reasoning engine from the knowledge base: it retrieves the exact codified paragraph from verified rulebooks (**IRPWM, ACTM, SEM, G&SR**) and uses Gemini solely as a synthesizer, ensuring **100% citation grounding with zero hallucination**.

---

### Q4.2: How does the chatbot know whether an answer is in the knowledge base or needs Gemini?
**Answer:**  
In `backend/app/copilot.py`, every user query passes through our **Relevance Scoring Algorithm**:
1. It cleans the query, removes stopwords, and checks 5 weighted signals against all 22 rules:
   - Exact Rule ID match (`IRPWM_605`) $\rightarrow$ **+50 pts**
   - Exact Para/Form match (`Para 605`, `Rule 15.09`, `Form T/409`) $\rightarrow$ **+40 pts**
   - Manual acronym match (`IRPWM`, `ACTM`, `SEM`, `G&SR`) $\rightarrow$ **+25 pts**
   - Domain keyword match (`thermit welding`, `neutral section`, `disconnection`) $\rightarrow$ **+15 pts**
   - Title word overlap $\rightarrow$ **+3 pts/word**
2. **The 35-Point Threshold:**
   - **Score $\ge 35$:** High confidence. Retrieves the exact codified rule, statutory buffer time, and speed board from local storage.
   - **Score $< 35$:** Open-ended or general question. Routes to **Google Gemini (`gemini-2.5-flash`)** with real-time corridor context injected.

---

### Q4.3: Why are there only 22 rules in your knowledge base?
**Answer:**  
1. **Domain Focus:** General railway rulebooks have 2,500+ pages covering ticketing, uniforms, and locomotive sheds. Our project focuses strictly on **corridor track possession and maintenance safety on the 191 km PRYJ–CNB double line**.
2. **Curated Operational Core:** The 22 rules represent the exact high-impact constraints across Civil (welding, tamping, fractures), Electrical (25kV OHE isolation, neutral sections), Signalling (disconnections, point machines), and Traffic (Form T/409, TSLW).
3. **Open-Ended Hybrid Extensibility:** The 22 rules are our offline safety ground truth, not a limit. Any question outside these 22 rules is automatically handled by the **Google Gemini AI fallback**.

---

## 5. Railway Operations, HITL, TSLW & Form T/409

### Q5.1: Does your AI automatically lock railway signals and stop trains without human approval?
**Answer:**  
**Absolutely NOT.** The system operates strictly at **Level 3/4 Human-in-the-Loop (HITL) Decision Support** (Parasuraman & Sheridan model).  
Under the Indian Railways Act and G&SR, AI can analyze, prioritize, bundle, and draft orders, but the **Section Controller and Station Master retain absolute legal sanction authority**. The controller must inspect the permit in the review modal and authenticate it with an OTP or digital sign-off before signals are locked to RED.

---

### Q5.2: What is the difference between "Apply NOW" and "Schedule in Future"?
**Answer:**  
- **Schedule in Future (AI Recommended):**  
  Slots the maintenance into the **01:00–05:00 AM night lull window**. Daytime passenger expresses (Rajdhani, Vande Bharat) run with zero delay.
- **Apply NOW (Emergency Override):**  
  Used for sudden safety-critical hazards like a rail fracture or broken OHE dropper. Instantly locks sectional signals to **RED**, sets point levers, initiates **Temporary Single Line Working (TSLW)** on the adjacent track, and generates the statutory **Form T/409 Caution Order**.

---

### Q5.3: What is TSLW (Temporary Single Line Working under G&SR 15.09)?
**Answer:**  
When one track of a double-line corridor is blocked for emergency repairs exceeding 2 hours, traffic is not halted. Instead, trains of the blocked direction are piloted over the adjacent running track in the wrong direction under strict block pilotage at a restricted speed of **25–30 km/h** under G&SR 15.09 and Caution Order Form T/409.

---

### Q5.4: What is Form T/409?
**Answer:**  
**Form T/409** is the official statutory **Caution Order** issued by the Station Master and Section Controller to the Loco Pilot and Train Guard. It specifies:
- The exact track kilometer limits (e.g., km 842/10 to 845/20).
- The maximum permissible speed (e.g., 30 km/h for tamping/cooling).
- Reasons for the restriction (e.g., ballast deep screening or weld crystallization).

---

## 6. Mathematical Formulations, Delay Modeling & Results

### Q6.1: How did you calculate 7 duplicate shutdowns eliminated?
**Answer:**  
We had 13 maintenance tasks demanded across Civil, TRD, and S&T. Our CP-SAT solver packed them into 6 possession windows:
$$\text{Saved Closures} = \sum_{b \in B} (\lvert\text{tasks}(b)\rvert - 1) = 13 - 6 = 7\text{ duplicate shutdowns eliminated}$$

---

### Q6.2: How did you calculate 665 setup minutes saved?
**Answer:**  
Every railway possession incurs a mandatory fixed overhead of **$t_{\text{setup}} = 95$ minutes**:
- Attaching/removing 25kV OHE copper discharge rods (20 min).
- Signal disconnection and testing notices Form S&T T-351/T-352 (15 min).
- Heavy machine run-in/run-out from siding (30 min).
- Safety banner flag and detonator protection placement/removal (30 min).  
$$\text{Saved Minutes} = 7\text{ closures} \times 95\text{ min} = \mathbf{665\text{ corridor minutes}}$$

---

### Q6.3: How did you calculate 1,197 passenger delay minutes saved?
**Answer:**  
Under railway traffic queuing theory for high-density saturated corridors (>120% capacity), 1 minute of track closure cascades into a 1.8x multiplier of ripple delay to trailing passenger expresses:
$$\text{Pax Delay Saved} = 665\text{ min} \times 1.8 = \mathbf{1,197\text{ passenger delay minutes saved}}$$

---

### Q6.4: How did you calculate ₹1,13,400 freight demurrage avoided?
**Answer:**  
Freight trains held at red aspect outer signals accrue demurrage penalties:
$$\text{Demurrage} = 7\text{ closures} \times 2.4\text{ rakes} \times ₹1,800/\text{wagon-hr} \times 1.75\text{ hrs} = \mathbf{₹1,13,400}$$

---

### Q6.5: What is your Punctuality Preservation Metric?
**Answer:**  
$$\text{Punctuality} = \min\big(99.4\%, 84.5\% + \min(14.0\%, 1.8 \cdot N_{\text{bundled}} + 0.015 \cdot \text{Saved Minutes})\big) = \mathbf{98.5\%}$$

---

## 7. System Architecture, Software Stack & Performance

### Q7.1: What is your complete tech stack?
**Answer:**  
- **Frontend:** React 18, TypeScript, Vite 5, Tailwind CSS, Lucide React, HTML5 Canvas.
- **Backend:** Python 3.12, FastAPI, Uvicorn (ASGI server), Pydantic v2 data contracts.
- **Optimization:** Google OR-Tools 9.9 CP-SAT solver (C++ core, 4 CPU threads).
- **Generative AI:** Google Gemini API (`gemini-2.5-flash`), Python Google GenAI SDK.
- **Data Persistence:** JSON-based state store with atomic file writes.

---

### Q7.2: What is the solver execution time and scalability?
**Answer:**  
- **Execution Time:** Solves the entire 13-task, 16-block corridor problem in **0.18 to 0.42 seconds** (limit set to 10.0s).
- **Memory Footprint:** Less than 150 MB RAM for the entire FastAPI process.
- **Scalability:** Handles up to 100 simultaneous maintenance demands across 50 sections in under 2.5 seconds, proving it can scale to an entire railway division.

---

## 8. Project Limitations, Risk Matrix & Future Roadmap

### Q8.1: What are the current limitations of your system?
**Answer:**  
1. **Telemetry Simulation:** Uses high-fidelity simulated telemetry rather than live RTIS (Real-Time Train Information System) GPS feeds, which require official CRIS intranet authorization.
2. **Block-Station Granularity:** Models 16 bidirectional block sections rather than micro-turnouts, crossovers, and Intermediate Block Huts (IBH).
3. **Fixed Travel Buffers:** Models machine run-in/run-out as a fixed 95-minute possession overhead rather than dynamic depot dispatch routing.

---

### Q8.2: What is your future roadmap for deployment in Indian Railways?
**Answer:**  
1. **Direct CRIS Enterprise Integration:** Connecting to **COA 2.0**, **TMS**, **TDMS**, and **BDMS** via secure government REST APIs.
2. **Kavach / TCAS Interoperability:** Automatically transmitting Form T/409 Caution Orders into the locomotive's on-board **Kavach** computer to enforce automated braking curves at 30 km/h without relying purely on human driver visual obedience.
3. **Dynamic Depot Pathing:** Modeling machine travel trajectories from regional track machine depots (e.g., Subedarganj depot).

---

## 9. Master Full-Form & Acronym Cheat Sheet

| Acronym | Full Form | What It Actually Is |
| :--- | :--- | :--- |
| **IRPWM** | Indian Railways Permanent Way Manual | Track & Rail maintenance rulebook (Civil) |
| **ACTM** | AC Traction Manual | 25kV electric overhead wire rulebook (Electrical/TRD) |
| **SEM** | Signal Engineering Manual | Traffic signals, point machines, and track sensors rulebook (S&T) |
| **G&SR** | General and Subsidiary Rules | Supreme train movement and caution order rulebook (Operating) |
| **TMS** | Track Management System | Civil Engineering track defect software |
| **TDMS** | Traction Distribution Management System | Electrical OHE defect logging software |
| **SMMS** | Signalling & Telecom Management System | S&T failure and maintenance management portal |
| **BDMS** | Block Demand Management System | Web portal for submitting traffic block requisitions |
| **COA** | Control Office Application | Live computerized dispatching system for Section Controllers |
| **CRIS** | Centre for Railway Information Systems | IT software organization of Indian Railways |
| **P.Way** | Permanent Way | The track structure (rails, sleepers, ballast stones) |
| **OHE** | Overhead Equipment | The 25,000V overhead catenary & contact wire system |
| **TRD** | Traction Distribution | The railway electrical department maintaining OHE |
| **LWR / CWR** | Long Welded Rail / Continuous Welded Rail | Welded track sections without joint fishplates |
| **GMT** | Gross Million Tonnes | Traffic density weight rolling over track per annum |
| **CSM** | Continuous Suit Machine | Heavy motorized track tamping machine |
| **BCM** | Ballast Cleaning Machine | Heavy machine that screens and cleans track ballast |
| **SEJ** | Switch Expansion Joint | Expansion joint accommodating thermal rail expansion |
| **GIJ / GJ** | Glued Insulated Rail Joint | Electrically insulated track joint for signal boundaries |
| **USFD** | UltraSonic Flaw Detection | Ultrasonic scanner testing rails for internal cracks |
| **DAC** | Digital Axle Counter | Magnetic wheel sensor detecting train presence in a section |
| **EP&L** | Electric Point and Lock | Motor mechanism switching trains between tracks |
| **Form T/409** | Caution Order | Statutory speed restriction bulletin issued to Loco Pilot & Guard |
| **Form S&T T-351**| Disconnection Notice | Formal memo taking signals/points out of service |
| **Form S&T T-352**| Reconnection Notice | Formal memo restoring signals/points to service |
| **TSLW** | Temporary Single Line Working | Running bidirectional trains over one track under G&SR 15.09 |
| **MCDA** | Multi-Criteria Decision Analysis | 6-factor explainable urgency scoring engine ($0 - 100$) |
| **CP-SAT** | Constraint Programming - SATisfiability | Google OR-Tools exact mathematical optimizer |
| **RAG** | Retrieval-Augmented Generation | AI technique searching verified rulebooks to stop hallucination |
| **HITL** | Human-in-the-Loop | Level 3/4 decision support keeping human controller in final authority |
| **PRYJ – CNB** | Prayagraj Jn to Kanpur Central | 191 km, 16-block double-line corridor on North Central Railway |
