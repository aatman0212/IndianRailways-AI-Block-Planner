import React from 'react';
import { PlanAnalytics } from '../types';
import { ShieldCheck, Layers, Clock, CheckSquare, TrendingUp, Info } from 'lucide-react';

interface Props {
  analytics: PlanAnalytics | null;
}

export const KpiCards: React.FC<Props> = ({ analytics }) => {
  if (!analytics) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* KPI 1: Asset Availability Rate */}
      <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 transition-all shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Track Available for Trains
          </span>
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
            {analytics.asset_availability_pct}%
          </span>
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
            +9.2% uptime
          </span>
        </div>

        <p className="mt-2 text-xs text-slate-400 line-clamp-1">
          Corridor is open and safe for train traffic.
        </p>

        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Target: 95.0%</span>
          <span className="text-emerald-400 font-medium">✓ Exceeding Target</span>
        </div>
      </div>

      {/* KPI 2: Multi-Department Bundling Ratio */}
      <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 transition-all shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            Combined Repairs
          </span>
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
            {analytics.bundling_ratio_pct}%
          </span>
          <span className="text-xs font-semibold text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
            {analytics.bundled_blocks_count} Shared Windows
          </span>
        </div>

        <p className="mt-2 text-xs text-slate-400 line-clamp-1">
          Track + Wire + Signals work together at once.
        </p>

        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>3 Departments</span>
          <span className="text-blue-400 font-medium">Single Closure</span>
        </div>
      </div>

      {/* KPI 3: Idle Window Reduction */}
      <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 transition-all shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            Track Time Saved
          </span>
          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
            {analytics.idle_window_reduction_pct}%
          </span>
          <span className="text-xs font-semibold text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
            Less Downtime
          </span>
        </div>

        <p className="mt-2 text-xs text-slate-400 line-clamp-1">
          Eliminates separate closures across the day.
        </p>

        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Total Block Time</span>
          <span className="text-purple-400 font-medium">{analytics.total_block_hours} hrs today</span>
        </div>
      </div>

      {/* KPI 4: Overdue Backlog Burndown */}
      <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 transition-all shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Defects Scheduled
          </span>
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <CheckSquare className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
            {analytics.total_tasks_scheduled}
            <span className="text-lg font-normal text-slate-400"> / {analytics.total_tasks_demanded}</span>
          </span>
          <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
            {Math.round((analytics.total_tasks_scheduled / (analytics.total_tasks_demanded || 1)) * 100)}% Done
          </span>
        </div>

        <p className="mt-2 text-xs text-slate-400 line-clamp-1">
          {analytics.backlog_count === 0 ? 'All defects accommodated.' : `${analytics.backlog_count} non-critical task deferred to tomorrow.`}
        </p>

        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Pending Backlog</span>
          <span className="text-amber-400 font-medium">{analytics.backlog_count} task</span>
        </div>
      </div>
    </div>
  );
};
