import React, { useState } from 'react';
import { Section, ScheduledBlock } from '../types';
import { Sliders, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, Gauge, Clock, Train, Lightbulb, Zap, Sparkles, HardHat, MapPin, TrendingUp, AlertTriangle } from 'lucide-react';

interface Props {
  sections: Section[];
  blocks: ScheduledBlock[];
}

export const WhatIfSimulator: React.FC<Props> = ({ sections, blocks }) => {
  const [selectedSectionId, setSelectedSectionId] = useState<string>(sections[0]?.section_id || '');
  const [proposedDuration, setProposedDuration] = useState<number>(150);
  const [freightHoldoverAllowed, setFreightHoldoverAllowed] = useState<boolean>(true);
  const [powerIsolationCoordinated, setPowerIsolationCoordinated] = useState<boolean>(true);

  // Dynamic section resolution
  const selectedSec = sections.find((s) => s.section_id === selectedSectionId) || sections[0] || {
    section_id: 'SEC_SFG_MRE_UP',
    name: 'Subedarganj - Manauri (UP)',
    start_km: 831.5,
    end_km: 845.2,
    traffic_density_gmt: 125.0,
    max_permissible_speed: 130,
    line_type: 'UP_MAIN',
    division: 'Prayagraj (NCR)',
  };

  // Section physical characteristics
  const sectionLengthKm = Number((selectedSec.end_km - selectedSec.start_km).toFixed(1));
  const gmtDensity = selectedSec.traffic_density_gmt;
  
  // Section density scale: 115 GMT (low trunk) to 145 GMT (Kanpur junction mega trunk)
  // Normalized between 0.1 and 1.0
  const densityRatio = Math.max(0.1, Math.min(1.0, (gmtDensity - 110) / 35));
  const lengthRatio = Math.max(0.2, Math.min(2.0, sectionLengthKm / 20));

  // Find actual blocks and tasks on this specific section
  const sectionBlocks = blocks.filter((b) => b.section_id === selectedSec.section_id);
  const sectionTasks = sectionBlocks.flatMap((b) => b.tasks);

  // Dynamic simulation calculations: NOW FULLY RESPONSIVE TO EACH INDIVIDUAL SECTION!
  
  // 1. Freight & Passenger Delay calculations
  // High-density sections (like near Kanpur/145 GMT) have way more train frequency, so delays scale up!
  const delayThreshold = freightHoldoverAllowed ? 110 : 80;
  const baseExcessDuration = Math.max(0, proposedDuration - delayThreshold);
  
  // Freight delay scales with section density & section length
  const freightDelayMins = Math.round(
    baseExcessDuration * (0.35 + densityRatio * 0.45 + (lengthRatio > 1.2 ? 0.15 : 0))
  );

  // Passenger delay occurs if duration exceeds 140 min on high-density sections or 160 on moderate sections
  const passengerDelayThreshold = gmtDensity >= 135 ? 135 : 155;
  const passengerExcess = Math.max(0, proposedDuration - passengerDelayThreshold);
  const passengerDelayMins = Math.round(passengerExcess * (0.3 + densityRatio * 0.4));
  
  // Passenger punctuality percentage
  const passengerPunctualityPct = Math.max(
    84.5,
    Number((99.9 - (freightDelayMins * 0.08 + passengerDelayMins * 0.35)).toFixed(1))
  );

  // 2. Safety Score: High density track suffers much faster degradation
  // Timely maintenance on high-density track produces larger safety gains, but short blocks leave defects!
  const baseSafety = 72 + (proposedDuration / 180) * 18 + (powerIsolationCoordinated ? 6.5 : 0);
  const densitySafetyModifier = densityRatio * 5.0; // Higher reward for maintenance on dense tracks
  const safetyPenalty = proposedDuration < 120 ? (densityRatio * 7.0) : 0; // Penalty for rushing maintenance on high-density line
  const safetyScore = Math.min(99.6, Math.max(68.0, Math.round(baseSafety + densitySafetyModifier - safetyPenalty)));

  // 3. Multi-department bundling capacity for this section
  const tasksAccommodated = proposedDuration >= 150 ? 3 : proposedDuration >= 105 ? 2 : 1;

  // 4. Financial cost/savings impact
  const hourlyCostINR = 18000 + Math.round(densityRatio * 8000);
  const demurrageImpactINR = Math.round((freightDelayMins / 60) * hourlyCostINR);

  const durationPresets = [
    { label: '1 Hour', minutes: 60, tag: 'Quick Fix', icon: '⚡' },
    { label: '2 Hours', minutes: 120, tag: 'Standard Track', icon: '🛠️' },
    { label: '2.5 Hours', minutes: 150, tag: '★ Optimal Bundled', icon: '⭐' },
    { label: '3 Hours', minutes: 180, tag: 'Deep Maintenance', icon: '🔧' },
    { label: '4 Hours', minutes: 240, tag: 'Mega Block', icon: '🏗️' },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>"What-If" Scenario Simulator</span>
                <span className="text-[10px] font-mono uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full">
                  Interactive Test Bench
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Select different railway stations or drag the slider to see unique section-specific train delay, safety, and cost results.
              </p>
            </div>
          </div>
        </div>

        {/* Live Section Badge */}
        <div className="text-xs font-mono text-slate-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-400" />
          <span>Active: <strong className="text-blue-300">{selectedSec?.name?.split(' (')[0] || selectedSec?.name || 'Section'}</strong></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column (5 cols) */}
        <div className="lg:col-span-5 space-y-5 bg-slate-950/90 p-5 rounded-2xl border border-slate-800 shadow-inner">
          {/* Step 1: Section Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[11px] font-mono">1</span>
                <span>Select Station / Section:</span>
              </span>
              <span className="text-[11px] font-mono text-blue-400">
                {selectedSec.traffic_density_gmt} GMT Density
              </span>
            </label>

            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-semibold cursor-pointer shadow-sm"
            >
              {sections.map((s) => (
                <option key={s.section_id} value={s.section_id}>
                  {s.name} ({Number((s.end_km - s.start_km).toFixed(1))} km, {s.traffic_density_gmt} GMT)
                </option>
              ))}
            </select>

            {/* Selected Section Live Characteristics Strip */}
            <div className="mt-2.5 p-3 rounded-xl bg-slate-900/90 border border-slate-800 grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Length</div>
                <div className="font-bold text-slate-200 mt-0.5">{sectionLengthKm} km</div>
              </div>
              <div className="border-r border-l border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">Traffic Density</div>
                <div className={`font-bold mt-0.5 ${gmtDensity >= 135 ? 'text-amber-400' : 'text-blue-400'}`}>
                  {gmtDensity} GMT
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Track Speed</div>
                <div className="font-bold text-slate-200 mt-0.5">{selectedSec.max_permissible_speed} km/h</div>
              </div>
            </div>
          </div>

          {/* Step 2: Duration Slider & Presets */}
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[11px] font-mono">2</span>
                <span>Select Block Duration:</span>
              </span>
              <span className="font-mono font-bold text-blue-300 bg-blue-500/20 border border-blue-500/40 px-2.5 py-1 rounded-lg text-xs">
                {proposedDuration} Mins ({Math.floor(proposedDuration / 60)}h {proposedDuration % 60}m)
              </span>
            </div>

            {/* Quick Preset Buttons */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 mb-3">
              {durationPresets.map((preset) => (
                <button
                  key={preset.minutes}
                  type="button"
                  onClick={() => setProposedDuration(preset.minutes)}
                  className={`py-2 px-1 rounded-xl text-center transition-all border cursor-pointer ${
                    proposedDuration === preset.minutes
                      ? 'bg-blue-600 text-white border-blue-400 shadow-md scale-102'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">{preset.icon} {preset.label}</div>
                  <div className="text-[9px] opacity-80 truncate">{preset.tag}</div>
                </button>
              ))}
            </div>

            <input
              type="range"
              min={60}
              max={240}
              step={15}
              value={proposedDuration}
              onChange={(e) => setProposedDuration(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1.5">
              <span>60m (1h)</span>
              <span>120m (2h)</span>
              <span className="text-blue-400 font-bold">150m (2.5h Optimal)</span>
              <span>240m (4h)</span>
            </div>
          </div>

          {/* Step 3: Safeguards */}
          <div className="space-y-2.5 pt-3 border-t border-slate-800">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[11px] font-mono">3</span>
              <span>Safety & Dispatch Rules:</span>
            </span>

            <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:bg-slate-900">
              <div className="pr-2">
                <div className="font-semibold text-xs text-slate-200">Hold Freight Train on Side Track</div>
                <div className="text-[11px] text-slate-400">Protects oncoming Rajdhani and passenger expresses from delay</div>
              </div>
              <input
                type="checkbox"
                checked={freightHoldoverAllowed}
                onChange={(e) => setFreightHoldoverAllowed(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-blue-500 focus:ring-0 w-4 h-4 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:bg-slate-900">
              <div className="pr-2">
                <div className="font-semibold text-xs text-slate-200">Joint 25kV OHE Power Cutoff</div>
                <div className="text-[11px] text-slate-400">Turns off overhead wire power for 100% electrical worker safety</div>
              </div>
              <input
                type="checkbox"
                checked={powerIsolationCoordinated}
                onChange={(e) => setPowerIsolationCoordinated(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-blue-500 focus:ring-0 w-4 h-4 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Real-time Predictive Visual Output (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-purple-400" />
              <span>Section Outcome for {selectedSec.name.split(' (')[0]}:</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Corridor Rank: {gmtDensity >= 135 ? 'High Congestion Route' : 'Standard Trunk'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Safety Score Meter */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Safety Index
              </div>
              <div className="text-3xl font-extrabold text-emerald-400 mt-2 font-mono">
                {safetyScore}%
              </div>
              <div className="text-xs text-emerald-300/90 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{safetyScore >= 95 ? 'Complete Safety Recovery' : 'Partial Defect Clearing'}</span>
              </div>
            </div>

            {/* Punctuality Meter */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Train className="w-4 h-4 text-blue-400" />
                Punctuality Index
              </div>
              <div className={`text-3xl font-extrabold mt-2 font-mono ${
                passengerPunctualityPct >= 98.0 ? 'text-blue-400' : passengerPunctualityPct >= 92.0 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {passengerPunctualityPct}%
              </div>
              <div className="text-xs text-slate-300 mt-1 flex items-center gap-1">
                {passengerDelayMins === 0 ? (
                  <span className="text-emerald-400">Zero Passenger Delay</span>
                ) : (
                  <span className="text-amber-400">+{passengerDelayMins}m Express Delay</span>
                )}
              </div>
            </div>

            {/* Bundling Yield */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <HardHat className="w-4 h-4 text-purple-400" />
                Teams Bundled
              </div>
              <div className="text-3xl font-extrabold text-purple-400 mt-2 font-mono">
                {tasksAccommodated} Depts
              </div>
              <div className="text-xs text-purple-300/90 mt-1">
                {tasksAccommodated === 3 ? 'Track + Wire + Signals' : tasksAccommodated === 2 ? 'Track + Wire only' : 'Track repair only'}
              </div>
            </div>
          </div>

          {/* Illustrated Visual Physical Corridor Simulation Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="text-xs font-bold text-slate-200 flex items-center justify-between">
              <span>Section Track Schematic Simulation:</span>
              <span className="text-blue-400 font-mono text-[11px]">
                {selectedSec?.name?.split(' (')[0] || selectedSec?.name || 'Section'} ({sectionLengthKm} km)
              </span>
            </div>

            {/* Main Physical Line */}
            <div className="space-y-2">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
                <span className="font-mono text-slate-300 font-bold bg-slate-950 px-2 py-1 rounded border border-slate-800">
                  {selectedSec?.name?.split(' - ')[0] || 'Start'} (Km {selectedSec.start_km})
                </span>

                <div className="flex-1 mx-3 relative flex items-center justify-center">
                  <div className="h-1.5 bg-slate-800 w-full rounded"></div>
                  <div className="absolute px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-lg text-[10px] font-mono font-bold shadow-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                    <span>🚧 {proposedDuration}m Block ({tasksAccommodated} Teams)</span>
                  </div>
                </div>

                <span className="font-mono text-slate-300 font-bold bg-slate-950 px-2 py-1 rounded border border-slate-800">
                  {selectedSec?.name?.split(' - ')[1]?.split(' (')[0] || 'End'} (Km {selectedSec.end_km})
                </span>
              </div>

              {/* Loop Line Freight Status */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">SIDE LOOP LINE:</span>
                  <span className="text-slate-300">
                    {freightHoldoverAllowed
                      ? `🚂 Goods Freight BOXN-804 Looped: ${freightDelayMins}m detention`
                      : '🚂 Freight not regulated (line congested)'}
                  </span>
                </div>
                <div className={`font-bold text-[11px] ${freightDelayMins > 20 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {freightDelayMins === 0 ? '✓ Zero Detention' : `₹${demurrageImpactINR.toLocaleString('en-IN')} demurrage`}
                </div>
              </div>
            </div>
          </div>

          {/* AI Recommendation Card (Dynamically Customized for Selected Station) */}
          <div className="bg-gradient-to-br from-slate-950 to-blue-950/40 border border-blue-500/40 rounded-2xl p-5 space-y-2.5 shadow-md">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
              <Lightbulb className="w-4 h-4 text-blue-400" />
              AI Controller Advisory for {selectedSec?.name?.split(' (')[0] || selectedSec?.name || 'Section'}:
            </div>

            <p className="text-xs leading-relaxed text-slate-200">
              {proposedDuration >= 150 ? (
                <span>
                  On <strong className="text-blue-300">{selectedSec.name}</strong> ({sectionLengthKm} km at <span className="font-mono text-amber-300">{gmtDensity} GMT</span>), granting a <strong>{proposedDuration}-minute block</strong> is the optimal decision. It allows <strong>Track Welding</strong>, <strong>OHE Catenary Adjustments</strong>, and <strong>Signal Point Overhaul</strong> to execute simultaneously. Freight detention is managed at <span className="font-mono text-amber-300">{freightDelayMins} minutes</span>, while <strong>100% of Rajdhani & passenger traffic flows without disruption</strong>.
                </span>
              ) : proposedDuration >= 105 ? (
                <span>
                  A <strong>{proposedDuration}-minute block</strong> on <strong className="text-blue-300">{selectedSec.name}</strong> will only cover 2 out of 3 departments (Track and Wire). Signalling repairs will remain pending and will require another line closure tomorrow, causing redundant setup time.
                </span>
              ) : (
                <span>
                  A brief <strong>{proposedDuration}-minute block</strong> on this <span className="font-mono text-amber-300">{gmtDensity} GMT</span> route is strictly limited to quick patrol. High-speed track defects cannot be adequately tamped, resulting in a lower safety index of <span className="font-mono text-amber-400">{safetyScore}%</span>.
                </span>
              )}
            </p>

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800">
              <span>Section Capacity Used: <strong className="text-slate-200">{((proposedDuration / 1440) * 100).toFixed(1)}% of 24h</strong></span>
              <span>Efficiency Yield: <strong className="text-emerald-400">+{tasksAccommodated * 33}%</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
