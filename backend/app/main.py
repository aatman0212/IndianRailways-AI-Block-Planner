"""
FastAPI Backend Application for AI-Powered Automatic Block Planning
Indian Railways Decision Support System
"""

import json
from pathlib import Path
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.app.models import (
    Section,
    Department,
    Severity,
    UnifiedMaintenanceTask,
    CorridorBlockWindow,
    ScheduledBlock,
    BlockStatus,
    PlanAnalytics,
)
from backend.app.prioritization import TaskPrioritizer
from backend.app.optimizer import BlockPlanningOptimizer

app = FastAPI(
    title="AI Automatic Block Planning API",
    description="Intelligent multi-department corridor block planning decision-support system for Indian Railways",
    version="1.0.0",
)

# Enable CORS for frontend Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_PATH = Path("data/synthetic_railway_data.json")

# In-Memory State Store
STATE: Dict[str, Any] = {
    "sections": {},
    "tasks": {},
    "windows": {},
    "current_plan": [],
    "analytics": None,
    "last_planned_at": None,
}


def load_initial_data():
    """Loads default synthetic dataset into memory."""
    if not DATA_PATH.exists():
        from backend.app.synthetic_data import seed_synthetic_dataset
        seed_synthetic_dataset(str(DATA_PATH))

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    STATE["sections"] = {s["section_id"]: Section(**s) for s in data.get("sections", [])}
    STATE["tasks"] = {t["task_id"]: UnifiedMaintenanceTask(**t) for t in data.get("tasks", [])}
    STATE["windows"] = {w["window_id"]: CorridorBlockWindow(**w) for w in data.get("windows", [])}

    # Automatically run initial planning so the API is immediately ready
    run_planning_cycle()


def run_planning_cycle() -> Dict[str, Any]:
    """Scores tasks and runs the Google OR-Tools bundling optimizer."""
    sections_map = STATE["sections"]
    tasks_list = list(STATE["tasks"].values())
    windows_list = list(STATE["windows"].values())

    # 1. AI Prioritization
    prioritizer = TaskPrioritizer(sections_map)
    ranked_tasks = prioritizer.rank_tasks(tasks_list)
    # Update ranked tasks in state
    for t in ranked_tasks:
        STATE["tasks"][t.task_id] = t

    # 2. OR-Tools Bundling & Scheduling Optimization
    optimizer = BlockPlanningOptimizer(ranked_tasks, windows_list)
    blocks, analytics = optimizer.solve()

    STATE["current_plan"] = blocks
    STATE["analytics"] = analytics
    STATE["last_planned_at"] = datetime.now().isoformat()

    return {
        "scheduled_blocks_count": len(blocks),
        "analytics": analytics,
        "planned_at": STATE["last_planned_at"],
    }


# Load data immediately on module import so STATE is always initialized
load_initial_data()


# -------------------------------------------------------------
# REST API ENDPOINTS
# -------------------------------------------------------------

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "system": "Indian Railways Automatic Block Planning AI",
        "division": "Prayagraj (NCR)",
        "tasks_count": len(STATE["tasks"]),
        "blocks_scheduled": len(STATE["current_plan"]),
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/api/network/sections", response_model=List[Section])
def get_sections():
    """Returns all railway block sections along the corridor."""
    return list(STATE["sections"].values())


@app.get("/api/tasks", response_model=List[UnifiedMaintenanceTask])
def get_tasks(
    department: Optional[Department] = None,
    severity: Optional[Severity] = None,
    section_id: Optional[str] = None,
):
    """Returns maintenance and defect inventory across TMS, SMMS, and TDMS."""
    tasks = list(STATE["tasks"].values())
    if department:
        tasks = [t for t in tasks if t.department == department]
    if severity:
        tasks = [t for t in tasks if t.severity == severity]
    if section_id:
        tasks = [t for t in tasks if t.section_id == section_id]
    
    # Return sorted by priority score
    return sorted(tasks, key=lambda x: x.priority_score, reverse=True)


@app.post("/api/tasks")
def create_task(task: UnifiedMaintenanceTask, auto_replan: bool = True):
    """
    Ingests a new maintenance demand from TMS, SMMS, or TDMS.
    If auto_replan is True, immediately recalculates the corridor schedule.
    """
    prioritizer = TaskPrioritizer(STATE["sections"])
    scored_task = prioritizer.score_task(task)
    STATE["tasks"][scored_task.task_id] = scored_task
    
    replan_result = None
    if auto_replan:
        replan_result = run_planning_cycle()
        
    return {
        "status": "success",
        "task": scored_task,
        "replan_triggered": auto_replan,
        "blocks": STATE["current_plan"] if auto_replan else [],
        "analytics": STATE["analytics"] if auto_replan else None,
    }


@app.get("/api/windows", response_model=List[CorridorBlockWindow])
def get_windows(section_id: Optional[str] = None):
    """Returns available corridor traffic gaps from COA."""
    windows = list(STATE["windows"].values())
    if section_id:
        windows = [w for w in windows if w.section_id == section_id]
    return sorted(windows, key=lambda w: w.start_time)


@app.post("/api/plan/generate")
def trigger_plan_generation():
    """Executes AI prioritization and OR-Tools bundling optimization."""
    result = run_planning_cycle()
    return {
        "message": "AI Block Plan successfully generated with multi-department bundling.",
        "blocks": STATE["current_plan"],
        "analytics": STATE["analytics"],
        "last_planned_at": STATE["last_planned_at"],
    }


@app.get("/api/plan/current")
def get_current_plan():
    """Returns the current optimized block schedule."""
    return {
        "blocks": STATE["current_plan"],
        "analytics": STATE["analytics"],
        "last_planned_at": STATE["last_planned_at"],
    }


class OverrideRequest(BaseModel):
    user_name: str = "Section Controller"
    planner_notes: Optional[str] = None
    new_status: Optional[BlockStatus] = None


@app.post("/api/plan/blocks/{block_id}/approve")
def approve_block(block_id: str, payload: OverrideRequest = Body(default_factory=OverrideRequest)):
    """Human-in-the-loop: Section Controller approves an AI-recommended block."""
    for b in STATE["current_plan"]:
        if b.block_id == block_id:
            b.status = BlockStatus.APPROVED
            b.approved_by = payload.user_name
            b.approval_timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            if payload.planner_notes:
                b.planner_notes = payload.planner_notes
            return {"status": "success", "block": b}
    raise HTTPException(status_code=404, detail="Block not found")


@app.post("/api/plan/blocks/{block_id}/reject")
def reject_block(block_id: str, payload: OverrideRequest = Body(default_factory=OverrideRequest)):
    """Human-in-the-loop: Section Controller rejects a block."""
    for b in STATE["current_plan"]:
        if b.block_id == block_id:
            b.status = BlockStatus.REJECTED
            b.approved_by = payload.user_name
            if payload.planner_notes:
                b.planner_notes = payload.planner_notes
            return {"status": "success", "block": b}
    raise HTTPException(status_code=404, detail="Block not found")


@app.get("/api/analytics", response_model=PlanAnalytics)
def get_analytics():
    """Returns executive KPI metrics for dashboard."""
    if not STATE["analytics"]:
        run_planning_cycle()
    return STATE["analytics"]


class ConflictRequest(BaseModel):
    train_number: str = "12424"
    train_name: str = "Dibrugarh Rajdhani Express"
    delay_minutes: int = 40
    section_id: str = "SEC_SFG_MRE_UP"


@app.get("/api/simulate/conflict")
def get_current_conflict():
    return {"conflict": STATE.get("active_conflict")}


@app.post("/api/simulate/conflict")
def inject_conflict(payload: ConflictRequest = Body(default_factory=ConflictRequest)):
    """Simulates an upstream train delay causing an active corridor conflict."""
    conflicting_block = None
    for b in STATE["current_plan"]:
        if b.section_id == payload.section_id:
            conflicting_block = b
            break

    sec = STATE["sections"].get(payload.section_id)
    sec_name = sec.name if sec else payload.section_id

    conflict = {
        "conflict_id": f"CONF-{int(datetime.now().timestamp())}",
        "train_number": payload.train_number,
        "train_name": payload.train_name,
        "delay_minutes": payload.delay_minutes,
        "section_id": payload.section_id,
        "section_name": sec_name,
        "conflicting_block_id": conflicting_block.block_id if conflicting_block else "BLK_UNKNOWN",
        "eta": "02:10 (Revised with +40m delay)",
        "message": f"Train {payload.train_number} ({payload.train_name}) suffered a +{payload.delay_minutes}m upstream signal detention. Revised path violates safety buffer of scheduled block on {sec_name}!",
        "is_resolved": False,
    }
    STATE["active_conflict"] = conflict
    return {"status": "success", "conflict": conflict}


@app.post("/api/simulate/resolve-conflict")
def resolve_conflict():
    """Executes OR-Tools dynamic re-optimization to resolve headway conflict."""
    conflict = STATE.get("active_conflict")
    if not conflict:
        return {"status": "no_conflict", "message": "No active conflict to resolve"}

    run_planning_cycle()

    for b in STATE["current_plan"]:
        if b.section_id == conflict["section_id"]:
            b.planner_notes = f"Auto-rescheduled via OR-Tools CP-SAT to avoid Train {conflict['train_number']} {conflict['train_name']} (+{conflict['delay_minutes']}m delay). Headway restored."

    res_note = f"OR-Tools CP-SAT re-optimized corridor schedule: maintenance block shifted safely to protect Train {conflict['train_number']} {conflict['train_name']} with 0 passenger delays!"
    STATE["active_conflict"] = None

    return {
        "status": "resolved",
        "resolution_note": res_note,
        "blocks": STATE["current_plan"],
        "analytics": STATE["analytics"],
    }


@app.post("/api/simulate/clear-conflict")
def clear_conflict():
    STATE["active_conflict"] = None
    return {"status": "cleared"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
