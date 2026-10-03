import React, { useState } from 'react';
import { UnifiedMaintenanceTask, Department, Severity } from '../types';
import { ShieldAlert, Zap, Radio, Search, Filter, AlertTriangle } from 'lucide-react';

interface Props {
  tasks: UnifiedMaintenanceTask[];
}

const DEPT_INFO: Record<Department, { label: string; icon: React.ReactNode; color: string }> = {
  ENGINEERING: { label: 'Engineering (TMS)', icon: <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  TRD: { label: 'TRD (TDMS)', icon: <Zap className="w-3.5 h-3.5 text-amber-400" />, color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  ST: { label: 'S&T (SMMS)', icon: <Radio className="w-3.5 h-3.5 text-purple-400" />, color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
};

export const TaskInventory: React.FC<Props> = ({ tasks }) => {
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.task_id.toLowerCase().includes(search.toLowerCase()) ||
      t.section_id.toLowerCase().includes(search.toLowerCase());
    const matchesDept = selectedDept === 'ALL' || t.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xl shadow-black/30">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            Integrated Maintenance Demand Inventory
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Normalized defect feed from Track Management System (TMS), Signalling (SMMS), and Traction Distribution (TDMS).
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search defect or section..."
              className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500"
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Departments</option>
            <option value="ENGINEERING">Engineering (P.Way)</option>
            <option value="TRD">TRD (OHE)</option>
            <option value="ST">S&T (Signalling)</option>
          </select>
        </div>
      </div>

      {/* Task List Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
            <tr>
              <th className="py-2.5 px-3">Task ID</th>
              <th className="py-2.5 px-3">Dept / Source</th>
              <th className="py-2.5 px-3">Title & Asset</th>
              <th className="py-2.5 px-3">Section</th>
              <th className="py-2.5 px-3">Duration</th>
              <th className="py-2.5 px-3 text-right">AI Priority</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredTasks.map((t) => {
              const dept = DEPT_INFO[t.department];
              const isEmergency = t.severity === 'EMERGENCY';

              return (
                <tr key={t.task_id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-sky-400">
                    {t.task_id}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-medium ${dept.color}`}>
                      {dept.icon}
                      {dept.label}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                      {t.title}
                      {isEmergency && (
                        <span className="bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[9px] px-1 rounded font-bold">
                          IOM EMERGENCY
                        </span>
                      )}
                      {t.is_statutory && (
                        <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[9px] px-1 rounded font-medium">
                          STATUTORY
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">Asset: {t.asset_id}</div>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                    {t.section_id.replace('SEC_', '')}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-300">
                    {t.min_duration_minutes} mins
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="font-mono font-bold text-slate-100">
                      {t.priority_score}<span className="text-slate-500 text-[10px]">/100</span>
                    </div>
                    <div className="w-16 bg-slate-800 h-1.5 rounded-full ml-auto mt-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          t.priority_score > 65 ? 'bg-rose-500' : t.priority_score > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${t.priority_score}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
