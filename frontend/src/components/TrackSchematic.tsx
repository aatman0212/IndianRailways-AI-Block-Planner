import React, { useState, useEffect } from 'react';
import { Section, ScheduledBlock } from '../types';
import { Train, ShieldAlert, Zap, Radio, AlertTriangle, Layers, Activity } from 'lucide-react';

interface Props {
  sections: Section[];
  blocks: ScheduledBlock[];
  onSelectBlock: (block: ScheduledBlock) => void;
}

interface SimulatedTrain {
  id: string;
  name: string;
  type: 'PASSENGER' | 'RAJDHANI' | 'FREIGHT';
  sectionIndex: number;
  speed: number;
  delayMinutes: number;
}

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
  // Simulated train movements ticking along the route
  const [trains, setTrains] = useState<SimulatedTrain[]>([
    { id: '12301', name: 'Howrah Rajdhani Express', type: 'RAJDHANI', sectionIndex: 0, speed: 128, delayMinutes: 0 },
    { id: '12417', name: 'Prayagraj Superfast Express', type: 'PASSENGER', sectionIndex: 3, speed: 110, delayMinutes: 3 },
    { id: 'BOXN-804', name: 'Coal Freight (BOXN-CC)', type: 'FREIGHT', sectionIndex: 6, speed: 62, delayMinutes: 8 },
  ]);

  // Periodic train progress animation tick
  useEffect(() => {
    const timer = setInterval(() => {
      setTrains((prev) =>
        prev.map((t) => ({
          ...t,
          sectionIndex: (t.sectionIndex + 1) % sections.length,
          speed: t.type === 'RAJDHANI' ? 120 + Math.floor(Math.random() * 10) : t.speed,
        }))
      );
    }, 12000);
    return () => clearInterval(timer);
  }, [sections.length]);

  // Map blocks to sections
  const blocksBySection = React.useMemo(() => {
    const map: Record<string, ScheduledBlock> = {};
    for (const b of blocks) {
      map[b.section_id] = b;
    }
    return map;
  }, [blocks]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <h2 className="text-lg font-bold text-slate-100 tracking-tight">
              Live Corridor Mimic & Track Schematics
            </h2>
            <span className="bg-sky-500/10 border border-sky-500/30 text-sky-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
              COA 2.0 DIGITAL TWIN
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Prayagraj (PRYJ) — Kanpur Central (CNB) 191 Km Continuous Automatic Block Section
          </p>
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-slate-400">Section Speed:</span>
            <span className="text-slate-200 font-bold">130 Kmph</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span className="text-slate-400">Traction:</span>
            <span className="text-amber-300 font-bold">25 kV AC OHE</span>
          </div>
        </div>
      </div>

      {/* Corridor Track Schematic Diagram */}
      <div className="overflow-x-auto pb-4">
        <div className="min-w-[960px] py-4">
          {/* Station Headers Ruler */}
          <div className="grid grid-cols-8 relative mb-6">
            {sections.map((sec, idx) => {
              const startStation = STATIONS[idx];
              const endStation = STATIONS[idx + 1];

              return (
                <div key={sec.section_id} className="relative flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-sky-400 ring-4 ring-sky-950 z-10"></div>
                  <span className="font-mono font-bold text-xs text-slate-200 mt-2">
                    {startStation?.code}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate max-w-[90px]">
                    {startStation?.name}
                  </span>
                  <span className="text-[9px] font-mono text-slate-600">
                    Km {startStation?.km}
                  </span>
                </div>
              );
            })}
          </div>

          {/* UP MAIN Physical Track Line */}
          <div className="relative my-6">
            <div className="text-[10px] font-mono font-bold uppercase text-slate-500 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-emerald-500"></span>
                UP MAIN LINE (Direction: PRYJ ➔ CNB)
              </span>
              <span className="text-slate-600 font-normal">Double Track High-Density Corridor</span>
            </div>

            {/* Continuous Track Bar */}
            <div className="grid grid-cols-8 gap-1.5 h-12 bg-slate-950 p-1.5 rounded-xl border border-slate-800 relative">
              {sections.map((sec, idx) => {
                const block = blocksBySection[sec.section_id];
                const isBlocked = !!block;
                const isApproved = block?.status === 'APPROVED';
                const trainOnSection = trains.find((t) => t.sectionIndex === idx);

                return (
                  <div
                    key={sec.section_id}
                    onClick={() => block && onSelectBlock(block)}
                    className={`relative rounded-lg h-full flex flex-col items-center justify-center transition-all cursor-pointer border ${
                      isBlocked
                        ? isApproved
                          ? 'bg-emerald-950/40 border-emerald-500/60 hover:border-emerald-400'
                          : 'bg-amber-950/40 border-amber-500/60 hover:border-amber-400 shadow-lg shadow-amber-950/20'
                        : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    {/* Active Block Hazard Overlay */}
                    {isBlocked ? (
                      <div className="text-center px-1">
                        <div className="flex items-center justify-center gap-1">
                          <AlertTriangle className={`w-3.5 h-3.5 ${isApproved ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`} />
                          <span className={`text-[10px] font-bold font-mono ${isApproved ? 'text-emerald-300' : 'text-amber-300'}`}>
                            {block.duration_minutes}m BLOCK
                          </span>
                        </div>
                        <div className="text-[9px] font-mono text-slate-400 truncate max-w-[100px]">
                          {block.departments.map((d) => d[0]).join('+')} ({block.tasks.length} tasks)
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] font-mono text-emerald-500/60 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        CLEAR
                      </div>
                    )}

                    {/* Animated Train Position Marker */}
                    {trainOnSection && (
                      <div
                        className={`absolute -top-3.5 z-20 px-2 py-0.5 rounded shadow-lg flex items-center gap-1 font-mono text-[9px] font-bold border transition-all animate-bounce ${
                          trainOnSection.type === 'RAJDHANI'
                            ? 'bg-rose-900 border-rose-400 text-rose-200'
                            : trainOnSection.type === 'FREIGHT'
                            ? 'bg-amber-900 border-amber-400 text-amber-200'
                            : 'bg-sky-900 border-sky-400 text-sky-200'
                        }`}
                      >
                        <Train className="w-3 h-3" />
                        <span>{trainOnSection.id}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* DOWN MAIN Physical Track Line */}
          <div className="relative my-4">
            <div className="text-[10px] font-mono font-bold uppercase text-slate-500 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-sky-500"></span>
                DOWN MAIN LINE (Direction: CNB ➔ PRYJ)
              </span>
              <span className="text-emerald-400 font-mono text-[10px]">ALL SECTIONS CLEAR (130 KMPH)</span>
            </div>

            <div className="grid grid-cols-8 gap-1.5 h-8 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
              {sections.map((sec) => (
                <div
                  key={`dn_${sec.section_id}`}
                  className="rounded-lg h-full bg-slate-900/40 border border-slate-800 flex items-center justify-center text-[9px] font-mono text-slate-600"
                >
                  CLEAR
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Live Active Trains Telemetry Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
        {trains.map((train) => (
          <div
            key={train.id}
            className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2 rounded-lg border ${
                  train.type === 'RAJDHANI'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    : train.type === 'FREIGHT'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                }`}
              >
                <Train className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200">
                  {train.id} • {train.name}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  At: {sections[train.sectionIndex]?.name.split(' (')[0]}
                </div>
              </div>
            </div>

            <div className="text-right font-mono">
              <div className="text-xs font-bold text-emerald-400">{train.speed} km/h</div>
              <div className="text-[10px] text-slate-400">
                {train.delayMinutes === 0 ? 'On Time' : `+${train.delayMinutes}m`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
