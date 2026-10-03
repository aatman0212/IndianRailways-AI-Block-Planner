"""
AI-Powered Automatic Block Planning — Core Domain Models
Covers Indian Railways infrastructure (Track/Engineering, TRD/OHE, Signalling/S&T)
and traffic window management (COA).
"""

from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class Department(str, Enum):
    ENGINEERING = "ENGINEERING"  # Track / Permanent Way (TMS)
    TRD = "TRD"                  # Traction Distribution / OHE (TDMS)
    ST = "ST"                    # Signalling & Telecommunication (SMMS)


class Severity(str, Enum):
    EMERGENCY = "EMERGENCY"  # Immediate or IOM (speed restriction/safety threat)
    CRITICAL = "CRITICAL"    # Due within 48-72h or statutory deadline
    ROUTINE = "ROUTINE"      # Planned periodic maintenance


class BlockStatus(str, Enum):
    PROPOSED = "PROPOSED"    # AI-generated recommendation
    APPROVED = "APPROVED"    # Confirmed by Section Controller / Planner
    REJECTED = "REJECTED"    # Denied due to operational priorities
    MODIFIED = "MODIFIED"    # Manually rescheduled by planner


class Section(BaseModel):
    """Corridor Block Section in an Indian Railways Division."""
    section_id: str = Field(..., description="Unique Section ID, e.g. SEC_PRG_CNB_01")
    division: str = Field("Prayagraj", description="Railway Division")
    name: str = Field(..., description="Section Name, e.g. Prayagraj - Fatehpur")
    line_type: str = Field("UP_MAIN", description="UP_MAIN, DN_MAIN, or SINGLE")
    start_km: float = Field(..., description="Start kilometer post")
    end_km: float = Field(..., description="End kilometer post")
    traffic_density_gmt: float = Field(..., description="Gross Million Tonnes/year (e.g. 80-120 GMT on high-density routes)")
    max_permissible_speed: int = Field(130, description="Max speed in km/h")


class UnifiedMaintenanceTask(BaseModel):
    """
    Normalized data contract combining maintenance/defect demands from
    TMS (Track), SMMS (Signalling), and TDMS (Traction Distribution).
    """
    task_id: str
    department: Department
    source_system: str = Field(..., description="TMS, SMMS, or TDMS")
    section_id: str
    asset_id: str
    title: str
    description: str
    severity: Severity
    min_duration_minutes: int = Field(..., description="Estimated time required for work")
    reported_date: str
    due_date: str
    days_overdue: int = 0
    is_statutory: bool = False
    requires_power_block: bool = False   # True for TRD or work near OHE
    requires_traffic_block: bool = True  # Halts or routes trains away from this line
    speed_restriction: Optional[str] = None  # e.g. "30 kmph caution order"
    
    # AI Enrichment
    priority_score: float = 0.0          # Computed (0.0 to 100.0)
    score_factors: Dict[str, float] = {} # Breakdown for explainability
    rationale: str = ""                  # Human-readable justification


class CorridorBlockWindow(BaseModel):
    """
    Feasible corridor block window derived from COA (Control Office Application)
    representing traffic gaps between passenger and scheduled freight trains.
    """
    window_id: str
    section_id: str
    start_time: str                      # ISO format string or YYYY-MM-DD HH:MM
    end_time: str
    duration_minutes: int
    window_type: str = "SCHEDULED_GAP"   # NIGHT_LULL, SCHEDULED_GAP, FREIGHT_SLOT
    impact_score: float = 1.0            # Penalty weight if passenger train delays occur


class ScheduledBlock(BaseModel):
    """
    AI-optimized maintenance block. May co-schedule / bundle multiple
    department tasks (Engineering + TRD + S&T) into a single corridor possession.
    """
    block_id: str
    section_id: str
    window_id: str
    start_time: str
    end_time: str
    duration_minutes: int
    status: BlockStatus = BlockStatus.PROPOSED
    departments: List[Department] = []
    is_bundled: bool = False             # True if 2 or more departments share this block
    task_ids: List[str] = []
    tasks: List[UnifiedMaintenanceTask] = []
    total_priority_value: float = 0.0
    planner_notes: Optional[str] = None
    approval_timestamp: Optional[str] = None
    approved_by: Optional[str] = None


class PlanAnalytics(BaseModel):
    """Key Performance Indicators (KPIs) for the generated block schedule."""
    total_tasks_demanded: int
    total_tasks_scheduled: int
    backlog_count: int
    asset_availability_pct: float         # % uptime achieved
    idle_window_reduction_pct: float      # % reduction in unused granted block time
    bundled_blocks_count: int             # Multi-department shared blocks
    bundling_ratio_pct: float             # Bundled blocks / total blocks
    total_block_hours: float
    total_disruption_impact: float
