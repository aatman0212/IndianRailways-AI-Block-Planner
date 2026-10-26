# INDIAN RAILWAYS AI-POWERED AUTOMATIC BLOCK PLANNING SYSTEM
## Comprehensive Mathematical Formulations, Optimization Models & Operational Calculations
**Corridor:** Prayagraj Junction (PRYJ) – Kanpur Central (CNB) Trunk Route (191 km, 16 Block Sections)  
**Authors:** Aatman Satra (Roll No: C157) & Dishank Shah (Roll No: C181)  
**Institution:** Department of Computer Engineering, MPSTME, SVKM's NMIMS, Mumbai  
**Date:** Academic Year 2026–2027  

---

## TABLE OF CONTENTS
1. [Module 1: Multi-Criteria Decision Analysis (MCDA) Defect Prioritization](#module-1-multi-criteria-decision-analysis-mcda-defect-prioritization)
2. [Module 2: Google OR-Tools CP-SAT Integer Optimization Formulation](#module-2-google-or-tools-cp-sat-integer-optimization-formulation)
3. [Module 3: Executive Corridor KPIs & Macro Performance Analytics](#module-3-executive-corridor-kpis--macro-performance-analytics)
4. [Module 4: Train Queuing & Delay Propagation Model](#module-4-train-queuing--delay-propagation-model)
5. [Module 5: Interactive "What-If" Scenario Simulator Formulations](#module-5-interactive-what-if-scenario-simulator-formulations)
6. [Module 6: Comprehensive Formula Reference Table](#module-6-comprehensive-formula-reference-table)

---

## MODULE 1: Multi-Criteria Decision Analysis (MCDA) Defect Prioritization
*Source File: `backend/app/prioritization.py`*

The prioritization engine evaluates maintenance demands from Civil Engineering (Track / TMS), Electrical Traction Distribution (TRD / TDMS), and Signalling & Telecommunication (S&T / SMMS) on a transparent, auditable 100-point scale.

### 1.1 Individual Task Priority Score ($S_t$)
For any maintenance task $t \in T$:

$$S_t = \min\Big(100.0, \; \max\big(0.0, \; F_{\text{severity}} + F_{\text{overdue}} + F_{\text{density}} + F_{\text{statutory}} + F_{\text{speed}} + F_{\text{mega}}\big)\Big)$$

### 1.2 Individual Factor Mathematical Formulations

#### 1. Safety Severity Factor ($F_{\text{severity}}$)
Reflects immediate risk to safe train operation under Indian Railways Permanent Way Manual (IRPWM) and Signal Engineering Manual (SEM):

$$F_{\text{severity}} = \begin{cases} 
40.0 & \text{if Severity} = \text{EMERGENCY} \quad (\text{Weld fracture, rail breach, immediate IOM alert}) \\
25.0 & \text{if Severity} = \text{CRITICAL} \quad (\text{SEJ gap drift, OHE cantilever spark hotspot}) \\
10.0 & \text{if Severity} = \text{ROUTINE} \quad (\text{Periodic mechanized deep screening, track tamping})
\end{cases}$$

#### 2. Regulatory Overdue Backlog Age Factor ($F_{\text{overdue}}$)
Penalizes defects deferred past their statutory maintenance cycle:

$$F_{\text{overdue}} = \min\Big(20.0, \; \max(0, \text{days\_overdue}_t) \times 5.0\Big)$$
* **Increment:** $+5.0\text{ points}$ per overdue day.
* **Ceiling:** Capped at $20.0\text{ points}$ (reached at 4 days overdue).

#### 3. Corridor Traffic Density Factor ($F_{\text{density}}$)
Weights the structural wear rate based on Gross Million Tonnes (GMT/year):

$$F_{\text{density}} = \min\left(15.0, \; \frac{\text{GMT}_{\text{section}}}{150.0} \times 15.0\right)$$
* **Range:** $8.0$ to $15.0\text{ points}$ (Prayagraj–Kanpur sections vary between 115 GMT and 140 GMT).

#### 4. Statutory Maintenance Compliance Factor ($F_{\text{statutory}}$)
Enforces compliance with mandatory regulatory inspection schedules:

$$F_{\text{statutory}} = \begin{cases} 
15.0 & \text{if task is flagged as statutory mandatory inspection} \\
0.0 & \text{otherwise}
\end{cases}$$

#### 5. Active Speed Restriction Penalty Relief Factor ($F_{\text{speed}}$)
Incentivizes urgent repairs on tracks currently imposing caution orders (e.g. 30 km/h slowdowns):

$$F_{\text{speed}} = \begin{cases} 
10.0 & \text{if an active Caution Order / Speed Restriction exists} \\
0.0 & \text{otherwise}
\end{cases}$$

#### 6. Sanctioned Advance Mega Block Policy Factor ($F_{\text{mega}}$)
Provides executive directive weight for planned multi-department corridor renewals:

$$F_{\text{mega}} = \max\left(10.0, \; 85.0 - \sum F_{\text{baseline}}\right)$$
* Guarantees that official Chief Controller sanctioned mega blocks carry high executive priority (baseline $85.0/100$).

### 1.3 Cumulative Block Priority Yield ($Y_b$)
When multiple tasks $t_1, t_2, \dots, t_k$ are co-scheduled into a single possession block $b$:

$$Y_b = \sum_{t \in \text{tasks}(b)} S_t$$

* **Interpretation:** Measures total safety risk resolved per unit of corridor possession. Displayed on the dashboard as `Combined Yield: X pts (N tasks)`.

---

## MODULE 2: Google OR-Tools CP-SAT Integer Optimization Formulation
*Source File: `backend/app/optimizer.py`*

The scheduling engine formulates corridor block allocation as a Constraint Programming Satisfiability (CP-SAT) problem solved via Google OR-Tools.

### 2.1 Decision Variables
* $x_{t,w} \in \{0, 1\}$: Equals $1$ if task $t \in T$ is scheduled in window $w \in W$; $0$ otherwise.
* $y_w \in \{0, 1\}$: Equals $1$ if window $w \in W$ is activated for track possession; $0$ otherwise.
* $b_w \in \{0, 1\}$: Equals $1$ if window $w \in W$ bundles $\ge 2$ distinct departments; $0$ otherwise.
* $d_{w, \text{dept}} \in \{0, 1\}$: Equals $1$ if department $\text{dept} \in \{\text{ENG}, \text{TRD}, \text{ST}\}$ is present in window $w$.

### 2.2 Feasibility Pre-Filtering Domain
A task-window pair $(t, w)$ is feasible if and only if:

$$\text{section\_id}(t) = \text{section\_id}(w) \quad \land \quad \text{duration}(w) \ge \text{min\_duration}(t)$$

### 2.3 Hard Operational Constraints

#### Constraint 1: Uniqueness (At-Most-Once Task Execution)
Each defect demand is scheduled at most once across all available corridor windows:

$$\sum_{w \in W_{\text{feasible}}(t)} x_{t,w} \le 1 \quad \forall t \in T$$

#### Constraint 2: Window Utilization Linkage
A window is marked active ($y_w = 1$) if and only if at least one task is assigned to it:

$$\sum_{t \in T} x_{t,w} \ge y_w \quad \land \quad y_w \ge x_{t,w} \quad \forall t \in T, \; \forall w \in W$$

#### Constraint 3: Multi-Department Bundling Linkage
A department indicator $d_{w, \text{dept}}$ activates if any task from that department is assigned:

$$\sum_{t \in T_d} x_{t,w} \ge d_{w,d} \quad \land \quad d_{w,d} \ge x_{t,w} \quad \forall t \in T_d, \; \forall w \in W, \; \forall d \in D$$

Bundling variable $b_w$ is permitted to equal $1$ only if at least two distinct departments are present:

$$\sum_{d \in D} d_{w,d} \ge 2 \cdot b_w \quad \forall w \in W$$

#### Constraint 4: Same-Department Sequential Duration Capacity
Different departments work concurrently in parallel across the vertical axis (Track on rails, TRD on overhead wire, S&T on point machines). However, tasks belonging to the **same department** on the same section must be performed sequentially:

$$\sum_{t \in T_d} \text{duration}(t) \cdot x_{t,w} \le \text{duration}(w) \quad \forall d \in D, \; \forall w \in W$$

### 2.4 Multi-Objective Maximization Function

$$\max \sum_{(t,w) \in \text{Feasible}} W_{t,w} \cdot x_{t,w} \;+\; \sum_{w \in W} \big(10 \cdot \beta \cdot b_w\big) \;-\; \sum_{w \in W} \big(\lambda \cdot \text{impact}_w \cdot y_w\big)$$

Where:
* **Bundling Incentive Coefficient ($\beta$):** $\beta = 40$ ($+400\text{ pts}$ reward per bundled block).
* **Traffic Disruption Factor ($\lambda$):** $\lambda = 15$ ($150 \times \text{impact}_w$ penalty, heavily penalizing taking blocks during daytime/peak hours; night lull impact is $0.8$, daytime impact is $1.6$ to $2.2$).
* **Effective Task Weight ($W_{t,w}$):**
  $$W_{t,w} = \max\Big(10, \; \big(10 \cdot S_t\big) - \big(120 \cdot \Delta_{\text{day}}\big) + E_{\text{emergency}} + V_{\text{speed}}\Big)$$
* **Temporal Day Offset ($\Delta_{\text{day}}$):**
  $$\Delta_{\text{day}} = \max\Big(0, \; \min\big(3, \; \text{Date}(w) - \text{Date}_{\text{earliest}}\big)\Big)$$
* **Emergency Earliness Multiplier ($E_{\text{emergency}}$):**
  $$E_{\text{emergency}} = \begin{cases} 
  1500 \cdot (3 - \Delta_{\text{day}}) & \text{if Severity} = \text{EMERGENCY} \quad (\text{Day 0: } +4500\text{ pts}, \text{Day 1: } +3000\text{ pts}) \\ 
  400 \cdot (3 - \Delta_{\text{day}}) & \text{if Severity} = \text{CRITICAL} \quad (\text{Day 0: } +1200\text{ pts}, \text{Day 1: } +800\text{ pts}) \\ 
  0 & \text{otherwise} 
  \end{cases}$$
* **Speed Restriction Clearance Bonus ($V_{\text{speed}}$):**
  $$V_{\text{speed}} = \begin{cases} 
  300 \cdot (3 - \Delta_{\text{day}}) & \text{if Caution Order Active} \quad (\text{Day 0: } +900\text{ pts}) \\ 
  0 & \text{otherwise} 
  \end{cases}$$

---

## MODULE 3: Executive Corridor KPIs & Macro Performance Analytics
*Source File: `backend/app/optimizer.py` (`_calculate_analytics`)*

#### 3.1 Multi-Department Bundling Ratio ($R_{\text{bundling}}$)
Percentage of scheduled block possessions that accommodate multiple departments:

$$R_{\text{bundling}} = \left(\frac{N_{\text{bundled\_blocks}}}{N_{\text{total\_blocks}}} \times 100\right)\% \qquad \left[\text{Baseline: } \frac{4}{6} \times 100 = 66.7\%\right]$$

#### 3.2 Corridor Asset Availability Rate ($A_{\text{avail}}$)
Percentage of corridor infrastructure available for commercial traffic, weighted by defect burndown:

$$A_{\text{avail}} = \min\left(98.5\%, \; 88.0\% + \left[\frac{N_{\text{tasks\_scheduled}}}{\max(1, N_{\text{tasks\_demanded}})} \times 10.5\%\right]\right) \qquad [\text{Baseline: } 98.5\%]$$

#### 3.3 Idle Window Downtime Reduction ($I_{\text{reduction}}$)
Percentage of corridor downtime eliminated by avoiding duplicate possessions:

$$I_{\text{reduction}} = \min\Big(85.0\%, \; 45.0\% + \big(R_{\text{bundling}} \times 0.4\big)\Big) \qquad [45.0 + (66.7 \times 0.4) = 71.7\%]$$

#### 3.4 Workload Backlog Count
Unallocated maintenance demands deferred to future cycles:

$$\text{Backlog} = \max\Big(0, \; N_{\text{tasks\_demanded}} - N_{\text{tasks\_scheduled}}\Big) \qquad [\text{Baseline: } 13 - 13 = 0]$$

#### 3.5 Total Possession Hours & Corridor Disruption Impact
$$\text{Total Block Hours} = \frac{\sum_{b \in B} \text{duration}(b)}{60.0} \qquad \left[\frac{1080\text{ min}}{60} = 18.0\text{ hours}\right]$$

$$\text{Disruption Impact} = \sum_{b \in B} \big(\text{duration}(b) \times 0.01\big) \qquad [1080 \times 0.01 = 10.8\text{ pts}]$$

---

## MODULE 4: Train Queuing & Delay Propagation Model
*Source File: `backend/app/copilot.py` (`DelayPropagationModel`)*

Simulates knock-on delay propagation and queuing dynamics across the Prayagraj–Kanpur mainline.

#### 4.1 Duplicate Mainline Closures Avoided ($N_{\text{saved\_closures}}$)
Each bundled block containing $K$ tasks eliminates $K - 1$ separate mainline closures:

$$N_{\text{saved\_closures}} = \sum_{b \in B} \max\Big(0, \; |\text{tasks}(b)| - 1\Big) \qquad \left[(3-1) + (3-1) + (3-1) + (2-1) + 0 + 0 = 7\text{ Closures}\right]$$

#### 4.2 Saved Corridor Shutdown Minutes ($T_{\text{saved}}$)
Fixed setup, flagman detonator placement (G&SR 4.18), and line de-possession buffer saved:

$$T_{\text{saved}} = N_{\text{saved\_closures}} \times 95\text{ minutes} \qquad [7 \times 95 = 665\text{ Minutes}]$$

#### 4.3 Passenger Delay Minutes Saved ($D_{\text{passenger}}$)
Knock-on passenger delay averted using network ripple factor ($1.8\times$):

$$D_{\text{passenger}} = \lfloor T_{\text{saved}} \times 1.8 \rfloor \qquad [665 \times 1.8 = 1,197\text{ Passenger Minutes Saved}]$$

#### 4.4 Trains Protected from Loop-Siding Regulation

$$N_{\text{trains\_protected}} = \text{round}\big(N_{\text{saved\_closures}} \times 2.2\big) \qquad [7 \times 2.2 \approx 15\text{ Trains}]$$

#### 4.5 Freight Demurrage Avoided in INR ($C_{\text{freight}}$)
Based on standard Railway Board demurrage penalty rates ($\approx ₹1,800$/engine-hour):

$$C_{\text{freight}} = N_{\text{saved\_closures}} \times 2.4 \times 1800 \times 1.5 \qquad [7 \times 2.4 \times 1800 \times 1.5 = ₹45,360\text{ to } ₹1,13,400]$$

#### 4.6 Corridor Punctuality Preservation Index ($P_{\text{corridor}}$)

$$P_{\text{corridor}} = \min\Big(99.4\%, \; 84.5\% + \min\big(14.0\%, \; (N_{\text{bundled}} \times 1.8) + (T_{\text{saved}} \times 0.015)\big)\Big)$$

$$\text{Calculation: } 84.5\% + \min\big(14.0\%, \; (4 \times 1.8) + (665 \times 0.015)\big) = 84.5\% + 14.0\% = 98.5\%$$

#### 4.7 Co-Scheduled Efficiency Percentage

$$\text{Efficiency} = \left(\frac{T_{\text{saved}}}{T_{\text{actual\_possession}} + T_{\text{saved}}} \times 100\right)\% \qquad \left[\frac{665}{1080 + 665} \times 100 = 38.1\%\right]$$

---

## MODULE 5: Interactive "What-If" Scenario Simulator Formulations
*Source File: `frontend/src/components/WhatIfSimulator.tsx`*

Powers real-time sensitivity analysis between possession duration, freight holdovers, and passenger punctuality.

#### 5.1 Section Traffic Density Normalization Ratio ($R_{\text{density}}$)
Normalizes Gross Million Tonnes between 110 GMT and 145 GMT:

$$R_{\text{density}} = \max\left(0.1, \; \min\left(1.0, \; \frac{\text{GMT} - 110}{35}\right)\right)$$

#### 5.2 Section Length Normalization Ratio ($R_{\text{length}}$)

$$R_{\text{length}} = \max\left(0.2, \; \min\left(2.0, \; \frac{\text{Length}_{\text{km}}}{20.0}\right)\right)$$

#### 5.3 Excess Possession Duration ($\Delta T_{\text{excess}}$)

$$\text{Delay Threshold} = \begin{cases} 110\text{ min} & \text{if Freight Holdover Allowed} \\ 80\text{ min} & \text{otherwise} \end{cases}$$

$$\Delta T_{\text{excess}} = \max(0, \; T_{\text{proposed}} - \text{Delay Threshold})$$

#### 5.4 Dynamic Freight Delay Minutes ($D_{\text{freight}}$)

$$D_{\text{freight}} = \text{round}\Big(\Delta T_{\text{excess}} \times \big(0.35 + 0.45 \cdot R_{\text{density}} + 0.15 \cdot \mathbb{I}_{R_{\text{length}} > 1.2}\big)\Big)$$

#### 5.5 Dynamic Passenger Delay Minutes ($D_{\text{passenger}}$)

$$T_{\text{pax\_thresh}} = \begin{cases} 135\text{ min} & \text{if GMT} \ge 135 \\ 155\text{ min} & \text{otherwise} \end{cases}$$

$$D_{\text{passenger}} = \text{round}\Big(\max(0, T_{\text{proposed}} - T_{\text{pax\_thresh}}) \times (0.3 + 0.4 \cdot R_{\text{density}})\Big)$$

#### 5.6 Simulated Passenger Punctuality Percentage

$$P_{\text{whatif}} = \max\Big(84.5\%, \; 99.9\% - \big(D_{\text{freight}} \times 0.08 + D_{\text{passenger}} \times 0.35\big)\Big)$$

#### 5.7 Composite Track Safety Maintenance Index

$$S_{\text{safety}} = \min\Big(99.6, \; \max\big(68.0, \; 72 + \left(\frac{T_{\text{proposed}}}{180} \times 18\right) + \text{OHE}_{\text{bonus}} + 5.0 \cdot R_{\text{density}} - \text{Penalty}_{\text{rush}}\big)\Big)$$
Where:
* $\text{OHE}_{\text{bonus}} = 6.5$ pts if 25kV power isolation is coordinated.
* $\text{Penalty}_{\text{rush}} = 7.0 \cdot R_{\text{density}}$ if $T_{\text{proposed}} < 120\text{ min}$ (penalizes rushing maintenance on dense lines).

#### 5.8 Hourly Track Possession Cost & Demurrage Impact INR

$$\text{Hourly Cost (INR)} = 18000 + \text{round}(R_{\text{density}} \times 8000)$$

$$\text{Demurrage Impact (INR)} = \text{round}\left(\frac{D_{\text{freight}}}{60} \times \text{Hourly Cost}\right)$$

---

## MODULE 6: Comprehensive Formula Reference Table

| Metric / Parameter | Symbol / Variable | Mathematical Expression | Baseline Value | Units |
|---|---|---|---|---|
| **Defect Priority Score** | $S_t$ | $\min(100, \sum F_i)$ | $23.2$ to $69.0$ | Points ($0–100$) |
| **Cumulative Block Yield** | $Y_b$ | $\sum_{t \in b} S_t$ | Up to $182.5$ | Cumulative Points |
| **CP-SAT Task Weight** | $W_{t,w}$ | $10 S_t - 120 \Delta_{\text{day}} + E + V$ | Up to $6,500$ | Objective Units |
| **Bundling Incentive** | $10 \cdot \beta \cdot b_w$ | $10 \times 40 \times b_w$ | $+400$ | Objective Units |
| **Disruption Penalty** | $-\lambda \cdot \text{impact}_w \cdot y_w$ | $-150 \times \text{impact}_w \times y_w$ | $-120$ to $-330$ | Objective Units |
| **Emergency Earliness Bonus** | $E_{\text{emergency}}$ | $1500 \cdot (3 - \Delta_{\text{day}})$ | $+4500$ (Day 0) | Objective Units |
| **Bundling Ratio** | $R_{\text{bundling}}$ | $(N_{\text{bundled}} / N_{\text{total}}) \times 100$ | $66.7\%$ | Percentage |
| **Asset Availability** | $A_{\text{avail}}$ | $88.0 + (\text{Sched}/\text{Demand}) \times 10.5$ | $98.5\%$ | Percentage |
| **Idle Window Reduction** | $I_{\text{reduction}}$ | $45.0 + (R_{\text{bundling}} \times 0.4)$ | $71.7\%$ | Percentage |
| **Saved Closures** | $N_{\text{saved\_closures}}$ | $\sum (|b.\text{tasks}| - 1)$ | $7$ | Closures |
| **Saved Line Minutes** | $T_{\text{saved}}$ | $N_{\text{saved}} \times 95$ | $665$ | Minutes |
| **Saved Passenger Delays** | $D_{\text{passenger}}$ | $\lfloor T_{\text{saved}} \times 1.8 \rfloor$ | $1,197$ | Minutes |
| **Punctuality Index** | $P_{\text{corridor}}$ | $84.5 + \min(14, 1.8 N_b + 0.015 T_s)$ | $98.5\%$ | Percentage |
| **Trains Protected** | $N_{\text{trains\_protected}}$ | $\text{round}(N_{\text{saved}} \times 2.2)$ | $15$ | Trains |
| **Avoided Freight Demurrage** | $C_{\text{freight}}$ | $N_s \times 2.4 \times 1800 \times 1.5$ | $₹45,360$ | INR |
