"""
AI Prioritization & Explainability Engine for Railway Maintenance Tasks
Implements transparent Multi-Criteria Decision Analysis (MCDA) scoring
and produces plain-English decision rationales for Railway Section Controllers.
"""

from typing import List, Dict
from backend.app.models import UnifiedMaintenanceTask, Severity, Section


class TaskPrioritizer:
    """
    Evaluates and scores maintenance demands using a transparent,
    auditable multi-criteria scoring algorithm.
    """

    # Criteria weights (Total max points = 100.0)
    SEVERITY_WEIGHTS = {
        Severity.EMERGENCY: 40.0,
        Severity.CRITICAL: 25.0,
        Severity.ROUTINE: 10.0,
    }

    OVERDUE_PER_DAY_WEIGHT = 5.0
    OVERDUE_MAX_POINTS = 20.0

    TRAFFIC_DENSITY_MAX_POINTS = 15.0  # Normalized against 150 GMT max
    STATUTORY_POINTS = 15.0
    SPEED_RESTRICTION_POINTS = 10.0

    def __init__(self, sections_by_id: Dict[str, Section]):
        self.sections = sections_by_id

    def score_task(self, task: UnifiedMaintenanceTask) -> UnifiedMaintenanceTask:
        """Computes priority score (0.0 - 100.0) and generates explanation."""
        factors: Dict[str, float] = {}

        # 1. Safety Severity Score
        severity_score = self.SEVERITY_WEIGHTS.get(task.severity, 10.0)
        factors["safety_severity"] = severity_score

        # 2. Overdue Duration Score
        overdue_days = max(0, task.days_overdue)
        overdue_score = min(self.OVERDUE_MAX_POINTS, overdue_days * self.OVERDUE_PER_DAY_WEIGHT)
        factors["overdue_days"] = overdue_score

        # 3. Corridor Traffic Density Score
        section = self.sections.get(task.section_id)
        if section:
            # Scale GMT (e.g. 100 GMT -> ~10 pts, 140 GMT -> ~14 pts)
            density_score = min(self.TRAFFIC_DENSITY_MAX_POINTS, (section.traffic_density_gmt / 150.0) * self.TRAFFIC_DENSITY_MAX_POINTS)
        else:
            density_score = 8.0
        factors["corridor_density"] = round(density_score, 1)

        # 4. Statutory / Mandatory Maintenance Score
        statutory_score = self.STATUTORY_POINTS if task.is_statutory else 0.0
        factors["statutory_compliance"] = statutory_score

        # 5. Active Speed Restriction Penalty Score
        speed_penalty_score = self.SPEED_RESTRICTION_POINTS if task.speed_restriction else 0.0
        factors["speed_restriction_penalty"] = speed_penalty_score

        # Total Raw Score
        raw_score = sum(factors.values())
        final_score = min(100.0, max(0.0, round(raw_score, 1)))

        task.priority_score = final_score
        task.score_factors = factors
        task.rationale = self._generate_rationale(task, factors, final_score)

        return task

    def _generate_rationale(self, task: UnifiedMaintenanceTask, factors: Dict[str, float], final_score: float) -> str:
        """Builds a human-readable justification for controllers."""
        reasons = []

        if task.severity == Severity.EMERGENCY:
            reasons.append("immediate safety risk (Emergency IOM)")
        elif task.severity == Severity.CRITICAL:
            reasons.append("critical asset condition")

        if task.speed_restriction:
            reasons.append(f"active caution order imposing {task.speed_restriction} delay")

        if task.days_overdue > 0:
            reasons.append(f"{task.days_overdue} days past regulatory due date")

        if task.is_statutory:
            reasons.append("mandatory statutory inspection cycle")

        sec_name = self.sections[task.section_id].name if task.section_id in self.sections else task.section_id
        reasons.append(f"located on high-density line ({sec_name})")

        return f"Priority {final_score}/100: Driven by {', '.join(reasons)}."

    def rank_tasks(self, tasks: List[UnifiedMaintenanceTask]) -> List[UnifiedMaintenanceTask]:
        """Scores all tasks and returns them sorted in descending priority order."""
        scored = [self.score_task(t) for t in tasks]
        return sorted(scored, key=lambda x: x.priority_score, reverse=True)
