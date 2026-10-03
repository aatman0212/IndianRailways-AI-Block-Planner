import React, { useState } from 'react';
import { Section, ScheduledBlock } from '../types';
import { Sliders, ShieldCheck, AlertCircle, ArrowRight, Gauge, Clock, Train } from 'lucide-react';

interface Props {
  sections: Section[];
  blocks: ScheduledBlock[];
}

export const WhatIfSimulator: React.FC<Props> = ({ sections, blocks }) => {
  const [selectedSectionId, setSelectedSectionId] = useState<string>(sections[0]?.section_id || '');
  const [proposedDuration, setProposedDuration] = useState<number>(150);
  const [freightHoldoverAllowed, setFreightHoldoverAllowed] = useState<boolean>(true);
  const [powerIsolationCoordinated, setPowerIsolationCoordinated] = useState<boolean>(true);

  // Dynamic simulation calculations
  const selectedSec = sections.find((s) => s.section_id === selectedSectionId) || sections[0];
  const gmtDensity = selectedSec?.traffic_density_gmt || 120;

  // Safety Score: scales with duration and power isolation
  const safetyScore = Math.min(
    99.4,
    Math.round(75 + (proposedDuration / 180) * 18 + (powerIsolationCoordinated ? 6.4 : 0))
  );

  // Train Punctuality Impact (mins)
  const freightDelayMins = freightHoldoverAllowed ? Math.max(0, Math.round((proposedDuration - 120) * 0.4)) : 0;
  const passengerPunctualityPct = Math.max(92.0, (99.8 - (freightDelayMins * 0.15))).toFixed(1);

  // Multi-department bundling capacity
  const tasksAccommodated = proposedDuration >= 150 ? 3 : proposedDuration >= 110 ? 2 : 1;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-sky-400" />
            <h2 className="text-lg font-bold text-slate-100 tracking-tight">
              Operational "What-If" Scenario Simulator
            </h2>
            <span className="bg-sky-500/10 border border-sky-500/30 text-sky-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
              DECISION SUPPORT
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluate the real-time trade-off between corridor block duration, train punctuality, and multi-department task bundling.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
          Target Corridor: <strong className="text-slate-200">PRYJ – CNB UP MAIN</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column (5 cols) */}
        <div className="lg:col-span-5 space-y-5 bg-slate-950/70 p-5 rounded-xl border border-slate-800">
          {/* Section Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Corridor Section Under Evaluation
            </label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
            >
              {sections.map((s) => (
                <option key={s.section_id} value={s.section_id}>
                  {s.name} ({s.traffic_density_gmt} GMT)
                </option>
              ))}
            </select>
          </div>

          {/* Block Duration Slider */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-300">Sanctioned Block Duration</span>
              <span className="font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded">
                {proposedDuration} Minutes ({Math.floor(proposedDuration / 60)}h {proposedDuration % 60}m)
              </span>
            </div>
            <input
              type="range"
              min={60}
              max={240}
              step={15}
              value={proposedDuration}
              onChange={(e) => setProposedDuration(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>60m (Quick Patrol)</span>
              <span>120m (Standard)</span>
              <span>180m (Deep Renewals)</span>
              <span>240m (Mega Block)</span>
            </div>
          </div>

          {/* Operational Toggles */}
          <div className="space-y-3 pt-2 text-xs text-slate-300 border-t border-slate-800/80">
            <label className="flex items-center justify-between cursor-pointer">
              <span>Hold freight in loop sidings if needed</span>
              <input
                type="checkbox"
                checked={freightHoldoverAllowed}
                onChange={(e) => setFreightHoldoverAllowed(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span>Joint OHE 25kV power isolation active</span>
              <input
                type="checkbox"
                checked={powerIsolationCoordinated}
                onChange={(e) => setPowerIsolationCoordinated(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-0"
              />
            </label>
          </div>
        </div>

        {/* Real-time Predictive Trade-off Output (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Predicted Safety Index */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Safety Index</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
                {safetyScore}%
              </div>
              <div className="text-[11px] text-emerald-500/80 mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Derailment risk mitigated
              </div>
            </div>

            {/* Passenger Punctuality */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Mail/Express Punctuality</div>
              <div className="text-2xl font-bold text-sky-400 mt-1 font-mono">
                {passengerPunctualityPct}%
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <Train className="w-3.5 h-3.5 text-sky-400" />
                Zero Rajdhani detention
              </div>
            </div>

            {/* Bundling Capacity */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Co-Scheduling Yield</div>
              <div className="text-2xl font-bold text-amber-400 mt-1 font-mono">
                {tasksAccommodated} Dept Tasks
              </div>
              <div className="text-[11px] text-amber-500/80 mt-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Single joint corridor block
              </div>
            </div>
          </div>

          {/* AI Recommendation Card */}
          <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-700/80 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
              <Gauge className="w-4 h-4 text-sky-400" />
              AI Controller Advisory (Optimal Pareto Point)
            </div>

            <p className="text-xs leading-relaxed text-slate-300">
              {proposedDuration >= 150 ? (
                <span>
                  Granting a <strong>{proposedDuration}-minute block</strong> on{' '}
                  <strong className="text-sky-300">{selectedSec.name}</strong> will allow simultaneous execution of{' '}
                  <strong>Track Welding (P.Way)</strong>, <strong>OHE Insulator Washing (TRD)</strong>, and{' '}
                  <strong>Point Machine Overhaul (S&T)</strong>. Freight train <em>BOXN-804</em> will be looped for{' '}
                  <span className="text-amber-400 font-mono font-bold">{freightDelayMins} minutes</span> with zero knock-on passenger delay.
                </span>
              ) : (
                <span>
                  A <strong>{proposedDuration}-minute block</strong> is tight. It will only clear the primary track defect. TRD and S&T tasks will be deferred to the next shift, requiring a second duplicate corridor possession tomorrow.
                </span>
              )}
            </p>

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800">
              <span>Section Capacity Loss: <strong className="text-slate-200">{(proposedDuration / 1440 * 100).toFixed(1)}% of 24h</strong></span>
              <span>Maintenance Efficiency: <strong className="text-emerald-400">+{tasksAccommodated * 33}%</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
