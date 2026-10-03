import React from 'react';
import { PlanAnalytics } from '../types';
import { TrendingUp, Clock, Layers, ShieldCheck, Gauge, CheckCircle2 } from 'lucide-react';

interface Props {
  analytics: PlanAnalytics | null;
}

export const KpiCards: React.FC<Props> = ({ analytics }) => {
  if (!analytics) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* KPI 1: Asset Availability Rate */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-emerald-500/50 transition-all">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all"></div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Track Asset Uptime
          </span>
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-100 font-mono tracking-tight">
            {analytics.asset_availability_pct}%
          </span>
          <span className="text-xs font-bold text-emerald-400 flex items-center">
            ▲ +9.2%
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 font-mono">
          <span>Target: 95.0%</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Zero Safety Deficit
          </span>
        </div>
      </div>

      {/* KPI 2: Multi-Department Bundling Ratio */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-sky-500/50 transition-all">
        <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl group-hover:bg-sky-500/10 transition-all"></div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Joint Bundled Blocks
          </span>
          <div className="p-2 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-100 font-mono tracking-tight">
            {analytics.bundling_ratio_pct}%
          </span>
          <span className="text-xs font-medium text-slate-400">
            ({analytics.bundled_blocks_count} Shared Blocks)
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 font-mono">
          <span>Departments: P.Way + TRD + S&T</span>
          <span className="text-sky-400 font-semibold">Max Coordination</span>
        </div>
      </div>

      {/* KPI 3: Idle Window Reduction */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-amber-500/50 transition-all">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all"></div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Idle Track Time Saved
          </span>
          <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-100 font-mono tracking-tight">
            {analytics.idle_window_reduction_pct}%
          </span>
          <span className="text-xs font-medium text-amber-400">
            Efficiency
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 font-mono">
          <span>Sanctioned Block: {analytics.total_block_hours}h</span>
          <span className="text-amber-400 font-semibold">Duplicate Stops Eliminated</span>
        </div>
      </div>

      {/* KPI 4: Overdue Backlog Burndown */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-indigo-500/50 transition-all">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all"></div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Maintenance Demands Met
          </span>
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <Gauge className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-100 font-mono tracking-tight">
            {analytics.total_tasks_scheduled}
            <span className="text-base font-normal text-slate-500"> / {analytics.total_tasks_demanded}</span>
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 font-mono">
          <span>Backlog: {analytics.backlog_count} task(s)</span>
          <span className="text-indigo-400 font-semibold">Priority First</span>
        </div>
      </div>
    </div>
  );
};
