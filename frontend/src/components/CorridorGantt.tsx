import React, { useState } from 'react';
import { Section, ScheduledBlock, Department } from '../types';
import { Clock, Layers, ShieldAlert, Zap, Radio, CheckCircle2, AlertTriangle, Eye } from 'lucide-react';

interface Props {
  sections: Section[];
  blocks: ScheduledBlock[];
  onSelectBlock: (block: ScheduledBlock) => void;
  selectedBlockId: string | null;
}

const DEPT_BADGES: Record<Department, { label: string; icon: React.ReactNode; bg: string; border: string; text: string }> = {
  ENGINEERING: {
    label: 'Track',
    icon: <ShieldAlert className="w-3 h-3 text-emerald-400" />,
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/30',
    text: 'text-emerald-300',
  },
  TRD: {
    label: 'OHE',
    icon: <Zap className="w-3 h-3 text-amber-400" />,
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/30',
    text: 'text-amber-300',
  },
  ST: {
    label: 'Signal',
    icon: <Radio className="w-3 h-3 text-purple-400" />,
    bg: 'bg-purple-500/15',
    border: 'border-purple-500/30',
    text: 'text-purple-300',
  },
};

// 24 Hour timeline hours
const HOURS = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];

export const CorridorGantt: React.FC<Props> = ({
  sections,
  blocks,
  onSelectBlock,
  selectedBlockId,
}) => {
  const [filterBundledOnly, setFilterBundledOnly] = useState<boolean>(false);

  const displayedBlocks = filterBundledOnly ? blocks.filter((b) => b.is_bundled) : blocks;

  // Group blocks by section
  const blocksBySection = React.useMemo(() => {
    const map: Record<string, ScheduledBlock[]> = {};
    for (const b of displayedBlocks) {
      if (!map[b.section_id]) map[b.section_id] = [];
      map[b.section_id].push(b);
    }
    return map;
  }, [displayedBlocks]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
      {/* Top Controls & Legend */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse"></span>
            <h2 className="text-lg font-bold text-slate-100 tracking-tight">
              24-Hour Corridor Possession Matrix (COA Master Timetable)
            </h2>
            <span className="bg-slate-800 text-slate-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-slate-700">
              UP MAIN LINE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Synchronized corridor block allocation. Multi-department co-scheduled blocks are highlighted with joint badges.
          </p>
        </div>

        {/* Filters & Department Legends */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <button
            onClick={() => setFilterBundledOnly(!filterBundledOnly)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              filterBundledOnly
                ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            {filterBundledOnly ? 'Showing Bundled Only' : 'Filter Bundled Only'}
          </button>

          <div className="h-4 w-px bg-slate-800 hidden sm:block"></div>

          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded bg-emerald-500"></span> Track
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <span className="w-2 h-2 rounded bg-amber-500"></span> OHE
            </span>
            <span className="flex items-center gap-1 text-purple-400">
              <span className="w-2 h-2 rounded bg-purple-500"></span> Signal
            </span>
          </div>
        </div>
      </div>

      {/* Gantt Timeline Visual Ruler */}
      <div className="overflow-x-auto pb-4">
        <div className="min-w-[900px]">
          {/* Timeline Hours Bar */}
          <div className="grid grid-cols-12 text-[10px] font-mono font-bold text-slate-500 pb-2 border-b border-slate-800 pl-64">
            {HOURS.map((hr) => (
              <div key={hr} className="text-center">
                {hr}
              </div>
            ))}
          </div>

          {/* Section Rows */}
          <div className="divide-y divide-slate-800/60 pt-2">
            {sections.map((section) => {
              const secBlocks = blocksBySection[section.section_id] || [];

              return (
                <div
                  key={section.section_id}
                  className="flex items-center py-3 hover:bg-slate-950/40 transition-colors rounded-lg group"
                >
                  {/* Section Label Header */}
                  <div className="w-64 shrink-0 pr-4">
                    <div className="text-xs font-bold text-slate-200 group-hover:text-sky-300 transition-colors">
                      {section.name}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 mt-0.5">
                      <span>Km {section.start_km} – {section.end_km}</span>
                      <span className="text-sky-400/80">({section.traffic_density_gmt} GMT)</span>
                    </div>
                  </div>

                  {/* Visual 24h Timeline Slot Area */}
                  <div className="flex-1 relative h-14 bg-slate-950/70 border border-slate-800/80 rounded-xl overflow-hidden flex items-center px-2">
                    {/* Background Shift Shading (Night Maintenance Lull 01:00 - 05:00) */}
                    <div className="absolute left-[4.1%] w-[16.6%] h-full bg-indigo-950/20 border-r border-l border-indigo-500/10 pointer-events-none flex items-start justify-center pt-1">
                      <span className="text-[8px] font-mono uppercase text-indigo-400/40 font-bold">
                        NIGHT TRAFFIC LULL (01:00 - 05:00)
                      </span>
                    </div>

                    {/* Scheduled Blocks */}
                    {secBlocks.length === 0 ? (
                      <div className="text-[10px] font-mono text-slate-700 italic pl-4">
                        Clear Path (No possession active)
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 relative z-10 w-full">
                        {secBlocks.map((b) => {
                          const isSelected = selectedBlockId === b.block_id;
                          const isApproved = b.status === 'APPROVED';

                          return (
                            <div
                              key={b.block_id}
                              onClick={() => onSelectBlock(b)}
                              className={`cursor-pointer rounded-lg p-2.5 transition-all border flex items-center justify-between gap-3 text-left ${
                                isSelected
                                  ? 'ring-2 ring-sky-400 border-sky-500 bg-slate-800 shadow-lg'
                                  : isApproved
                                  ? 'bg-emerald-950/30 border-emerald-600/50 hover:border-emerald-400'
                                  : 'bg-slate-900 border-slate-700/80 hover:border-slate-500'
                              }`}
                              style={{ minWidth: `${Math.max(220, b.duration_minutes * 1.4)}px` }}
                            >
                              <div className="space-y-1">
                                {/* Title & Status */}
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-bold text-slate-200">
                                    {b.block_id.replace('BLK_', '')}
                                  </span>
                                  {b.is_bundled && (
                                    <span className="bg-sky-500/20 text-sky-300 border border-sky-400/40 text-[9px] font-bold px-1.5 py-0.2 rounded flex items-center gap-1">
                                      <Layers className="w-2.5 h-2.5" /> Bundled
                                    </span>
                                  )}
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                      isApproved
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                        : 'bg-slate-800 text-slate-400'
                                    }`}
                                  >
                                    {b.status}
                                  </span>
                                </div>

                                {/* Department Badges */}
                                <div className="flex items-center gap-1">
                                  {b.departments.map((dept) => {
                                    const badge = DEPT_BADGES[dept];
                                    return (
                                      <span
                                        key={dept}
                                        className={`inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded border ${badge.bg} ${badge.border} ${badge.text}`}
                                      >
                                        {badge.icon}
                                        {badge.label}
                                      </span>
                                    );
                                  })}
                                  <span className="text-[10px] text-slate-400 font-mono pl-1">
                                    {b.duration_minutes}m ({b.tasks.length} tasks)
                                  </span>
                                </div>
                              </div>

                              {/* Inspect CTA Icon */}
                              <div className="p-1 rounded bg-slate-800/80 text-slate-400 hover:text-sky-300">
                                <Eye className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
