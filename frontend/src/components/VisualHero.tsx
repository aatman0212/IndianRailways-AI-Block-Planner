import React, { useState } from 'react';
import { Sparkles, ArrowRight, CheckCircle2, XCircle, Clock, Train, ShieldCheck, Zap, Layers, ChevronDown, ChevronUp } from 'lucide-react';

export const VisualHero: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-blue-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-96 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>How This AI Works — The Big Picture</span>
              <span className="text-[10px] font-mono uppercase bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-full">
                Concept Visualized
              </span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              See the difference between the old manual way and the AI multi-department bundling.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800 transition-colors cursor-pointer"
        >
          <span>{isExpanded ? 'Collapse Diagram' : 'Show Diagram'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4 text-xs">
          {/* THE OLD WAY (Manual & Chaotic) */}
          <div className="bg-slate-950/80 border border-red-900/40 rounded-xl p-4 space-y-3 relative">
            <div className="flex items-center justify-between">
              <span className="font-bold text-red-400 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <XCircle className="w-4 h-4 text-red-400" />
                The Old Manual Way (3 Separate Track Closures)
              </span>
              <span className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded font-mono">
                Severe Passenger Delays
              </span>
            </div>

            <p className="text-slate-400 text-xs">
              Departments worked independently. Track, Electric Wire, and Signal teams asked for separate track closures:
            </p>

            {/* Visual Timeline of 3 separate blocks */}
            <div className="space-y-2 pt-1 font-mono">
              <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg border border-red-900/30 text-slate-300">
                <span className="text-[10px] bg-red-950 text-red-300 border border-red-800 px-1.5 py-0.5 rounded">10:00 AM</span>
                <span className="text-xs">🛠️ Track Team closes track for 2 hrs</span>
                <span className="text-red-400 ml-auto text-[10px]">❌ Trains stopped</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg border border-red-900/30 text-slate-300">
                <span className="text-[10px] bg-red-950 text-red-300 border border-red-800 px-1.5 py-0.5 rounded">02:00 PM</span>
                <span className="text-xs">⚡ Wire Team closes track for 2 hrs</span>
                <span className="text-red-400 ml-auto text-[10px]">❌ Trains stopped again</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg border border-red-900/30 text-slate-300">
                <span className="text-[10px] bg-red-950 text-red-300 border border-red-800 px-1.5 py-0.5 rounded">06:00 PM</span>
                <span className="text-xs">📡 Signal Team closes track for 1.5 hrs</span>
                <span className="text-red-400 ml-auto text-[10px]">❌ Trains stopped 3rd time</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[11px] text-red-300/90 flex items-center justify-between">
              <span>Total Disruption: <strong>5.5 Hours</strong></span>
              <span>Rajdhani Express Delayed: <strong>85 mins</strong></span>
            </div>
          </div>

          {/* THE AI WAY (Smart Bundling) */}
          <div className="bg-slate-950/80 border border-emerald-900/50 rounded-xl p-4 space-y-3 relative shadow-inner">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                The AI Automatic Way (1 Joint Night Window)
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold">
                Zero Rajdhani Delays
              </span>
            </div>

            <p className="text-slate-300 text-xs">
              AI solver scans the train timetable, finds the 01:00–05:00 AM low-traffic night lull, and puts all 3 teams into <strong>one single closure</strong>:
            </p>

            {/* Visual Timeline of 1 unified bundled block */}
            <div className="pt-1 font-mono">
              <div className="bg-gradient-to-r from-blue-950/60 to-emerald-950/40 border border-emerald-500/40 p-3 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>🌙 01:00 AM — 03:30 AM (2.5 Hours Joint Window)</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                    ★ BUNDLED
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                  <div className="bg-slate-900/90 p-1.5 rounded border border-slate-800 text-emerald-300 flex items-center gap-1">
                    <span>🛠️ Track Welding</span>
                  </div>
                  <div className="bg-slate-900/90 p-1.5 rounded border border-slate-800 text-amber-300 flex items-center gap-1">
                    <span>⚡ Wire Washing</span>
                  </div>
                  <div className="bg-slate-900/90 p-1.5 rounded border border-slate-800 text-purple-300 flex items-center gap-1">
                    <span>📡 Point Overhaul</span>
                  </div>
                </div>

                <div className="text-[11px] text-emerald-300 font-sans pt-1 flex items-center gap-1">
                  <span>✓ All 3 repairs completed at the exact same time during night.</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[11px] text-emerald-300 flex items-center justify-between">
              <span>Track Closures: <strong>Only 1 Closure</strong></span>
              <span className="font-bold text-emerald-400">Passenger Trains: 100% On-Time (₹1.24L Saved)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
