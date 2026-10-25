import React, { useState, useEffect, useMemo } from 'react';
import { Section, ScheduledBlock, Department } from '../types';
import {
  Layers,
  ShieldAlert,
  Zap,
  Radio,
  Eye,
  Calendar,
  List,
  CheckCircle2,
  Clock,
  MapPin,
  ArrowRight,
  Moon,
  Sun,
  Train,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';

interface Props {
  sections: Section[];
  blocks: ScheduledBlock[];
  onSelectBlock: (block: ScheduledBlock) => void;
  selectedBlockId: string | null;
  initialStatusFilter?: 'ALL' | 'APPROVED' | 'PENDING';
}

const DEPT_BADGES: Record<Department, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  ENGINEERING: {
    label: 'Track Team',
    icon: <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />,
    color: 'text-emerald-300 border-emerald-500/40',
    bg: 'bg-emerald-500/10',
  },
  TRD: {
    label: 'Overhead Wire (OHE)',
    icon: <Zap className="w-3.5 h-3.5 text-amber-400" />,
    color: 'text-amber-300 border-amber-500/40',
    bg: 'bg-amber-500/10',
  },
  ST: {
    label: 'Signal Team',
    icon: <Radio className="w-3.5 h-3.5 text-purple-400" />,
    color: 'text-purple-300 border-purple-500/40',
    bg: 'bg-purple-500/10',
  },
};

const HOURS = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];

const getStartStation = (name?: string, fallback = 'Start') => {
  if (!name) return fallback;
  const parts = name.split(' (')[0].split(' - ');
  return parts[0]?.trim() || fallback;
};

const getEndStation = (name?: string, fallback = 'End') => {
  if (!name) return fallback;
  const parts = name.split(' (')[0].split(' - ');
  return parts[1]?.trim() || fallback;
};

const formatTimeWindow = (start: string, end: string) => {
  const s = start?.includes(' ') ? start.split(' ')[1] : start;
  const e = end?.includes(' ') ? end.split(' ')[1] : end;
  return `${s || start} — ${e || end}`;
};

const getDayLabel = (startTime: string) => {
  try {
    const blockDate = startTime.split(' ')[0];
    const today = new Date().toISOString().split('T')[0];
    if (blockDate === today) return 'Tonight (Day 1)';
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (blockDate === tomorrow.toISOString().split('T')[0]) return 'Tomorrow (Day 2)';
    return blockDate;
  } catch {
    return 'Tonight';
  }
};

export const CorridorGantt: React.FC<Props> = ({
  sections,
  blocks,
  onSelectBlock,
  selectedBlockId,
  initialStatusFilter = 'ALL',
}) => {
  const [filterBundledOnly, setFilterBundledOnly] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'CARDS' | 'TIMELINE'>('CARDS');
  const [sortBy, setSortBy] = useState<'PRIORITY' | 'TIME'>('PRIORITY');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'PENDING'>(initialStatusFilter);
  const [lineFilter, setLineFilter] = useState<'ALL' | 'UP' | 'DOWN'>('ALL');

  // Synchronize when initialStatusFilter changes from parent (e.g. clicking top navigation tab)
  useEffect(() => {
    if (initialStatusFilter) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  const allBlocksSorted = useMemo(() => {
    let list = [...blocks];
    if (filterBundledOnly) {
      list = list.filter((b) => b.is_bundled);
    }
    if (lineFilter === 'UP') {
      list = list.filter((b) => b.section_id.endsWith('_UP') || !b.section_id.endsWith('_DN'));
    } else if (lineFilter === 'DOWN') {
      list = list.filter((b) => b.section_id.endsWith('_DN'));
    }

    if (sortBy === 'PRIORITY') {
      list.sort((a, b) => {
        const aEmerg = a.tasks.some((t) => t.severity === 'EMERGENCY') ? 1 : 0;
        const bEmerg = b.tasks.some((t) => t.severity === 'EMERGENCY') ? 1 : 0;
        if (aEmerg !== bEmerg) return bEmerg - aEmerg;
        return (b.total_priority_value || 0) - (a.total_priority_value || 0);
      });
    } else {
      list.sort((a, b) => a.start_time.localeCompare(b.start_time));
    }
    return list;
  }, [blocks, filterBundledOnly, lineFilter, sortBy]);

  const approvedBlocks = useMemo(
    () => allBlocksSorted.filter((b) => b.status === 'APPROVED'),
    [allBlocksSorted]
  );

  const pendingBlocks = useMemo(
    () => allBlocksSorted.filter((b) => b.status !== 'APPROVED'),
    [allBlocksSorted]
  );

  const totalApprovedCount = approvedBlocks.length;
  const totalPendingCount = pendingBlocks.length;

  const totalApprovedMinutes = useMemo(
    () => approvedBlocks.reduce((acc, b) => acc + (b.duration_minutes || 0), 0),
    [approvedBlocks]
  );

  const displayedBlocks = useMemo(() => {
    if (statusFilter === 'APPROVED') return approvedBlocks;
    if (statusFilter === 'PENDING') return pendingBlocks;
    return allBlocksSorted;
  }, [statusFilter, approvedBlocks, pendingBlocks, allBlocksSorted]);

  const filteredSections = useMemo(() => {
    if (lineFilter === 'UP') {
      return sections.filter((s) => s.line_type === 'UP_MAIN' || s.section_id.endsWith('_UP'));
    }
    if (lineFilter === 'DOWN') {
      return sections.filter((s) => s.line_type === 'DN_MAIN' || s.section_id.endsWith('_DN'));
    }
    return sections;
  }, [sections, lineFilter]);

  const sectionMap = useMemo(() => {
    const map: Record<string, Section> = {};
    for (const s of sections) map[s.section_id] = s;
    return map;
  }, [sections]);

  const blocksBySection = useMemo(() => {
    const map: Record<string, ScheduledBlock[]> = {};
    for (const b of displayedBlocks) {
      if (!map[b.section_id]) map[b.section_id] = [];
      map[b.section_id].push(b);
    }
    return map;
  }, [displayedBlocks]);

  // Card component renderer
  const renderBlockCard = (b: ScheduledBlock, isApprovedCard: boolean) => {
    const sec = sectionMap[b.section_id];
    const isSelected = selectedBlockId === b.block_id;
    const isNight = b.start_time.includes('01:') || b.start_time.includes('02:') || b.start_time.includes('03:') || b.start_time.includes('04:');
    const hasEmergency = b.tasks.some((t) => t.severity === 'EMERGENCY');

    return (
      <div
        key={b.block_id}
        onClick={() => onSelectBlock(b)}
        className={`rounded-2xl border p-5 transition-all cursor-pointer flex flex-col justify-between gap-4 text-left relative overflow-hidden group ${
          isSelected
            ? 'bg-slate-850 border-blue-500 shadow-xl ring-2 ring-blue-500/40'
            : isApprovedCard
            ? 'bg-gradient-to-br from-emerald-950/25 via-slate-950 to-slate-950 border-emerald-600/70 hover:border-emerald-400 shadow-lg shadow-emerald-950/30'
            : hasEmergency
            ? 'bg-red-950/20 border-red-500/80 hover:border-red-400 shadow-lg shadow-red-950/40 ring-1 ring-red-500/40'
            : 'bg-slate-950/90 border-slate-800 hover:border-blue-500/80 shadow-md'
        }`}
      >
        {/* Approved Ribbon Header */}
        {isApprovedCard && (
          <div className="bg-emerald-950/80 border-b border-emerald-500/40 px-5 py-2 -mx-5 -mt-5 mb-1 flex items-center justify-between text-[11px] font-mono text-emerald-300">
            <span className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>OFFICIALLY SANCTIONED CORRIDOR POSSESSION</span>
            </span>
            <span className="bg-emerald-500/20 border border-emerald-500/40 text-[10px] px-2 py-0.5 rounded font-bold">
              PERMIT: NCR-PRYJ-{b.block_id.replace('BLK_', '')}
            </span>
          </div>
        )}

        {/* Top Window Strip */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono font-bold text-blue-300 bg-blue-500/10 border border-blue-500/30 px-1.5 py-0.5 rounded">
              {getDayLabel(b.start_time)}
            </span>

            <div
              className={`p-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 ${
                isNight
                  ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              }`}
            >
              {isNight ? <Moon className="w-3.5 h-3.5 text-indigo-400" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
              <span>{formatTimeWindow(b.start_time, b.end_time)}</span>
            </div>

            <span className="text-xs font-mono font-bold text-slate-300 bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
              {b.duration_minutes}m ({Math.floor(b.duration_minutes / 60)}h {b.duration_minutes % 60}m)
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {hasEmergency && (
              <span className="bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                <AlertTriangle className="w-3 h-3" /> Emergency Possession
              </span>
            )}

            <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
              {b.tasks.length > 1
                ? `Combined Yield: ${b.total_priority_value} pts (${b.tasks.length} tasks)`
                : `Priority: ${b.total_priority_value}/100`}
            </span>

            {b.block_id.includes('MEGA_BLOCK') && (
              <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                ★ Mega Block
              </span>
            )}

            {b.is_bundled && (
              <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Layers className="w-3 h-3" /> Bundled
              </span>
            )}

            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                isApprovedCard
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}
            >
              {isApprovedCard ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              {isApprovedCard ? 'Sanctioned' : 'Pending Review'}
            </span>
          </div>
        </div>

        {/* Section & Physical Track Visualization */}
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="flex items-center gap-1.5 font-bold text-slate-200">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              {sec?.name || b.section_id}
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                  b.section_id.endsWith('_DN') || sec?.line_type === 'DN_MAIN'
                    ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                    : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                }`}
              >
                {b.section_id.endsWith('_DN') || sec?.line_type === 'DN_MAIN' ? 'DOWN MAIN' : 'UP MAIN'}
              </span>
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              Km {sec?.start_km ?? '--'} ➔ Km {sec?.end_km ?? '--'}
            </span>
          </div>

          {/* Visual Railway Track Segment */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 my-2 flex items-center justify-between text-xs">
            <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              {getStartStation(sec?.name)}
            </span>

            <div className="flex-1 mx-3 flex items-center">
              <div className="h-1 bg-slate-800 flex-1 relative flex items-center justify-center">
                {hasEmergency ? (
                  <div className="px-2 py-0.5 bg-red-500/20 border border-red-500/50 text-red-300 rounded text-[9px] font-mono font-bold flex items-center gap-1 shadow-sm animate-pulse">
                    <span>🚨 CRITICAL DEFECT WORK ZONE</span>
                  </div>
                ) : isApprovedCard ? (
                  <div className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 rounded text-[9px] font-mono font-bold flex items-center gap-1 shadow-sm">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>TRACK POSSESSION SANCTIONED</span>
                  </div>
                ) : (
                  <div className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded text-[9px] font-mono font-bold flex items-center gap-1 shadow-sm">
                    <span>🚧 RECOMMENDED WORK ZONE</span>
                  </div>
                )}
              </div>
            </div>

            <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              {getEndStation(sec?.name)}
            </span>
          </div>

          {/* Prominent Sanctioned Block Possession Schedule */}
          {isApprovedCard && (
            <div className="bg-emerald-950/60 border border-emerald-500/50 rounded-xl px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs font-mono text-emerald-200 shadow-sm mt-2">
              <span className="flex items-center gap-2 font-bold text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>TRACK BLOCKED: {b.start_time} ➔ {b.end_time?.includes(' ') ? b.end_time.split(' ')[1] : b.end_time} IST</span>
              </span>
              <span className="text-emerald-400/90 text-[11px]">
                Authority: <strong>{b.approved_by || 'Chief Controller Prayagraj'}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Multi-Team Tasks Inside This Block */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Teams Working Inside This Window ({b.tasks.length}):</span>
            <span className="text-emerald-400 text-[10px] font-sans">Single Track Closure</span>
          </div>

          <div className="space-y-1.5">
            {b.tasks.map((task) => {
              const dept = DEPT_BADGES[task.department];
              return (
                <div
                  key={task.task_id}
                  className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 shrink-0 ${dept.bg} ${dept.color}`}>
                      {dept.icon}
                      {dept.label}
                    </span>
                    <span className="text-xs font-medium text-slate-200 truncate flex items-center gap-1.5">
                      <span>{task.title}</span>
                      {task.severity === 'EMERGENCY' && (
                        <span className="bg-red-500/20 text-red-300 border border-red-500/30 text-[9px] px-1.5 py-0.2 rounded font-bold shrink-0">
                          Emergency ({task.priority_score} pts)
                        </span>
                      )}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 shrink-0">
                    {task.min_duration_minutes}m
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <Train className="w-3.5 h-3.5 text-blue-400" />
            <span>Passenger delay: <strong>0 mins</strong> (night lull / looped)</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectBlock(b);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isApprovedCard
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30'
            }`}
          >
            <span>{isApprovedCard ? '✓ View Sanctioned Permit' : 'Review & Approve Permit'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-lg">
      {/* Top Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>24-Hour Corridor Maintenance Schedule</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Every card below is a planned track closure. Multiple teams work together in each slot.
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher & Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Status Filter Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>All Blocks</span>
              <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.2 rounded-full">
                {allBlocksSorted.length}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('APPROVED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                statusFilter === 'APPROVED'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : totalApprovedCount > 0
                  ? 'text-emerald-400 hover:text-emerald-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approved</span>
              <span
                className={`font-mono text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  statusFilter === 'APPROVED'
                    ? 'bg-emerald-800 text-white'
                    : totalApprovedCount > 0
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {totalApprovedCount}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                statusFilter === 'PENDING'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Needs Review</span>
              <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.2 rounded-full">
                {totalPendingCount}
              </span>
            </button>
          </div>

          {/* Line Filter (ALL / UP MAIN / DOWN MAIN) */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setLineFilter('ALL')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                lineFilter === 'ALL'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Both Lines
            </button>
            <button
              onClick={() => setLineFilter('UP')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                lineFilter === 'UP'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-blue-400/80 hover:text-blue-300'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              UP Line
            </button>
            <button
              onClick={() => setLineFilter('DOWN')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                lineFilter === 'DOWN'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-indigo-400/80 hover:text-indigo-300'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
              DOWN Line
            </button>
          </div>

          {/* View Toggle (Cards vs Timeline) */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('CARDS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'CARDS'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Card Deck View</span>
            </button>
            <button
              onClick={() => setViewMode('TIMELINE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'TIMELINE'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>24h Timeline Chart</span>
            </button>
          </div>

          {/* Sort By Toggle (Priority vs Time) */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setSortBy('PRIORITY')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                sortBy === 'PRIORITY'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Priority First</span>
            </button>
            <button
              onClick={() => setSortBy('TIME')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                sortBy === 'TIME'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Time Order</span>
            </button>
          </div>

          {/* Bundled Filter */}
          <button
            onClick={() => setFilterBundledOnly(!filterBundledOnly)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              filterBundledOnly
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{filterBundledOnly ? 'Bundled Only' : 'Show Only Bundled'}</span>
          </button>
        </div>
      </div>

      {/* Visual Instruction Banner */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl px-4 py-3 text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping"></span>
          <span>
            <strong>How to read:</strong> Approved possessions are officially scheduled for corridor track closure. Unapproved blocks await Chief Controller review.
          </span>
        </div>
        <div className="text-slate-400 text-[11px] font-medium flex items-center gap-2 shrink-0">
          <span>Click any card to inspect reasoning & sanction permit</span>
          <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
        </div>
      </div>

      {/* VIEW 1: CARD DECK VIEW */}
      {viewMode === 'CARDS' && (
        <div className="space-y-8 pt-1">
          {/* SECTION 1: DEDICATED OFFICIALLY SANCTIONED CORRIDOR POSSESSIONS SECTION */}
          {(statusFilter === 'ALL' || statusFilter === 'APPROVED') && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-emerald-950/60 via-slate-950 to-slate-950 border border-emerald-500/40 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-300 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                        <span>Officially Sanctioned Corridor Possessions</span>
                      </h3>
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {approvedBlocks.length} Sanctioned
                      </span>
                    </div>
                    <p className="text-xs text-emerald-300/80 mt-0.5">
                      G&SR 15.06 Rules Enforced • Track closures locked with Caution Order Form T/409 & Disconnection Memos.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs bg-slate-900/90 px-3.5 py-2 rounded-xl border border-emerald-500/30 shrink-0">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span className="text-slate-300">Sanctioned Possession Time:</span>
                  <span className="font-bold text-emerald-400">
                    {totalApprovedMinutes} mins ({Math.floor(totalApprovedMinutes / 60)}h {totalApprovedMinutes % 60}m)
                  </span>
                </div>
              </div>

              {approvedBlocks.length === 0 ? (
                <div className="bg-slate-950/80 border border-dashed border-slate-800 rounded-2xl p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-200">No Corridor Possessions Sanctioned Yet</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    There are currently {pendingBlocks.length} AI-recommended block possessions awaiting controller review. Review and approve any block to issue official possession permits.
                  </p>
                  <button
                    onClick={() => setStatusFilter('PENDING')}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <span>Inspect Pending Blocks ({pendingBlocks.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {approvedBlocks.map((b) => renderBlockCard(b, true))}
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: AI-RECOMMENDED CORRIDOR POSSESSIONS AWAITING SANCTION */}
          {(statusFilter === 'ALL' || statusFilter === 'PENDING') && (
            <div className="space-y-4 pt-2">
              <div className="bg-gradient-to-r from-amber-950/30 via-slate-950 to-slate-950 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-300 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                        <span>AI-Recommended Possessions Awaiting Sanction</span>
                      </h3>
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        {pendingBlocks.length} Pending Review
                      </span>
                    </div>
                    <p className="text-xs text-amber-300/80 mt-0.5">
                      Multi-department bundled windows generated by AI optimizer. Chief Controller review and sign-off required.
                    </p>
                  </div>
                </div>

                <div className="text-xs text-slate-400 font-mono bg-slate-900/90 px-3.5 py-2 rounded-xl border border-slate-800 shrink-0">
                  <span>Click any card below to review and approve</span>
                </div>
              </div>

              {pendingBlocks.length === 0 ? (
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-200">All Corridor Blocks Sanctioned</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    All recommended track maintenance possessions have been officially approved by the Chief Controller. All active caution orders are listed in the Approved Section.
                  </p>
                  <button
                    onClick={() => setStatusFilter('APPROVED')}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer"
                  >
                    <span>View Approved Possessions ({approvedBlocks.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingBlocks.map((b) => renderBlockCard(b, false))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: 24-HOUR TIMELINE VISUAL CHART */}
      {viewMode === 'TIMELINE' && (
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[960px]">
            {/* Timeline Hours Bar */}
            <div className="grid grid-cols-12 text-xs font-mono font-medium text-slate-400 pb-2 border-b border-slate-800 pl-64">
              {HOURS.map((hr) => (
                <div key={hr} className="text-center">
                  {hr}
                </div>
              ))}
            </div>

            {/* Section Rows */}
            <div className="divide-y divide-slate-800/60 pt-2">
              {filteredSections.map((section) => {
                const secBlocks = blocksBySection[section.section_id] || [];
                const isDownLine = section.line_type === 'DN_MAIN' || section.section_id.endsWith('_DN');

                return (
                  <div
                    key={section.section_id}
                    className="flex items-center py-2.5 hover:bg-slate-950/40 transition-colors rounded-xl"
                  >
                    {/* Section Label */}
                    <div className="w-64 shrink-0 pr-4">
                      <div className="text-xs font-bold text-slate-200 truncate flex items-center gap-1.5">
                        <span className="truncate">{section.name}</span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded border shrink-0 ${
                            isDownLine
                              ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                              : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                          }`}
                        >
                          {isDownLine ? 'DOWN' : 'UP'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
                        <span>Km {section.start_km} – {section.end_km}</span>
                        <span className="text-slate-600">•</span>
                        <span>{section.traffic_density_gmt} GMT Density</span>
                      </div>
                    </div>

                    {/* Timeline Slot Track */}
                    <div className="flex-1 relative h-14 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex items-center px-2">
                      {/* Night Lull Shading (01:00 - 05:00) */}
                      <div className="absolute left-[4.1%] w-[16.6%] h-full bg-blue-950/20 border-r border-l border-blue-900/40 pointer-events-none flex items-start justify-center pt-1">
                        <span className="text-[9px] font-mono font-semibold text-blue-400/90 flex items-center gap-1">
                          <Moon className="w-2.5 h-2.5" /> NIGHT LULL (01:00 - 05:00)
                        </span>
                      </div>

                      {secBlocks.length === 0 ? (
                        <div className="text-[11px] font-mono text-slate-500 pl-4">
                          ✓ Clear Track (No closures)
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 relative z-10 w-full">
                          {secBlocks.map((b) => {
                            const isSelected = selectedBlockId === b.block_id;
                            const isApproved = b.status === 'APPROVED';

                            return (
                              <div
                                key={b.block_id}
                                onClick={() => onSelectBlock(b)}
                                className={`cursor-pointer rounded-xl px-3 py-2 transition-all border flex items-center justify-between gap-3 text-left ${
                                  isSelected
                                    ? 'border-blue-500 bg-slate-800 shadow-xl ring-2 ring-blue-500'
                                    : isApproved
                                    ? 'bg-emerald-950/40 border-emerald-500/70 hover:border-emerald-400'
                                    : 'bg-slate-900/90 border-slate-700 hover:border-blue-400'
                                }`}
                                style={{ minWidth: `${Math.max(240, b.duration_minutes * 1.5)}px` }}
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-xs font-bold text-slate-200">
                                      {b.block_id.replace('BLK_', 'Block ')}
                                    </span>
                                    {b.is_bundled && (
                                      <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                                        ★ Bundled
                                      </span>
                                    )}
                                    <span
                                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                                        isApproved
                                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                      }`}
                                    >
                                      {isApproved ? 'Sanctioned' : 'Pending'}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {b.departments.map((dept) => {
                                      const badge = DEPT_BADGES[dept];
                                      return (
                                        <span
                                          key={dept}
                                          className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ${badge.color} ${badge.bg}`}
                                        >
                                          {badge.icon}
                                          {badge.label}
                                        </span>
                                      );
                                    })}
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {b.duration_minutes}m ({b.tasks.length} tasks)
                                    </span>
                                  </div>
                                </div>

                                <div className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors">
                                  <Eye className="w-4 h-4" />
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
      )}
    </div>
  );
};
