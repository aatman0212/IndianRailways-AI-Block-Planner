"""
FastAPI Backend Application for AI-Powered Automatic Block Planning
Indian Railways Decision Support System
"""

import json
from pathlib import Path
from datetime import datetime, timedelta
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
from backend.app.copilot import RailCopilotAgent, DelayPropagationModel, RailwayRulebookRAG

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
    """Loads default synthetic dataset into memory and mirrors UP/DOWN infrastructure.
    Auto-regenerates dataset if it is stale (windows dated before today).
    """
    from backend.app.synthetic_data import seed_synthetic_dataset

    today_str = datetime.now().strftime("%Y-%m-%d")

    def _is_stale(data: dict) -> bool:
        """Return True if stored windows are all in the past (stale dataset)."""
        windows = data.get("windows", [])
        if not windows:
            return True
        # Check if ALL non-advance windows are in the past
        regular_windows = [w for w in windows if "ADVANCE" not in w.get("window_id", "")]
        if not regular_windows:
            return False
        future_windows = [w for w in regular_windows if w.get("start_time", "") >= today_str]
        return len(future_windows) == 0  # stale if no windows are today or future

    if not DATA_PATH.exists():
        seed_synthetic_dataset(str(DATA_PATH))
    else:
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            check_data = json.load(f)
        if _is_stale(check_data):
            print(f"[INFO] Synthetic data is stale (no windows >= {today_str}). Regenerating fresh dataset...")
            seed_synthetic_dataset(str(DATA_PATH))

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    # 1. Load sections and register both UP Main and DOWN Main sections
    sections: Dict[str, Section] = {}
    for s in data.get("sections", []):
        sec = Section(**s)
        sections[sec.section_id] = sec
        # Create corresponding DOWN section if not already present
        if sec.section_id.endswith("_UP"):
            dn_id = sec.section_id.replace("_UP", "_DN")
            dn_name = sec.name.replace("(UP)", "(DOWN)").replace("UP", "DOWN")
            if dn_id not in sections:
                sections[dn_id] = Section(
                    section_id=dn_id,
                    division=sec.division,
                    name=dn_name,
                    line_type="DN_MAIN",
                    start_km=sec.start_km,
                    end_km=sec.end_km,
                    traffic_density_gmt=sec.traffic_density_gmt,
                    max_permissible_speed=sec.max_permissible_speed,
                )
    STATE["sections"] = sections

    # 2. Load maintenance tasks
    STATE["tasks"] = {t["task_id"]: UnifiedMaintenanceTask(**t) for t in data.get("tasks", [])}

    # 3. Load windows and mirror available traffic gap windows for DOWN Main
    windows: Dict[str, CorridorBlockWindow] = {}
    for w in data.get("windows", []):
        win = CorridorBlockWindow(**w)
        windows[win.window_id] = win
        if win.section_id.endswith("_UP"):
            dn_win_id = win.window_id.replace("_UP", "_DN")
            dn_sec_id = win.section_id.replace("_UP", "_DN")
            if dn_win_id not in windows:
                windows[dn_win_id] = CorridorBlockWindow(
                    window_id=dn_win_id,
                    section_id=dn_sec_id,
                    start_time=win.start_time,
                    end_time=win.end_time,
                    duration_minutes=win.duration_minutes,
                    window_type=win.window_type,
                    impact_score=win.impact_score,
                )
    STATE["windows"] = windows

    # Automatically run initial planning so the API is immediately ready
    run_planning_cycle()


def save_state_to_disk():
    """Persists current state tasks and custom windows to disk so user-added defects and scheduled blocks survive server reloads."""
    try:
        if DATA_PATH.exists():
            with open(DATA_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
            data["tasks"] = [t.model_dump() for t in STATE["tasks"].values()]
            data["windows"] = [w.model_dump() for w in STATE["windows"].values()]
            with open(DATA_PATH, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Warning: Failed to save state to disk: {e}")


def run_planning_cycle() -> Dict[str, Any]:
    """Scores tasks and runs the Google OR-Tools bundling optimizer while preserving approved and advance blocks."""
    sections_map = STATE["sections"]
    tasks_list = list(STATE["tasks"].values())
    windows_list = list(STATE["windows"].values())

    # 1. AI Prioritization
    prioritizer = TaskPrioritizer(sections_map)
    ranked_tasks = prioritizer.rank_tasks(tasks_list)
    # Update ranked tasks in state
    for t in ranked_tasks:
        STATE["tasks"][t.task_id] = t

    # 2. Identify committed/approved blocks that MUST NOT be discarded by the optimizer
    existing_plan = STATE.get("current_plan", [])
    committed_blocks: List[ScheduledBlock] = [
        b for b in existing_plan
        if b.status == BlockStatus.APPROVED or "MEGA_BLOCK" in b.block_id or "ADVANCE" in b.window_id
    ]

    committed_task_ids = set()
    committed_window_ids = set()
    for b in committed_blocks:
        committed_task_ids.update(b.task_ids)
        committed_window_ids.add(b.window_id)

    # 3. Tasks and windows remaining for unconstrained routine optimization
    unallocated_tasks = [t for t in ranked_tasks if t.task_id not in committed_task_ids]
    available_windows = [w for w in windows_list if w.window_id not in committed_window_ids]

    # 4. OR-Tools Bundling & Scheduling Optimization on remaining workload
    optimizer = BlockPlanningOptimizer(unallocated_tasks, available_windows)
    new_blocks, _ = optimizer.solve()

    # 5. Merge committed approved blocks with newly optimized routine blocks
    merged_blocks = committed_blocks + new_blocks
    merged_blocks.sort(
        key=lambda b: (
            0 if any(t.severity == Severity.EMERGENCY for t in b.tasks) else 1,
            b.start_time,
        )
    )

    # 6. Recompute comprehensive analytics across the unified plan
    full_analytics = optimizer._calculate_analytics(merged_blocks, ranked_tasks)

    STATE["current_plan"] = merged_blocks
    STATE["analytics"] = full_analytics
    STATE["last_planned_at"] = datetime.now().isoformat()
    save_state_to_disk()

    return {
        "scheduled_blocks_count": len(merged_blocks),
        "analytics": full_analytics,
        "planned_at": STATE["last_planned_at"],
    }


# Load data immediately on module import so STATE is always initialized
load_initial_data()


# -------------------------------------------------------------
# REST API ENDPOINTS
# -------------------------------------------------------------

@app.post("/api/plan/reset")
def reset_plan():
    """Resets all blocks and state back to a completely clean slate with 0 approved blocks."""
    from backend.app.synthetic_data import seed_synthetic_dataset
    if DATA_PATH.exists():
        DATA_PATH.unlink()
    seed_synthetic_dataset(str(DATA_PATH))
    STATE["current_plan"] = []
    load_initial_data()
    return {
        "status": "success",
        "message": "Corridor plan successfully reset to clean slate.",
        "blocks": STATE["current_plan"],
        "analytics": STATE["analytics"],
    }


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
        
    save_state_to_disk()
        
    return {
        "status": "success",
        "task": scored_task,
        "replan_triggered": auto_replan,
        "blocks": STATE["current_plan"] if auto_replan else [],
        "analytics": STATE["analytics"] if auto_replan else None,
        "tasks": list(STATE["tasks"].values()),
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
    save_state_to_disk()
    return {
        "message": "AI Block Plan successfully generated with multi-department bundling.",
        "blocks": STATE["current_plan"],
        "analytics": STATE["analytics"],
        "tasks": list(STATE["tasks"].values()),
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
    execution_timing: Optional[str] = "SCHEDULED"  # "NOW", "SCHEDULED", or "CUSTOM"
    custom_start_time: Optional[str] = None
    custom_end_time: Optional[str] = None


@app.post("/api/plan/blocks/{block_id}/approve")
def approve_block(block_id: str, payload: OverrideRequest = Body(default_factory=OverrideRequest)):
    """Human-in-the-loop: Section Controller approves an AI-recommended block with immediate or scheduled timing."""
    for b in STATE["current_plan"]:
        if b.block_id == block_id:
            b.status = BlockStatus.APPROVED
            b.approved_by = payload.user_name
            b.approval_timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            # Handle execution timing: NOW vs SCHEDULED vs CUSTOM
            if payload.execution_timing == "NOW":
                now_dt = datetime.now()
                end_dt = now_dt + timedelta(minutes=b.duration_minutes)
                b.start_time = now_dt.strftime("%Y-%m-%d %H:%M")
                b.end_time = end_dt.strftime("%Y-%m-%d %H:%M")
                timing_note = f"[IMMEDIATE POSSESSION] Block applied NOW from {b.start_time} to {b.end_time} IST."
            elif payload.execution_timing == "CUSTOM" and payload.custom_start_time:
                b.start_time = payload.custom_start_time
                if payload.custom_end_time:
                    b.end_time = payload.custom_end_time
                else:
                    try:
                        s_dt = datetime.strptime(b.start_time, "%Y-%m-%d %H:%M")
                        b.end_time = (s_dt + timedelta(minutes=b.duration_minutes)).strftime("%Y-%m-%d %H:%M")
                    except Exception:
                        pass
                timing_note = f"[FUTURE SLOT] Sanctioned for custom window {b.start_time} to {b.end_time} IST."
            else:
                timing_note = f"[SCHEDULED SLOT] Sanctioned for planned window {b.start_time} to {b.end_time} IST."

            if payload.planner_notes:
                b.planner_notes = f"{timing_note} {payload.planner_notes}"
            else:
                b.planner_notes = timing_note

            save_state_to_disk()
            return {
                "status": "success",
                "block": b,
                "message": f"Block permit SANCTIONED ({payload.execution_timing}): Section {b.section_id} scheduled for track possession from {b.start_time} to {b.end_time} IST ({b.duration_minutes} mins). Caution orders issued.",
                "blocked_window": {
                    "section_id": b.section_id,
                    "start_time": b.start_time,
                    "end_time": b.end_time,
                    "duration_minutes": b.duration_minutes,
                    "approved_by": b.approved_by,
                    "sanction_timestamp": b.approval_timestamp,
                    "timing_mode": payload.execution_timing,
                },
            }
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
            save_state_to_disk()
            return {"status": "success", "block": b}
    raise HTTPException(status_code=404, detail="Block not found")


class FutureBlockRequest(BaseModel):
    section_id: str
    start_time: str
    end_time: str
    duration_minutes: int
    block_type: str = "MEGA_BLOCK"
    departments: List[Department] = [Department.ENGINEERING, Department.TRD]
    planner_notes: Optional[str] = None
    pull_pending_tasks: bool = True
    approved_by: str = "Chief Controller (Planning)"


@app.post("/api/plan/blocks/schedule-future")
def schedule_future_block(payload: FutureBlockRequest):
    """
    Schedules an advance Mega Block or planned corridor possession for a future date/time.
    Automatically assigns matching pending tasks from the backlog if requested.
    Strictly validates that block date and start time are NOT in the past.
    """
    now = datetime.now()

    # 0. Strict validation: Ensure block date and start time are NOT in the past
    try:
        start_dt = datetime.strptime(payload.start_time.strip(), "%Y-%m-%d %H:%M")
    except ValueError:
        try:
            start_dt = datetime.fromisoformat(payload.start_time.strip())
        except Exception:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid date/time format: '{payload.start_time}'. Expected 'YYYY-MM-DD HH:MM'."
            )

    # Disallow times that are in the past (with 3-minute grace period for network latency)
    if start_dt < now - timedelta(minutes=3):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot schedule block possession in the past ({payload.start_time}). Possession date and time must be today or future (current IST: {now.strftime('%Y-%m-%d %H:%M')})."
        )

    # Validate end time (handle midnight crossing)
    try:
        end_dt = datetime.strptime(payload.end_time.strip(), "%Y-%m-%d %H:%M")
    except ValueError:
        try:
            end_dt = datetime.fromisoformat(payload.end_time.strip())
        except Exception:
            end_dt = start_dt + timedelta(minutes=payload.duration_minutes)

    if end_dt <= start_dt:
        end_dt = start_dt + timedelta(minutes=payload.duration_minutes)
        payload.end_time = end_dt.strftime("%Y-%m-%d %H:%M")

    now_str = now.strftime("%Y%m%d_%H%M%S")
    block_id = f"BLK_{payload.block_type}_{payload.section_id}_{now_str}"
    window_id = f"WIN_ADVANCE_{payload.section_id}_{now_str}"

    # 1. Register this custom window in STATE["windows"]
    custom_window = CorridorBlockWindow(
        window_id=window_id,
        section_id=payload.section_id,
        start_time=payload.start_time,
        end_time=payload.end_time,
        duration_minutes=payload.duration_minutes,
        window_type=payload.block_type,
        impact_score=0.9 if ("01:" in payload.start_time or "02:" in payload.start_time) else 1.5,
    )
    STATE["windows"][window_id] = custom_window

    # 2. Gather tasks
    assigned_tasks: List[UnifiedMaintenanceTask] = []
    task_ids: List[str] = []
    total_priority = 0.0

    if payload.pull_pending_tasks:
        for task in STATE["tasks"].values():
            if task.section_id == payload.section_id and task.department in payload.departments:
                if task.task_id not in task_ids:
                    assigned_tasks.append(task)
                    task_ids.append(task.task_id)
                    total_priority += task.priority_score

    # If no existing tasks in backlog, generate an official planned mega block job
    if not assigned_tasks:
        primary_dept = payload.departments[0] if payload.departments else Department.ENGINEERING
        rep_task = UnifiedMaintenanceTask(
            task_id=f"TASK_{payload.block_type}_{now_str[-4:]}",
            department=primary_dept,
            source_system="TMS" if primary_dept == Department.ENGINEERING else "TDMS" if primary_dept == Department.TRD else "SMMS",
            section_id=payload.section_id,
            asset_id=f"CORRIDOR_{payload.section_id}_KM_POST",
            title=f"Scheduled {payload.block_type.replace('_', ' ').title()}: Corridor Renewal",
            description=payload.planner_notes or f"Advance corridor possession reserved for {payload.duration_minutes}m multi-department work.",
            severity=Severity.CRITICAL,
            min_duration_minutes=payload.duration_minutes,
            reported_date=payload.start_time.split(" ")[0] if " " in payload.start_time else datetime.now().strftime("%Y-%m-%d"),
            due_date=payload.end_time.split(" ")[0] if " " in payload.end_time else datetime.now().strftime("%Y-%m-%d"),
            days_overdue=0,
            is_statutory=True,
            requires_power_block=Department.TRD in payload.departments,
            requires_traffic_block=True,
            priority_score=85.0,
            score_factors={"planned_mega_block": 85.0},
            rationale=f"Advance Mega Block scheduled and approved by {payload.approved_by}.",
        )
        STATE["tasks"][rep_task.task_id] = rep_task
        assigned_tasks.append(rep_task)
        task_ids.append(rep_task.task_id)
        total_priority = rep_task.priority_score

    # 3. Create the ScheduledBlock
    new_block = ScheduledBlock(
        block_id=block_id,
        section_id=payload.section_id,
        window_id=window_id,
        start_time=payload.start_time,
        end_time=payload.end_time,
        duration_minutes=payload.duration_minutes,
        status=BlockStatus.APPROVED,
        departments=payload.departments,
        is_bundled=len(payload.departments) >= 2,
        task_ids=task_ids,
        tasks=assigned_tasks,
        total_priority_value=total_priority,
        planner_notes=payload.planner_notes or f"Advance Mega Block sanctioned by {payload.approved_by}.",
        approval_timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        approved_by=payload.approved_by,
    )

    # 4. Prepend to current plan
    STATE["current_plan"] = [new_block] + [b for b in STATE["current_plan"] if b.block_id != block_id]

    # 5. Recompute analytics
    optimizer = BlockPlanningOptimizer(list(STATE["tasks"].values()), list(STATE["windows"].values()))
    STATE["analytics"] = optimizer._calculate_analytics(STATE["current_plan"], list(STATE["tasks"].values()))
    save_state_to_disk()

    return {
        "status": "success",
        "message": f"Advance Mega Block successfully scheduled on {payload.section_id} ({payload.start_time} - {payload.end_time}).",
        "block": new_block,
        "blocks": STATE["current_plan"],
        "analytics": STATE["analytics"],
    }


@app.get("/api/analytics", response_model=PlanAnalytics)
def get_analytics():
    """Returns executive KPI metrics for dashboard."""
    if not STATE["analytics"]:
        run_planning_cycle()
    return STATE["analytics"]


# -------------------------------------------------------------
# AI CONTROLLER COPILOT & RULEBOOK RAG ENDPOINTS
# -------------------------------------------------------------

class CopilotChatRequest(BaseModel):
    message: str


@app.post("/api/copilot/chat")
def copilot_chat(payload: CopilotChatRequest):
    """
    Autonomous AI Controller Copilot with RAG over Railway Manuals
    and dynamic constraint re-planning.
    """
    agent = RailCopilotAgent(STATE)
    result = agent.process_message(payload.message)
    delay_impact = DelayPropagationModel.calculate_impact(
        STATE["current_plan"],
        len(STATE["tasks"]),
        list(STATE["tasks"].values()),
    )
    return {
        "reply": result["reply"],
        "action_type": result["action_type"],
        "tools_executed": result["tools_executed"],
        "blocks": STATE["current_plan"],
        "analytics": STATE["analytics"],
        "delay_impact": delay_impact,
        "timestamp": result["timestamp"],
    }


@app.get("/api/copilot/delay-impact")
def get_copilot_delay_impact():
    """Returns delay propagation savings & punctuality preservation metrics."""
    return DelayPropagationModel.calculate_impact(
        STATE["current_plan"],
        len(STATE["tasks"]),
        list(STATE["tasks"].values()),
    )


@app.get("/api/copilot/memo/{block_id}")
def get_block_memo(block_id: str):
    """Generates official Indian Railways Caution Order & Safety Checklist with cited rules."""
    for b in STATE["current_plan"]:
        if b.block_id == block_id:
            section = STATE["sections"].get(b.section_id)
            return RailwayRulebookRAG.generate_caution_order_draft(b, section)
    raise HTTPException(status_code=404, detail="Block not found")


class GeminiKeyPayload(BaseModel):
    gemini_api_key: str


@app.get("/api/copilot/gemini-status")
def get_gemini_status():
    """Checks whether Google Gemini API is configured for advanced railway Q&A."""
    from backend.app.copilot import get_gemini_api_key
    key = get_gemini_api_key()
    return {
        "configured": bool(key),
        "key_preview": f"AIza...{key[-4:]}" if key and len(key) > 8 else None,
        "models": ["gemini-2.5-flash", "gemini-1.5-flash"],
        "status": "active" if key else "unconfigured",
    }


@app.post("/api/copilot/gemini-key")
def update_gemini_key(payload: GeminiKeyPayload):
    """Registers and activates Google Gemini API key for IR-Copilot."""
    from backend.app.copilot import save_gemini_api_key
    key = payload.gemini_api_key.strip()
    if not key:
        raise HTTPException(status_code=400, detail="API Key cannot be blank")
    
    success = save_gemini_api_key(key)
    return {
        "status": "success" if success else "error",
        "configured": True,
        "message": "Google Gemini API key registered and activated for IR-Copilot.",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
