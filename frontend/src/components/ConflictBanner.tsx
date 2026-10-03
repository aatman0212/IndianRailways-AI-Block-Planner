import React from 'react';
import { TrafficConflict } from '../types';
import { AlertTriangle, Zap, CheckCircle2, ShieldAlert, X, RefreshCw } from 'lucide-react';

interface Props {
  conflict: TrafficConflict | null;
  onResolve: () => void;
  onClear: () => void;
  isResolving: boolean;
}

export const ConflictBanner: React.FC<Props> = ({
  conflict,
  onResolve,
  onClear,
  isResolving,
}) => {
  if (!conflict) return null;

  return (
    <div className="bg-gradient-to-r from-rose-950/90 via-slate-900/95 to-amber-950/90 border-2 border-rose-500/80 rounded-2xl p-5 shadow-2xl shadow-rose-950/70 animate-in slide-in-from-top duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Alert Badge & Information */}
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-rose-600/30 rounded-xl border border-rose-500/60 text-rose-400 shrink-0 animate-pulse mt-0.5">
            <AlertTriangle className="w-6 h-6 text-rose-400" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-rose-600 text-white font-mono font-extrabold text-[11px] px-2 py-0.5 rounded tracking-wide animate-pulse">
                CRITICAL HEADWAY CONFLICT
              </span>
              <span className="text-xs font-mono text-rose-300 font-bold">
                Train {conflict.train_number} • {conflict.train_name} (+{conflict.delay_minutes}m Delay)
              </span>
              <span className="text-xs text-slate-500 font-mono">• Section: <strong className="text-slate-200">{conflict.section_name}</strong></span>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed max-w-3xl">
              {conflict.message}
            </p>

            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 pt-1">
              <span className="flex items-center gap-1 text-rose-400">
                <ShieldAlert className="w-3.5 h-3.5" />
                Single-Track Occupancy Violated
              </span>
              <span className="text-slate-600">•</span>
              <span>Revised Arrival: <strong className="text-amber-300">{conflict.eta}</strong></span>
            </div>
          </div>
        </div>

        {/* Right Side: Auto-Resolve Action Button */}
        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
          <button
            onClick={onClear}
            className="px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            Dismiss
          </button>

          <button
            onClick={onResolve}
            disabled={isResolving}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-600 to-sky-600 hover:from-emerald-400 hover:to-sky-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-950/60 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isResolving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Solving Constraints...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>⚡ Auto-Resolve via CP-SAT</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
