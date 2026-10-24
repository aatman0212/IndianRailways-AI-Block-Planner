import React, { useState } from 'react';
import { UnifiedMaintenanceTask, Department, Severity } from '../types';
import {
  ShieldAlert,
  Zap,
  Radio,
  Search,
  Filter,
  AlertTriangle,
  Layers,
  Clock,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Info,
  MapPin,
  Gauge,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface Props {
  tasks: UnifiedMaintenanceTask[];
}

const DEPT_INFO: Record<Department, { label: string; icon: React.ReactNode; color: string; badge: string }> = {
  ENGINEERING: {
    label: 'Track (Civil)',
    icon: <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />,
    color: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10',
    badge: 'Track Repair',
  },
  TRD: {
    label: 'Wire (Electrical)',
    icon: <Zap className="w-3.5 h-3.5 text-amber-400" />,
    color: 'text-amber-300 border-amber-500/30 bg-amber-500/10',
    badge: 'OHE Electric',
  },
  ST: {
    label: 'Signals & Telecom',
    icon: <Radio className="w-3.5 h-3.5 text-purple-400" />,
    color: 'text-purple-300 border-purple-500/30 bg-purple-500/10',
    badge: 'Signals',
  },
};

const SECTION_NAMES: Record<string, string> = {
  SEC_PRG_SFG: 'Prayagraj ➔ Subedarganj',
  SEC_SFG_MRE: 'Subedarganj ➔ Manauri',
  SEC_MRE_BRE: 'Manauri ➔ Bharwari',
  SEC_BRE_SRO: 'Bharwari ➔ Sirathu',
  SEC_SRO_KGA: 'Sirathu ➔ Khaga',
  SEC_KGA_FTP: 'Khaga ➔ Fatehpur',
  SEC_FTP_BKO: 'Fatehpur ➔ Bindki Road',
  SEC_BKO_CNB: 'Bindki Road ➔ Kanpur Central',
};

const formatSectionName = (secId: string) => {
  const isDown = secId.endsWith('_DN');
  const base = secId.replace('_UP', '').replace('_DN', '');
  const human = SECTION_NAMES[base] || base.replace('SEC_', '');
  return {
    name: human,
    direction: isDown ? 'DOWN' : 'UP',
  };
};

export const TaskInventory: React.FC<Props> = ({ tasks }) => {
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.task_id.toLowerCase().includes(search.toLowerCase()) ||
      t.section_id.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    const matchesDept = selectedDept === 'ALL' || t.department === selectedDept;
    const matchesSeverity = selectedSeverity === 'ALL' || t.severity === selectedSeverity;
    return matchesSearch && matchesDept && matchesSeverity;
  });

  const sortedTasks = React.useMemo(() => {
    return [...filteredTasks].sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0));
  }, [filteredTasks]);

  const deptCounts = {
    ALL: tasks.length,
    ENGINEERING: tasks.filter((t) => t.department === 'ENGINEERING').length,
    TRD: tasks.filter((t) => t.department === 'TRD').length,
    ST: tasks.filter((t) => t.department === 'ST').length,
  };

  const toggleExpand = (id: string) => {
    setExpandedTaskId(expandedTaskId === id ? null : id);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-400" />
              <span>Corridor Defect & Maintenance Inventory</span>
              <span className="text-xs font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-full">
                {tasks.length} Requests
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Repairs requested by Track, Overhead Wire, and Signal teams. Click any row to expand full AI Multi-Criteria Decision Analysis (MCDA) factors and root cause diagnostics.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search defect, station, or ID..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-medium"
          />
        </div>
      </div>

      {/* Filter Tabs (Department & Severity) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Department Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedDept('ALL')}
            className={`px-3 py-1.5 rounded-xl border font-semibold transition-all cursor-pointer ${
              selectedDept === 'ALL'
                ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            All Requests ({deptCounts.ALL})
          </button>
          <button
            onClick={() => setSelectedDept('ENGINEERING')}
            className={`px-3 py-1.5 rounded-xl border font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedDept === 'ENGINEERING'
                ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
            Track / Civil ({deptCounts.ENGINEERING})
          </button>
          <button
            onClick={() => setSelectedDept('TRD')}
            className={`px-3 py-1.5 rounded-xl border font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedDept === 'TRD'
                ? 'bg-amber-600 border-amber-500 text-white shadow-sm'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Overhead Electric ({deptCounts.TRD})
          </button>
          <button
            onClick={() => setSelectedDept('ST')}
            className={`px-3 py-1.5 rounded-xl border font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedDept === 'ST'
                ? 'bg-purple-600 border-purple-500 text-white shadow-sm'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-purple-400" />
            Signals & Points ({deptCounts.ST})
          </button>
        </div>

        {/* Severity Filter Pills */}
        <div className="flex items-center gap-1.5 self-start md:self-auto">
          <span className="text-[11px] text-slate-500 font-mono">Severity:</span>
          {['ALL', 'EMERGENCY', 'CRITICAL', 'ROUTINE'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                selectedSeverity === sev
                  ? sev === 'EMERGENCY'
                    ? 'bg-red-600 text-white'
                    : sev === 'CRITICAL'
                    ? 'bg-amber-600 text-white'
                    : sev === 'ROUTINE'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-white'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Task List Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 shadow-sm">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-mono">
            <tr>
              <th className="py-3 px-3.5">Defect ID</th>
              <th className="py-3 px-3.5">Department</th>
              <th className="py-3 px-3.5">Repair Description</th>
              <th className="py-3 px-3.5">Station Pair & Line</th>
              <th className="py-3 px-3.5 text-center">Time Needed</th>
              <th className="py-3 px-3.5 text-right">AI Priority Score</th>
              <th className="py-3 px-2 text-center w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
            {sortedTasks.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  No repair requests match your search or filter.
                </td>
              </tr>
            ) : (
              sortedTasks.map((t) => {
                const dept = DEPT_INFO[t.department];
                const isEmergency = t.severity === 'EMERGENCY';
                const isCritical = t.severity === 'CRITICAL';
                const secFormat = formatSectionName(t.section_id);
                const isExpanded = expandedTaskId === t.task_id;

                return (
                  <React.Fragment key={t.task_id}>
                    <tr
                      onClick={() => toggleExpand(t.task_id)}
                      className={`hover:bg-slate-900/80 transition-colors cursor-pointer ${
                        isExpanded ? 'bg-slate-900/90 border-l-2 border-blue-500' : ''
                      }`}
                    >
                      {/* ID */}
                      <td className="py-3 px-3.5 font-mono font-bold text-blue-400 whitespace-nowrap">
                        {t.task_id}
                      </td>

                      {/* Department Badge */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[10px] font-semibold ${dept.color}`}>
                          {dept.icon}
                          {dept.label}
                        </span>
                      </td>

                      {/* Title & Badges */}
                      <td className="py-3 px-3.5 max-w-md">
                        <div className="font-semibold text-slate-100 flex items-center gap-1.5 flex-wrap">
                          <span>{t.title}</span>
                          {isEmergency && (
                            <span className="bg-red-500/20 text-red-300 border border-red-500/30 text-[9px] px-1.5 py-0.2 rounded font-bold flex items-center gap-0.5">
                              <AlertTriangle className="w-2.5 h-2.5" /> Emergency
                            </span>
                          )}
                          {isCritical && (
                            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] px-1.5 py-0.2 rounded font-bold">
                              Urgent (48h)
                            </span>
                          )}
                          {t.is_statutory && (
                            <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[9px] px-1.5 py-0.2 rounded font-medium">
                              Statutory
                            </span>
                          )}
                          {t.speed_restriction && (
                            <span className="bg-amber-950 text-amber-300 border border-amber-700/60 text-[9px] font-mono px-1.5 py-0.2 rounded">
                              ⚠️ {t.speed_restriction}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {t.description}
                        </div>
                      </td>

                      {/* Section & Direction Badge */}
                      <td className="py-3 px-3.5 font-mono text-xs text-slate-300 whitespace-nowrap">
                        <div className="font-semibold text-slate-200">{secFormat.name}</div>
                        <div className="mt-0.5">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                              secFormat.direction === 'DOWN'
                                ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                                : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                            }`}
                          >
                            {secFormat.direction === 'DOWN' ? 'DOWN LINE' : 'UP LINE'}
                          </span>
                        </div>
                      </td>

                      {/* Time */}
                      <td className="py-3 px-3.5 text-center font-mono text-slate-300 whitespace-nowrap">
                        <span className="bg-slate-900 px-2 py-1 rounded-md border border-slate-800 text-[11px] font-bold">
                          {t.min_duration_minutes}m
                        </span>
                      </td>

                      {/* Priority Score */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-100">
                          {t.priority_score}<span className="text-slate-500 text-[10px]">/100</span>
                        </div>
                        <div className="w-20 bg-slate-800 h-1.5 rounded-full ml-auto mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              t.priority_score > 65
                                ? 'bg-red-500'
                                : t.priority_score > 40
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${t.priority_score}%` }}
                          ></div>
                        </div>
                      </td>

                      {/* Expand Chevron */}
                      <td className="py-3 px-2 text-center text-slate-500">
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-blue-400" /> : <ChevronDown className="w-4 h-4" />}
                      </td>
                    </tr>

                    {/* EXPANDABLE ACCORDION ROW: Technical Details & AI Decision Rationale */}
                    {isExpanded && (
                      <tr className="bg-slate-950 border-b border-slate-800">
                        <td colSpan={7} className="p-4 sm:p-5">
                          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-4">
                            {/* Asset Diagnostic Overview */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                                <span className="text-[10px] text-slate-500 uppercase block">Asset Reference</span>
                                <span className="font-bold text-slate-200 mt-0.5 block truncate">{t.asset_id}</span>
                              </div>
                              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                                <span className="text-[10px] text-slate-500 uppercase block">Speed Restriction</span>
                                <span className={`font-bold mt-0.5 block ${t.speed_restriction ? 'text-amber-400' : 'text-emerald-400'}`}>
                                  {t.speed_restriction || 'Normal 130 km/h'}
                                </span>
                              </div>
                              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                                <span className="text-[10px] text-slate-500 uppercase block">Statutory Status</span>
                                <span className="font-bold text-slate-200 mt-0.5 block">
                                  {t.is_statutory ? 'Mandatory Audit' : 'Routine Backlog'}
                                </span>
                              </div>
                              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                                <span className="text-[10px] text-slate-500 uppercase block">Days Overdue</span>
                                <span className={`font-bold mt-0.5 block ${t.days_overdue > 0 ? 'text-red-400' : 'text-slate-300'}`}>
                                  {t.days_overdue} days
                                </span>
                              </div>
                            </div>

                            {/* Full Description */}
                            <div>
                              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                Technical Investigation Details:
                              </div>
                              <p className="text-xs text-slate-200 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800">
                                {t.description}
                              </p>
                            </div>

                            {/* AI MCDA Priority Score Factor Breakdown */}
                            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5 uppercase tracking-wider">
                                  <Sparkles className="w-3.5 h-3.5" />
                                  AI Multi-Criteria Decision Analysis (MCDA) Factors
                                </span>
                                <span className="text-xs font-mono font-bold text-slate-200">
                                  Total Score: {t.priority_score} / 100
                                </span>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                                <div className="bg-slate-900 p-2 rounded border border-slate-800 flex items-center justify-between">
                                  <span className="text-slate-400">Safety Severity:</span>
                                  <span className="font-bold text-emerald-400">
                                    +{t.score_factors?.safety_severity ?? 0} pts
                                  </span>
                                </div>
                                <div className="bg-slate-900 p-2 rounded border border-slate-800 flex items-center justify-between">
                                  <span className="text-slate-400">Traffic Density:</span>
                                  <span className="font-bold text-blue-400">
                                    +{t.score_factors?.corridor_density ?? 0} pts
                                  </span>
                                </div>
                                <div className="bg-slate-900 p-2 rounded border border-slate-800 flex items-center justify-between">
                                  <span className="text-slate-400">Backlog Age:</span>
                                  <span className="font-bold text-amber-400">
                                    +{t.score_factors?.overdue_days ?? 0} pts
                                  </span>
                                </div>
                                <div className="bg-slate-900 p-2 rounded border border-slate-800 flex items-center justify-between">
                                  <span className="text-slate-400">Compliance:</span>
                                  <span className="font-bold text-purple-400">
                                    +{t.score_factors?.statutory_compliance ?? 0} pts
                                  </span>
                                </div>
                              </div>

                              {t.rationale && (
                                <div className="text-xs text-slate-300 italic pt-1 border-t border-slate-800/80 flex items-start gap-2">
                                  <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                                  <span>{t.rationale}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
