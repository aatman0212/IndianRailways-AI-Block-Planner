import React, { useState, useEffect } from 'react';
import { Section, ScheduledBlock } from '../types';
import { Train, AlertTriangle, CheckCircle, Navigation, Clock, Gauge, Building2, Eye, ShieldCheck, Zap, Radio, ArrowRight, ArrowLeft, Signal } from 'lucide-react';

interface Props {
  sections: Section[];
  blocks: ScheduledBlock[];
  onSelectBlock: (block: ScheduledBlock) => void;
}

interface SimulatedTrain {
  id: string;
  name: string;
  type: 'PASSENGER' | 'RAJDHANI' | 'MAIL_EXPRESS' | 'FREIGHT' | 'VANDE_BHARAT';
  line: 'UP' | 'DOWN';
  sectionIndex: number; // 0 to 7
  speed: number;
  delayMinutes: number;
  status: 'RUNNING' | 'CAUTION' | 'REGULATED' | 'LOOPED';
  statusNote: string;
  holdTicks?: number;
}

// 9 Official Stations along the 191 km Prayagraj - Kanpur corridor
const STATIONS = [
  { code: 'PRYJ', name: 'Prayagraj Jn', km: 827.0 },
  { code: 'SFG', name: 'Subedarganj', km: 831.5 },
  { code: 'MRE', name: 'Manauri', km: 845.2 },
  { code: 'BRE', name: 'Bharwari', km: 865.8 },
  { code: 'SRO', name: 'Sirathu', km: 888.4 },
  { code: 'KGA', name: 'Khaga', km: 914.6 },
  { code: 'FTP', name: 'Fatehpur', km: 945.0 },
  { code: 'BKO', name: 'Bindki Road', km: 977.3 },
  { code: 'CNB', name: 'Kanpur Central', km: 1018.0 },
];

export const TrackSchematic: React.FC<Props> = ({ sections, blocks, onSelectBlock }) => {
  const [selectedSectionIdx, setSelectedSectionIdx] = useState<number>(1); // Default to Subedarganj-Manauri (index 1)
  const [selectedLine, setSelectedLine] = useState<'UP' | 'DOWN'>('UP');

  // Filter 8 base corridor segments (UP Main)
  const upSections = React.useMemo(() => {
    const list = sections.filter((s) => s.line_type === 'UP_MAIN' || s.section_id.endsWith('_UP'));
    return list.length > 0 ? list : sections.slice(0, 8);
  }, [sections]);

  // Map blocks by section ID
  const blocksBySection = React.useMemo(() => {
    const map: Record<string, ScheduledBlock> = {};
    for (const b of blocks) {
      map[b.section_id] = b;
    }
    return map;
  }, [blocks]);

  // Live Train state on both UP Main (PRYJ -> CNB) and DOWN Main (CNB -> PRYJ)
  const [trains, setTrains] = useState<SimulatedTrain[]>([
    {
      id: '12301',
      name: 'Howrah Rajdhani Express',
      type: 'RAJDHANI',
      line: 'UP',
      sectionIndex: 0,
      speed: 128,
      delayMinutes: 0,
      status: 'RUNNING',
      statusNote: 'Sectional Speed (130 km/h) • Clear Signal',
      holdTicks: 0,
    },
    {
      id: '12417',
      name: '12417 Prayagraj Mail / Express',
      type: 'MAIL_EXPRESS',
      line: 'UP',
      sectionIndex: 2,
      speed: 110,
      delayMinutes: 0,
      status: 'RUNNING',
      statusNote: 'Cruising at 110 km/h (Priority Mail/Express)',
      holdTicks: 0,
    },
    {
      id: 'BOXN-804',
      name: 'Coal Freight (BOXN-CC)',
      type: 'FREIGHT',
      line: 'UP',
      sectionIndex: 4,
      speed: 72,
      delayMinutes: 0,
      status: 'RUNNING',
      statusNote: 'Freight corridor line clear at 72 km/h',
      holdTicks: 0,
    },
    {
      id: '22436',
      name: 'Vande Bharat Express',
      type: 'VANDE_BHARAT',
      line: 'DOWN',
      sectionIndex: 6,
      speed: 130,
      delayMinutes: 0,
      status: 'RUNNING',
      statusNote: 'Eastbound clear run to Prayagraj (130 km/h)',
      holdTicks: 0,
    },
  ]);

  // Train Movement Logic with Respect for Maintenance Possessions on BOTH UP & DOWN lines!
  useEffect(() => {
    const timer = setInterval(() => {
      setTrains((prevTrains) =>
        prevTrains.map((train) => {
          const numSections = upSections.length || 8;

          if (train.line === 'UP') {
            // UP train moves East to West (index increases 0 -> 7)
            const nextIdx = (train.sectionIndex + 1) % numSections;
            const targetSection = upSections[nextIdx];
            const hasBlockOnNext = targetSection && blocksBySection[targetSection.section_id];

            if (hasBlockOnNext) {
              if (train.type === 'FREIGHT' || train.id.includes('BOXN')) {
                // If freight has not yet yielded, hold for 1 cycle on loop siding
                if ((train.holdTicks || 0) < 1) {
                  return {
                    ...train,
                    speed: 0,
                    delayMinutes: train.delayMinutes + 1,
                    status: 'LOOPED',
                    statusNote: `Regulated on loop siding before ${STATIONS[nextIdx]?.name} (Yielding to Mail/Express)`,
                    holdTicks: (train.holdTicks || 0) + 1,
                  };
                } else {
                  // After 1 cycle, loop cleared: dispatch freight under caution
                  return {
                    ...train,
                    sectionIndex: nextIdx,
                    speed: 65,
                    delayMinutes: train.delayMinutes,
                    status: 'RUNNING',
                    statusNote: `Starter signal green: Dispatched from loop siding past ${STATIONS[nextIdx]?.name} at 65 km/h`,
                    holdTicks: 0,
                  };
                }
              } else {
                // High-priority Mail / Express / Rajdhani train: Piloted under Temporary Single Line Working (TSLW) or 30 km/h caution order
                return {
                  ...train,
                  sectionIndex: nextIdx,
                  speed: 30, // 30 km/h caution order
                  delayMinutes: train.delayMinutes + 1,
                  status: 'CAUTION',
                  statusNote: `Single-Line Working (TSLW): Piloted past ${STATIONS[nextIdx]?.name} work zone at 30 km/h`,
                  holdTicks: 0,
                };
              }
            } else {
              // Section is clear: run at full sectional speed
              const speedBase = train.type === 'RAJDHANI' || train.type === 'VANDE_BHARAT' ? 128 : train.type === 'MAIL_EXPRESS' ? 110 : 72;
              return {
                ...train,
                sectionIndex: nextIdx,
                speed: speedBase + Math.floor(Math.random() * 4),
                delayMinutes: Math.max(0, train.delayMinutes - 1),
                status: 'RUNNING',
                statusNote: `Clear signal at ${STATIONS[nextIdx]?.name}`,
                holdTicks: 0,
              };
            }
          } else {
            // DOWN train moves West to East (index decreases 7 -> 0)
            const nextIdx = (train.sectionIndex - 1 + numSections) % numSections;
            const targetSection = upSections[nextIdx];
            const dnSectionId = targetSection?.section_id.replace('_UP', '_DN');
            const hasBlockOnNext = dnSectionId && blocksBySection[dnSectionId];

            if (hasBlockOnNext) {
              return {
                ...train,
                sectionIndex: nextIdx,
                speed: 30, // 30 km/h caution order
                delayMinutes: train.delayMinutes + 1,
                status: 'CAUTION',
                statusNote: `Passing ${STATIONS[nextIdx]?.name} under 30 km/h caution order (DOWN Block Active)`,
                holdTicks: 0,
              };
            } else {
              return {
                ...train,
                sectionIndex: nextIdx,
                speed: 130,
                delayMinutes: Math.max(0, train.delayMinutes - 1),
                status: 'RUNNING',
                statusNote: `Clear signal at ${STATIONS[nextIdx]?.name}`,
                holdTicks: 0,
              };
            }
          }
        })
      );
    }, 6000);

    return () => clearInterval(timer);
  }, [upSections, blocksBySection]);

  const baseUpSection = upSections[selectedSectionIdx] || sections[0];
  const activeSectionId = selectedLine === 'UP'
    ? baseUpSection?.section_id
    : baseUpSection?.section_id.replace('_UP', '_DN');
  const activeSection = sections.find((s) => s.section_id === activeSectionId) || baseUpSection;
  const activeBlock = activeSectionId ? blocksBySection[activeSectionId] : null;

  // Check if any block exists on DOWN line
  const hasAnyDownBlock = Object.keys(blocksBySection).some((id) => id.endsWith('_DN'));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-6 shadow-xl">
      {/* Top Header & Telemetry */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>Interactive Live Corridor Route Map</span>
                <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Telemetry Active
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Physical railway line from Prayagraj to Kanpur. Click any track section to inspect signals, work blocks, and trains.
              </p>
            </div>
          </div>
        </div>

        {/* Visual Map Legend */}
        <div className="flex items-center gap-2 text-xs flex-wrap font-medium">
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"></span>
            <span>Clear Track (130 km/h)</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50"></span>
            <span>Maintenance Possession</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-slate-200">
            <Train className="w-3.5 h-3.5 text-blue-400" />
            <span>Moving Trains</span>
          </div>
        </div>
      </div>

      {/* Main Illuminated Route Mimic Canvas */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 overflow-x-auto shadow-inner space-y-6">
        <div className="min-w-[1080px] py-2 space-y-7">
          {/* Station Ruler: Shows all 9 Stations correctly placed! */}
          <div className="grid grid-cols-9 relative text-center">
            {STATIONS.map((station) => {
              return (
                <div key={station.code} className="flex flex-col items-center relative">
                  {/* Station Icon & Signal */}
                  <div className="w-9 h-9 rounded-xl border-2 border-slate-700 bg-slate-900 text-blue-400 flex items-center justify-center transition-all shadow-sm">
                    <Building2 className="w-4 h-4" />
                  </div>

                  <span className="font-bold text-xs text-slate-100 mt-2 truncate max-w-[100px]">
                    {station.name}
                  </span>
                  <span className="font-mono text-[10px] text-blue-400 font-bold">
                    {station.code}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500 mt-0.5">
                    Km {station.km}
                  </span>
                </div>
              );
            })}
          </div>

          {/* UP MAIN LINE (Prayagraj -> Kanpur Central, Westbound) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-200">
              <div className="flex items-center gap-2">
                <span className="bg-blue-600 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded flex items-center gap-1">
                  <span>UP MAIN</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
                <span>Westbound Trunk: Prayagraj Jn (PRYJ) ➔ Kanpur Central (CNB)</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Speed Limit: <strong>130 km/h</strong> • Automatic Block Signalling
              </span>
            </div>

            {/* 8 Track Blocks between the 9 stations */}
            <div className="grid grid-cols-8 gap-2 bg-slate-900/90 p-2.5 rounded-2xl border border-slate-800 relative">
              {upSections.map((sec, idx) => {
                const block = blocksBySection[sec.section_id];
                const isBlocked = !!block;
                const isApproved = block?.status === 'APPROVED';
                const isSelected = selectedSectionIdx === idx && selectedLine === 'UP';
                const trainsOnThisSection = trains.filter(
                  (t) => t.line === 'UP' && t.sectionIndex === idx
                );

                return (
                  <div
                    key={sec.section_id}
                    onClick={() => {
                      setSelectedSectionIdx(idx);
                      setSelectedLine('UP');
                      if (block) onSelectBlock(block);
                    }}
                    className={`relative rounded-xl h-24 p-2 transition-all cursor-pointer flex flex-col justify-between border ${
                      isSelected
                        ? 'ring-2 ring-blue-500 border-blue-400 shadow-xl'
                        : ''
                    } ${
                      isBlocked
                        ? isApproved
                          ? 'bg-amber-950/40 border-amber-600/70 hover:border-amber-400'
                          : 'bg-blue-950/40 border-blue-600/70 hover:border-blue-400'
                        : 'bg-emerald-950/20 border-emerald-500/20 hover:border-emerald-500/40'
                    }`}
                  >
                    {/* Top Status & Signal Aspect */}
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-slate-400">
                        Sec {idx + 1}
                      </span>

                      {/* Visual Signal Aspect */}
                      <div className="flex items-center gap-1 bg-slate-950 px-1.5 py-0.5 rounded-full border border-slate-800">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isBlocked
                              ? isApproved
                                ? 'bg-amber-400'
                                : 'bg-blue-400'
                              : 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                          }`}
                        />
                        <span className="text-[9px] font-mono font-bold text-slate-300">
                          {isBlocked ? (isApproved ? 'SCHED' : 'PLAN') : 'CLR'}
                        </span>
                      </div>
                    </div>

                    {/* Middle: Work Block Tag or Track Clear Status */}
                    {isBlocked ? (
                      <div className="text-center space-y-0.5">
                        <div className="flex items-center justify-center gap-1 text-amber-300 font-bold text-[10px] font-mono">
                          <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>{block.duration_minutes}m {isApproved ? 'SANCTIONED' : 'BLOCK'}</span>
                        </div>
                        <div className="text-[9px] text-slate-300 truncate font-semibold">
                          {block.start_time?.includes(' ') ? block.start_time.split(' ')[1] : block.start_time} IST • {block.departments.map((d) => d[0]).join('+')}
                        </div>
                        <div className="text-[8px] text-emerald-400 font-mono">
                          Track Clear Now (130K)
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <span className="text-[10px] font-bold text-emerald-400 font-mono">
                          ✓ CLEAR 130K
                        </span>
                        <div className="text-[9px] text-slate-500 font-mono">
                          {Number((sec.end_km - sec.start_km).toFixed(1))} km
                        </div>
                      </div>
                    )}

                    {/* Bottom: Click hint */}
                    <div className="text-[9px] text-center text-slate-500 font-mono">
                      {isBlocked ? 'Click to inspect' : 'Click section'}
                    </div>

                    {/* Animated Live Trains on this section */}
                    {trainsOnThisSection.map((t) => (
                      <div
                        key={t.id}
                        className={`absolute -top-3.5 left-2 right-2 z-20 py-1 px-2 rounded-lg flex items-center justify-between font-mono text-[9px] font-bold shadow-xl border ${
                          t.status === 'LOOPED'
                            ? 'bg-amber-600 border-amber-400 text-white'
                            : t.status === 'CAUTION'
                            ? 'bg-amber-700 border-amber-500 text-white'
                            : 'bg-blue-600 border-blue-400 text-white animate-pulse'
                        }`}
                      >
                        <div className="flex items-center gap-1 truncate">
                          <Train className="w-3 h-3 shrink-0" />
                          <span className="truncate">{t.id}</span>
                        </div>
                        <span className="shrink-0">{t.speed} km/h</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* DOWN MAIN LINE (Kanpur Central -> Prayagraj Jn, Eastbound) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <div className="flex items-center gap-2">
                <span className="bg-indigo-600 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" />
                  <span>DOWN MAIN</span>
                </span>
                <span>Eastbound Trunk: Kanpur Central (CNB) ➔ Prayagraj Jn (PRYJ)</span>
              </div>
              {hasAnyDownBlock ? (
                <span className="text-amber-400 font-mono text-[11px] flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  Active Possession on DOWN Track
                </span>
              ) : (
                <span className="text-emerald-400 font-mono text-[11px]">
                  ✓ All 8 Sections Fully Clear (Full 130 km/h)
                </span>
              )}
            </div>

            {/* 8 Track Blocks between the 9 stations on DOWN track */}
            <div className="grid grid-cols-8 gap-2 bg-slate-900/90 p-2.5 rounded-2xl border border-slate-800 relative">
              {upSections.map((sec, idx) => {
                const dnSecId = sec.section_id.replace('_UP', '_DN');
                const block = blocksBySection[dnSecId];
                const isBlocked = !!block;
                const isApproved = block?.status === 'APPROVED';
                const isSelected = selectedSectionIdx === idx && selectedLine === 'DOWN';
                const downTrainsOnThisSection = trains.filter(
                  (t) => t.line === 'DOWN' && t.sectionIndex === idx
                );

                return (
                  <div
                    key={`dn_${sec.section_id}`}
                    onClick={() => {
                      setSelectedSectionIdx(idx);
                      setSelectedLine('DOWN');
                      if (block) onSelectBlock(block);
                    }}
                    className={`relative rounded-xl h-24 p-2 transition-all cursor-pointer flex flex-col justify-between border ${
                      isSelected
                        ? 'ring-2 ring-indigo-500 border-indigo-400 shadow-xl'
                        : ''
                    } ${
                      isBlocked
                        ? isApproved
                          ? 'bg-amber-950/40 border-amber-600/70 hover:border-amber-400'
                          : 'bg-indigo-950/40 border-indigo-600/70 hover:border-indigo-400'
                        : 'bg-emerald-950/20 border-emerald-500/20 hover:border-emerald-500/40'
                    }`}
                  >
                    {/* Top Status & Signal Aspect */}
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-slate-400">
                        Sec {idx + 1}
                      </span>

                      {/* Visual Signal Aspect for DOWN Line */}
                      <div className="flex items-center gap-1 bg-slate-950 px-1.5 py-0.5 rounded-full border border-slate-800">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isBlocked
                              ? isApproved
                                ? 'bg-amber-400'
                                : 'bg-indigo-400'
                              : 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                          }`}
                        />
                        <span className="text-[9px] font-mono font-bold text-slate-300">
                          {isBlocked ? (isApproved ? 'SCHED' : 'PLAN') : 'CLR'}
                        </span>
                      </div>
                    </div>

                    {/* Middle: Work Block Tag or Track Clear Status */}
                    {isBlocked ? (
                      <div className="text-center space-y-0.5">
                        <div className="flex items-center justify-center gap-1 text-amber-300 font-bold text-[10px] font-mono">
                          <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>{block.duration_minutes}m {isApproved ? 'SANCTIONED' : 'BLOCK'}</span>
                        </div>
                        <div className="text-[9px] text-slate-300 truncate font-semibold">
                          {block.start_time?.includes(' ') ? block.start_time.split(' ')[1] : block.start_time} IST • {block.departments.map((d) => d[0]).join('+')}
                        </div>
                        <div className="text-[8px] text-emerald-400 font-mono">
                          Track Clear Now (130K)
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <span className="text-[10px] font-bold text-emerald-400 font-mono">
                          ✓ CLEAR 130K
                        </span>
                        <div className="text-[9px] text-slate-500 font-mono">
                          {Number((sec.end_km - sec.start_km).toFixed(1))} km
                        </div>
                      </div>
                    )}

                    {/* Bottom: Click hint */}
                    <div className="text-[9px] text-center text-slate-500 font-mono">
                      {isBlocked ? 'Click to inspect' : 'Click section'}
                    </div>

                    {/* Animated Live Trains on this DOWN section */}
                    {downTrainsOnThisSection.map((t) => (
                      <div
                        key={t.id}
                        className={`absolute -top-3.5 left-2 right-2 z-20 py-1 px-2 rounded-lg flex items-center justify-between font-mono text-[9px] font-bold shadow-xl border ${
                          t.status === 'LOOPED'
                            ? 'bg-amber-600 border-amber-400 text-white'
                            : t.status === 'CAUTION'
                            ? 'bg-amber-700 border-amber-500 text-white'
                            : 'bg-indigo-600 border-indigo-400 text-white animate-pulse'
                        }`}
                      >
                        <div className="flex items-center gap-1 truncate">
                          <Train className="w-3 h-3 shrink-0" />
                          <span className="truncate">{t.id}</span>
                        </div>
                        <span className="shrink-0">{t.speed} km/h</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Section Live Inspector Panel */}
      {activeSection && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className={`p-2 rounded-xl border ${selectedLine === 'UP' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'}`}>
                <Eye className="w-4 h-4" />
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-white">
                    Section Inspector: {activeSection.name}
                  </h3>
                  {/* Track line toggle buttons */}
                  <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setSelectedLine('UP')}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                        selectedLine === 'UP'
                          ? 'bg-blue-600 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      UP MAIN
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedLine('DOWN')}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                        selectedLine === 'DOWN'
                          ? 'bg-indigo-600 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      DOWN MAIN
                    </button>
                  </div>
                  <span className="text-[10px] font-mono bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-800">
                    {activeSection.section_id}
                  </span>
                </div>
                <span className="text-xs text-slate-400 mt-0.5 block">
                  Km {activeSection.start_km} to Km {activeSection.end_km} ({Number((activeSection.end_km - activeSection.start_km).toFixed(1))} km) • Traffic Density: {activeSection.traffic_density_gmt} GMT • Track: {selectedLine === 'UP' ? 'Westbound (PRYJ ➔ CNB)' : 'Eastbound (CNB ➔ PRYJ)'}
                </span>
              </div>
            </div>

            {activeBlock ? (
              <button
                onClick={() => onSelectBlock(activeBlock)}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
              >
                <span>Inspect Block Tasks ({activeBlock.tasks.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Line Clear (No Possession)
              </span>
            )}
          </div>

          {activeBlock ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Time Window</span>
                <span className="font-bold text-white text-xs mt-0.5 block">
                  {activeBlock.start_time} — {activeBlock.end_time?.includes(' ') ? activeBlock.end_time.split(' ')[1] : activeBlock.end_time} ({activeBlock.duration_minutes}m)
                </span>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Departments Bundled</span>
                <span className="font-bold text-blue-300 text-xs mt-0.5 block">
                  {activeBlock.departments.join(' + ')} ({activeBlock.tasks.length} repairs co-scheduled)
                </span>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Controller Status</span>
                <span className={`font-bold text-xs mt-0.5 block ${
                  activeBlock.status === 'APPROVED' ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {activeBlock.status === 'APPROVED' ? '✓ Approved & Sanctioned' : '⏳ Pending Review'}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 pt-1">
              This track section is clear. Express trains like the Rajdhani pass through at 130 km/h with zero speed restrictions.
            </p>
          )}
        </div>
      )}

      {/* Live Active Trains Telemetry Table */}
      <div className="space-y-3 pt-2 border-t border-slate-800">
        <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
          <Train className="w-4 h-4 text-blue-400" />
          <span>Active Trains Currently Tracked on Corridor:</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {trains.map((train) => (
            <div
              key={train.id}
              className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                    train.line === 'UP' ? 'bg-blue-500/10 text-blue-300 border-blue-500/30' : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                  }`}>
                    {train.line} MAIN
                  </span>
                  <span className="font-bold text-xs text-white">{train.id}</span>
                </div>

                <div className="font-mono text-xs font-bold text-slate-200 flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-slate-400" />
                  <span>{train.speed} km/h</span>
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-200 font-medium truncate">
                  {train.name}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Near: <strong className="text-blue-300">{sections[train.sectionIndex]?.name.split(' (')[0]}</strong>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 font-medium">Status:</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase font-mono ${
                    train.status === 'RUNNING'
                      ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30'
                      : train.status === 'CAUTION'
                      ? 'text-amber-400 bg-amber-500/10 border border-amber-500/30'
                      : 'text-rose-300 bg-rose-500/15 border border-rose-500/40'
                  }`}>
                    {train.status === 'LOOPED' ? 'LOOP SIDING (HELD)' : train.status}
                  </span>
                </div>
                <div className="text-[10px] text-slate-300 bg-slate-900 p-1.5 rounded-lg border border-slate-800 leading-relaxed font-sans">
                  {train.statusNote}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
