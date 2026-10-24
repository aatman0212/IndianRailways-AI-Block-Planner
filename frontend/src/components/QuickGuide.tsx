import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Layers, CheckCircle, AlertTriangle, Zap, ShieldAlert, Radio } from 'lucide-react';

export const QuickGuide: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden transition-all">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-200">
              New here? How does the AI Block Planner work?
            </span>
            <span className="text-[11px] text-slate-400 ml-2 hidden sm:inline">
              (Click to {isOpen ? 'hide' : 'view'} simple 3-step explanation)
            </span>
          </div>
        </div>

        <button 
          type="button"
          className="text-slate-400 hover:text-slate-200 p-1"
          aria-label={isOpen ? 'Collapse guide' : 'Expand guide'}
        >
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="p-4 pt-1 border-t border-slate-800/80 bg-slate-950/40 space-y-4 text-xs">
          {/* 3 Step Flow */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-3">
              <div className="flex items-center gap-2 text-blue-400 font-semibold mb-1">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-[11px] font-mono">1</span>
                <span>Defects Reported</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Track, Electrical (OHE), and Signal departments submit repair demands and track defect reports.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-3">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[11px] font-mono">2</span>
                <span>AI Bundles Repairs</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Instead of closing the track 3 separate times, the AI groups multiple repairs into a single low-traffic window.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-3">
              <div className="flex items-center gap-2 text-purple-400 font-semibold mb-1">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-[11px] font-mono">3</span>
                <span>Controller Approves</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Click any scheduled block on the timeline to inspect AI reasoning, then click "Approve" to sanction the window.
              </p>
            </div>
          </div>

          {/* Quick Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="font-semibold text-slate-300">Department Teams:</span>
              <span className="flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" /> Track (Civil/P.Way)
              </span>
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Overhead Wire (Electrical/TRD)
              </span>
              <span className="flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-purple-400" /> Signals & Points (S&T)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1">
                <Layers className="w-3 h-3" /> Bundled = 2+ teams working together
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
