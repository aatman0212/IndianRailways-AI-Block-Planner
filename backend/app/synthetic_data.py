"""
Realistic Indian Railways Synthetic Dataset Generator
Corridor: Prayagraj (PRYJ) - Kanpur Central (CNB) High-Density Corridor (North Central Railway)
Departments: Engineering (TMS), TRD/OHE (TDMS), Signalling (SMMS) + COA Traffic Windows
"""

import json
from datetime import datetime, timedelta
from typing import List, Dict, Any
from pathlib import Path

from backend.app.models import (
    Section,
    Department,
    Severity,
    UnifiedMaintenanceTask,
    CorridorBlockWindow,
)


def get_default_sections() -> List[Section]:
    return [
        Section(
            section_id="SEC_PRG_SFG_UP",
            division="Prayagraj (NCR)",
            name="Prayagraj Jn - Subedarganj (UP)",
            line_type="UP_MAIN",
            start_km=827.0,
            end_km=831.5,
            traffic_density_gmt=115.0,
            max_permissible_speed=110,
        ),
        Section(
            section_id="SEC_SFG_MRE_UP",
            division="Prayagraj (NCR)",
            name="Subedarganj - Manauri (UP)",
            line_type="UP_MAIN",
            start_km=831.5,
            end_km=845.2,
            traffic_density_gmt=125.0,
            max_permissible_speed=130,
        ),
        Section(
            section_id="SEC_MRE_BRE_UP",
            division="Prayagraj (NCR)",
            name="Manauri - Bharwari (UP)",
            line_type="UP_MAIN",
            start_km=845.2,
            end_km=865.8,
            traffic_density_gmt=130.0,
            max_permissible_speed=130,
        ),
        Section(
            section_id="SEC_BRE_SRO_UP",
            division="Prayagraj (NCR)",
            name="Bharwari - Sirathu (UP)",
            line_type="UP_MAIN",
            start_km=865.8,
            end_km=888.4,
            traffic_density_gmt=128.0,
            max_permissible_speed=130,
        ),
        Section(
            section_id="SEC_SRO_KGA_UP",
            division="Prayagraj (NCR)",
            name="Sirathu - Khaga (UP)",
            line_type="UP_MAIN",
            start_km=888.4,
            end_km=914.6,
            traffic_density_gmt=120.0,
            max_permissible_speed=130,
        ),
        Section(
            section_id="SEC_KGA_FTP_UP",
            division="Prayagraj (NCR)",
            name="Khaga - Fatehpur (UP)",
            line_type="UP_MAIN",
            start_km=914.6,
            end_km=945.0,
            traffic_density_gmt=135.0,
            max_permissible_speed=130,
        ),
        Section(
            section_id="SEC_FTP_BKO_UP",
            division="Prayagraj (NCR)",
            name="Fatehpur - Bindki Road (UP)",
            line_type="UP_MAIN",
            start_km=945.0,
            end_km=977.3,
            traffic_density_gmt=132.0,
            max_permissible_speed=130,
        ),
        Section(
            section_id="SEC_BKO_CNB_UP",
            division="Prayagraj (NCR)",
            name="Bindki Road - Kanpur Central (UP)",
            line_type="UP_MAIN",
            start_km=977.3,
            end_km=1018.0,
            traffic_density_gmt=140.0,
            max_permissible_speed=130,
        ),
    ]


def get_default_tasks(base_date: datetime) -> List[UnifiedMaintenanceTask]:
    d = base_date
    return [
        # --- ENGINEERING (TMS: Permanent Way) ---
        UnifiedMaintenanceTask(
            task_id="ENG_001",
            department=Department.ENGINEERING,
            source_system="TMS",
            section_id="SEC_SFG_MRE_UP",
            asset_id="RAIL_KM_838_WELD",
            title="Thermite Weld Fracture Repair",
            description="USFD flaw detector detected severe weld defect at Km 838/12. Imposed temporary 30 km/h caution order.",
            severity=Severity.EMERGENCY,
            min_duration_minutes=120,
            reported_date=(d - timedelta(days=2)).strftime("%Y-%m-%d"),
            due_date=(d + timedelta(days=1)).strftime("%Y-%m-%d"),
            days_overdue=1,
            is_statutory=False,
            requires_power_block=False,
            requires_traffic_block=True,
            speed_restriction="30 km/h",
        ),
        UnifiedMaintenanceTask(
            task_id="ENG_002",
            department=Department.ENGINEERING,
            source_system="TMS",
            section_id="SEC_MRE_BRE_UP",
            asset_id="TRACK_KM_852_TAMP",
            title="CSM Machine Track Tamping",
            description="High unevenness standard deviation recorded by OMS car. Tamping required to restore 130 km/h runnability.",
            severity=Severity.CRITICAL,
            min_duration_minutes=150,
            reported_date=(d - timedelta(days=5)).strftime("%Y-%m-%d"),
            due_date=(d + timedelta(days=2)).strftime("%Y-%m-%d"),
            days_overdue=0,
            is_statutory=True,
            requires_power_block=False,
            requires_traffic_block=True,
        ),
        UnifiedMaintenanceTask(
            task_id="ENG_003",
            department=Department.ENGINEERING,
            source_system="TMS",
            section_id="SEC_SRO_KGA_UP",
            asset_id="SWITCH_KM_902_SEJ",
            title="Switch Expansion Joint (SEJ) Replacement",
            description="Tongue rail gap exceeded tolerance limits at Km 902/4. Potential wheel climbing hazard.",
            severity=Severity.CRITICAL,
            min_duration_minutes=120,
            reported_date=(d - timedelta(days=4)).strftime("%Y-%m-%d"),
            due_date=(d + timedelta(days=1)).strftime("%Y-%m-%d"),
            days_overdue=2,
            is_statutory=False,
            requires_power_block=False,
            requires_traffic_block=True,
            speed_restriction="50 km/h",
        ),
        UnifiedMaintenanceTask(
            task_id="ENG_004",
            department=Department.ENGINEERING,
            source_system="TMS",
            section_id="SEC_FTP_BKO_UP",
            asset_id="SLEEPER_KM_960",
            title="Casual Sleeper Renewal & Fastening",
            description="Cracked PSC sleepers requiring replacement and ERC clip tensioning.",
            severity=Severity.ROUTINE,
            min_duration_minutes=90,
            reported_date=(d - timedelta(days=8)).strftime("%Y-%m-%d"),
            due_date=(d + timedelta(days=5)).strftime("%Y-%m-%d"),
            days_overdue=0,
            is_statutory=False,
            requires_power_block=False,
            requires_traffic_block=True,
        ),
        UnifiedMaintenanceTask(
            task_id="ENG_005",
            department=Department.ENGINEERING,
            source_system="TMS",
            section_id="SEC_BKO_CNB_UP",
            asset_id="DEEP_SCREEN_KM_995",
            title="BCM Ballast Deep Screening",
            description="Caked ballast causing poor track drainage and pumping joints.",
            severity=Severity.ROUTINE,
            min_duration_minutes=180,
            reported_date=(d - timedelta(days=14)).strftime("%Y-%m-%d"),
            due_date=(d + timedelta(days=7)).strftime("%Y-%m-%d"),
            days_overdue=0,
            is_statutory=True,
            requires_power_block=False,
            requires_traffic_block=True,
        ),

        # --- TRD (TDMS: Traction Distribution / OHE) ---
        UnifiedMaintenanceTask(
            task_id="TRD_001",
            department=Department.TRD,
            source_system="TDMS",
            section_id="SEC_SFG_MRE_UP",
            asset_id="OHE_MAST_839_CANTILEVER",
            title="OHE Cantilever Adjustment & Stagger Check",
            description="Contact wire stagger deviation detected at Mast 839/14. Risk of pantograph entanglement on high-speed Rajdhani rakes.",
            severity=Severity.CRITICAL,
            min_duration_minutes=90,
            reported_date=(d - timedelta(days=3)).strftime("%Y-%m-%d"),
            due_date=(d + timedelta(days=1)).strftime("%Y-%m-%d"),
            days_overdue=1,
            is_statutory=True,
            requires_power_block=True,
            requires_traffic_block=True,
        ),
        UnifiedMaintenanceTask(
            task_id="TRD_002",
            department=Department.TRD,
            source_system="TDMS",
            section_id="SEC_MRE_BRE_UP",
            asset_id="OHE_INSULATOR_KM_854",
            title="High-Voltage Insulator Washing & Thermal Scan",
            description="Severe dust/fog pollution deposit on 25kV bracket insulators. Thermo-vision scan showed hotspot.",
            severity=Severity.CRITICAL,
            min_duration_minutes=100,
            reported_date=(d - timedelta(days=4)).strftime("%Y-%m-%d"),
            due_date=(d + timedelta(days=2)).strftime("%Y-%m-%d"),
            days_overdue=0,
            is_statutory=False,
            requires_power_block=True,
            requires_traffic_block=True,
        ),
        UnifiedMaintenanceTask(
            task_id="TRD_003",
            department=Department.TRD,
            source_system="TDMS",
            section_id="SEC_SRO_KGA_UP",
            asset_id="OHE_NEUTRAL_SEC_905",
            title="PTFE Neutral Section Overhaul",
            description="Arcing horn wear at neutral section assembly Km 905. Tower wagon needed.",
            severity=Severity.EMERGENCY,
            min_duration_minutes=110,
            reported_date=(d - timedelta(days=1)).strftime("%Y-%m-%d"),
            due_date=(d + timedelta(days=1)).strftime("%Y-%m-%d"),
            days_overdue=0,
            is_statutory=True,
            requires_power_block=True,
            requires_traffic_block=True,
        ),
        UnifiedMaintenanceTask(
            task_id="TRD_004",
            department=Department.TRD,
            source_system="TDMS",
            section_id="SEC_KGA_FTP_UP",
            asset_id="OHE_DROPPER_KM_930",
            title="Current Carrying Dropper Replacement",
            description="Multiple loose droppers causing sag in contact wire profile.",
            severity=Severity.ROUTINE,
            min_duration_minutes=80,
            reported_date=(d - timedelta(days=10)).strftime("%Y-%m-%d"),
            due_date=(d + timedelta(days=6)).strftime("%Y-%m-%d"),
            days_overdue=0,
            is_statutory=False,
            requires_power_block=True,
            requires_traffic_block=True,
        ),

        # --- SIGNALLING & TELECOM (SMMS: S&T) ---
        UnifiedMaintenanceTask(
            task_id="SNT_001",
            department=Department.ST,
            source_system="SMMS",
            section_id="SEC_SFG_MRE_UP",
            asset_id="POINT_MRE_102B",
            title="Point Machine Overhaul & Detection Contact Setting",
            description="Point Machine 102B showing intermittent out-of-correspondence alarms during route setting.",
            severity=Severity.CRITICAL,
            min_duration_minutes=80,
            reported_date=(d - timedelta(days=2)).strftime("%Y-%m-%d"),
            due_date=(d + timedelta(days=1)).strftime("%Y-%m-%d"),
            days_overdue=1,
            is_statutory=True,
            requires_power_block=False,
            requires_traffic_block=True,
        ),
        UnifiedMaintenanceTask(
            task_id="SNT_002",
            department=Department.ST,
            source_system="SMMS",
            section_id="SEC_MRE_BRE_UP",
            asset_id="AXLE_COUNTER_BRE_UP",
            title="Digital Axle Counter (DAC) Sensor Recalibration",
            description="Wheel detector sensor amplitude variation flagged by diagnostic data logger.",
            severity=Severity.ROUTINE,
            min_duration_minutes=60,
            reported_date=(d - timedelta(days=6)).strftime("%Y-%m-%d"),
            due_date=(d + timedelta(days=4)).strftime("%Y-%m-%d"),
            days_overdue=0,
            is_statutory=True,
            requires_power_block=False,
            requires_traffic_block=False,
        ),
        UnifiedMaintenanceTask(
            task_id="SNT_003",
            department=Department.ST,
            source_system="SMMS",
            section_id="SEC_SRO_KGA_UP",
            asset_id="TRACK_CIRCUIT_SRO_2T",
            title="DC Track Circuit Boot-leg & Choke Replacement",
            description="Drop in ballast resistance during dew hours causing track circuit bobbing.",
            severity=Severity.CRITICAL,
            min_duration_minutes=75,
            reported_date=(d - timedelta(days=3)).strftime("%Y-%m-%d"),
            due_date=(d + timedelta(days=2)).strftime("%Y-%m-%d"),
            days_overdue=0,
            is_statutory=False,
            requires_power_block=False,
            requires_traffic_block=True,
        ),
        UnifiedMaintenanceTask(
            task_id="SNT_004",
            department=Department.ST,
            source_system="SMMS",
            section_id="SEC_BKO_CNB_UP",
            asset_id="SIGNAL_CNB_HOME_UP",
            title="LED Signal Aspect Replacement & Cable Meggering",
            description="Red aspect current leakage in electronic interlocking panel.",
            severity=Severity.EMERGENCY,
            min_duration_minutes=60,
            reported_date=(d - timedelta(days=1)).strftime("%Y-%m-%d"),
            due_date=(d + timedelta(days=1)).strftime("%Y-%m-%d"),
            days_overdue=0,
            is_statutory=True,
            requires_power_block=False,
            requires_traffic_block=True,
        ),
    ]


def get_default_windows(base_date: datetime) -> List[CorridorBlockWindow]:
    """
    Feasible traffic gap windows across the 8 sections over 3 days (tactical horizon).
    Derived from Control Office Application (COA) train timetables.
    """
    windows = []
    sections = [
        "SEC_PRG_SFG_UP",
        "SEC_SFG_MRE_UP",
        "SEC_MRE_BRE_UP",
        "SEC_BRE_SRO_UP",
        "SEC_SRO_KGA_UP",
        "SEC_KGA_FTP_UP",
        "SEC_FTP_BKO_UP",
        "SEC_BKO_CNB_UP",
    ]

    # Slot definitions per day:
    # 1. Night Traffic Lull (01:30 - 04:30) -> 180 min (Low disruption impact: 0.8)
    # 2. Midday Goods Gap (11:30 - 13:45) -> 135 min (Medium impact: 1.4)
    # 3. Afternoon Pre-Rush Gap (15:00 - 17:00) -> 120 min (High impact: 2.2)

    slot_templates = [
        ("NIGHT_LULL", 1, 30, 4, 30, 180, 0.8),
        ("MIDDAY_GOODS_GAP", 11, 30, 13, 45, 135, 1.4),
        ("AFTERNOON_GAP", 15, 0, 17, 0, 120, 2.2),
    ]

    for day_offset in range(3):
        day = base_date + timedelta(days=day_offset)
        for sec in sections:
            for slot_type, sh, sm, eh, em, duration, impact in slot_templates:
                start_dt = day.replace(hour=sh, minute=sm, second=0, microsecond=0)
                end_dt = day.replace(hour=eh, minute=em, second=0, microsecond=0)
                win_id = f"WIN_{sec}_{start_dt.strftime('%Y%m%d_%H%M')}"
                windows.append(
                    CorridorBlockWindow(
                        window_id=win_id,
                        section_id=sec,
                        start_time=start_dt.strftime("%Y-%m-%d %H:%M"),
                        end_time=end_dt.strftime("%Y-%m-%d %H:%M"),
                        duration_minutes=duration,
                        window_type=slot_type,
                        impact_score=impact,
                    )
                )

    return windows


def seed_synthetic_dataset(output_path: str = "data/synthetic_railway_data.json") -> Dict[str, Any]:
    """Generates and writes standard synthetic dataset to JSON file."""
    base_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    sections = [s.model_dump() for s in get_default_sections()]
    tasks = [t.model_dump() for t in get_default_tasks(base_date)]
    windows = [w.model_dump() for w in get_default_windows(base_date)]

    payload = {
        "metadata": {
            "division": "Prayagraj (NCR)",
            "route": "Prayagraj Jn (PRYJ) - Kanpur Central (CNB) High-Density Up Main",
            "generated_at": datetime.now().isoformat(),
            "sections_count": len(sections),
            "tasks_count": len(tasks),
            "windows_count": len(windows),
        },
        "sections": sections,
        "tasks": tasks,
        "windows": windows,
    }

    p = Path(output_path)
    p.parent.mkdir(parents=True, exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)

    return payload


if __name__ == "__main__":
    data = seed_synthetic_dataset()
    print(f"Successfully generated synthetic dataset with {len(data['sections'])} sections, {len(data['tasks'])} tasks, {len(data['windows'])} windows.")
