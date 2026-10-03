export type Department = 'ENGINEERING' | 'TRD' | 'ST';
export type Severity = 'EMERGENCY' | 'CRITICAL' | 'ROUTINE';
export type BlockStatus = 'PROPOSED' | 'APPROVED' | 'REJECTED' | 'MODIFIED';

export interface Section {
  section_id: string;
  division: string;
  name: string;
  line_type: string;
  start_km: number;
  end_km: number;
  traffic_density_gmt: number;
  max_permissible_speed: number;
}

export interface UnifiedMaintenanceTask {
  task_id: string;
  department: Department;
  source_system: string;
  section_id: string;
  asset_id: string;
  title: string;
  description: string;
  severity: Severity;
  min_duration_minutes: number;
  reported_date: string;
  due_date: string;
  days_overdue: number;
  is_statutory: boolean;
  requires_power_block: boolean;
  requires_traffic_block: boolean;
  speed_restriction?: string;
  priority_score: number;
  score_factors: Record<string, number>;
  rationale: string;
}

export interface ScheduledBlock {
  block_id: string;
  section_id: string;
  window_id: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: BlockStatus;
  departments: Department[];
  is_bundled: boolean;
  task_ids: string[];
  tasks: UnifiedMaintenanceTask[];
  total_priority_value: number;
  planner_notes?: string;
  approval_timestamp?: string;
  approved_by?: string;
}

export interface PlanAnalytics {
  total_tasks_demanded: number;
  total_tasks_scheduled: number;
  backlog_count: number;
  asset_availability_pct: number;
  idle_window_reduction_pct: number;
  bundled_blocks_count: number;
  bundling_ratio_pct: number;
  total_block_hours: number;
  total_disruption_impact: number;
}

export interface TrafficConflict {
  conflict_id: string;
  train_number: string;
  train_name: string;
  delay_minutes: number;
  section_id: string;
  section_name: string;
  conflicting_block_id: string;
  eta: string;
  message: string;
  is_resolved: boolean;
  resolution_note?: string;
}
