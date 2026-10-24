import React, { useState } from 'react';
import { Section, Department, ScheduledBlock } from '../types';
import {
  X,
  Calendar,
  Clock,
  Sparkles,
  ShieldAlert,
  Zap,
  Radio,
  MapPin,
  ArrowRight,
  ArrowLeft,
  CalendarPlus,
  Layers,
  Send,
  CheckCircle2,
  Moon,
  Sun,
  AlertOctagon,
} from 'lucide-react';

interface Props {
  sections: Section[];
  isOpen: boolean;
  onClose: () => void;
  onBlockScheduled: (newBlockCount: number, message: string) => void;
}

const CORRIDOR_STATION_PAIRS = [
  { baseId: 'SEC_PRG_SFG', name: 'Prayagraj Jn ➔ Subedarganj', from: 'PRYJ', to: 'SFG', km: 'Km 827.0 – 831.5', secNo: 1 },
  { baseId: 'SEC_SFG_MRE', name: 'Subedarganj ➔ Manauri', from: 'SFG', to: 'MRE', km: 'Km 831.5 – 845.2', secNo: 2 },
  { baseId: 'SEC_MRE_BRE', name: 'Manauri ➔ Bharwari', from: 'MRE', to: 'BRE', km: 'Km 845.2 – 865.8', secNo: 3 },
  { baseId: 'SEC_BRE_SRO', name: 'Bharwari ➔ Sirathu', from: 'BRE', to: 'SRO', km: 'Km 865.8 – 888.4', secNo: 4 },
  { baseId: 'SEC_SRO_KGA', name: 'Sirathu ➔ Khaga', from: 'SRO', to: 'KGA', km: 'Km 888.4 – 914.6', secNo: 5 },
  { baseId: 'SEC_KGA_FTP', name: 'Khaga ➔ Fatehpur', from: 'KGA', to: 'FTP', km: 'Km 914.6 – 945.0', secNo: 6 },
  { baseId: 'SEC_FTP_BKO', name: 'Fatehpur ➔ Bindki Road', from: 'FTP', to: 'BKO', km: 'Km 945.0 – 977.3', secNo: 7 },
  { baseId: 'SEC_BKO_CNB', name: 'Bindki Road ➔ Kanpur Central', from: 'BKO', to: 'CNB', km: 'Km 977.3 – 1018.0', secNo: 8 },
];

// Local date/time formatting helpers (ensures correct IST local date/time without UTC shifting)
const getLocalDateString = (d: Date = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getLocalTimeString = (d: Date = new Date()) => {
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const ScheduleFutureBlockModal: React.FC<Props> = ({
  sections,
  isOpen,
  onClose,
  onBlockScheduled,
}) => {
  // Step 1: Location & Direction
  const [stationBase, setStationBase] = useState<string>('SEC_PRG_SFG'); // Default Section 1
  const [lineDirection, setLineDirection] = useState<'UP' | 'DN'>('UP');

  // Step 2: Time Window
  const todayStr = getLocalDateString();
  const currentTimeStr = getLocalTimeString();
  const [blockDate, setBlockDate] = useState<string>(todayStr);
  const [startTime, setStartTime] = useState<string>('01:30');
  const [endTime, setEndTime] = useState<string>('03:30');
  const [durationMinutes, setDurationMinutes] = useState<number>(120);

  // Step 3: Classification & Departments
  const [blockType, setBlockType] = useState<string>('MEGA_BLOCK');
  const [selectedDepts, setSelectedDepts] = useState<Department[]>(['ENGINEERING', 'TRD', 'ST']);
  const [plannerNotes, setPlannerNotes] = useState<string>(
    'Planned Mega Block scheduled in advance for multi-department corridor overhaul.'
  );
  const [pullPendingTasks, setPullPendingTasks] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeSectionId = `${stationBase}_${lineDirection}`;
  const currentStation = CORRIDOR_STATION_PAIRS.find((s) => s.baseId === stationBase) || CORRIDOR_STATION_PAIRS[0];

  // Quick Presets
  const applyPreset = (type: 'TONIGHT_MEGA_SEC1' | 'NIGHT_LULL_FULL' | 'TOMORROW_NIGHT' | 'MIDDAY_INTEGRATED') => {
    setValidationError(null);
    const now = new Date();
    const today = getLocalDateString(now);
    const tomorrowDate = new Date(now);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = getLocalDateString(tomorrowDate);

    if (type === 'TONIGHT_MEGA_SEC1') {
      setStationBase('SEC_PRG_SFG');
      setLineDirection('UP');
      // If 01:00 AM has already passed today, "Tonight" lull falls on tomorrow's calendar date
      const targetDate = now.getHours() >= 1 ? tomorrow : today;
      setBlockDate(targetDate);
      setStartTime('01:00');
      setEndTime('03:00');
      setDurationMinutes(120);
      setBlockType('MEGA_BLOCK');
      setSelectedDepts(['ENGINEERING', 'TRD', 'ST']);
      setPlannerNotes(`Advance Mega Block on Sec 1 (PRYJ - SFG) night window (01:00 - 03:00) on ${targetDate}.`);
    } else if (type === 'NIGHT_LULL_FULL') {
      setStationBase('SEC_SFG_MRE');
      setLineDirection('UP');
      const targetDate = now.getHours() >= 2 ? tomorrow : today;
      setBlockDate(targetDate);
      setStartTime('01:30');
      setEndTime('04:30');
      setDurationMinutes(180);
      setBlockType('MEGA_BLOCK');
      setSelectedDepts(['ENGINEERING', 'TRD']);
      setPlannerNotes(`Full Night Lull window (01:30 - 04:30) on ${targetDate} for heavy track tamping & power block.`);
    } else if (type === 'TOMORROW_NIGHT') {
      setStationBase('SEC_MRE_BRE');
      setLineDirection('UP');
      setBlockDate(tomorrow);
      setStartTime('01:00');
      setEndTime('03:30');
      setDurationMinutes(150);
      setBlockType('MEGA_BLOCK');
      setSelectedDepts(['ENGINEERING', 'TRD', 'ST']);
      setPlannerNotes(`Tomorrow Night Advance Mega Block reserved for joint maintenance on ${tomorrow}.`);
    } else if (type === 'MIDDAY_INTEGRATED') {
      setStationBase('SEC_BRE_SRO');
      setLineDirection('UP');
      // If 11:30 has already passed today, schedule for tomorrow
      const targetDate = now.getHours() >= 12 ? tomorrow : today;
      setBlockDate(targetDate);
      setStartTime('11:30');
      setEndTime('13:30');
      setDurationMinutes(120);
      setBlockType('INTEGRATED_SHADOW_BLOCK');
      setSelectedDepts(['ENGINEERING', 'ST']);
      setPlannerNotes(`Midday freight slot integrated shadow block on ${targetDate} between passenger trains.`);
    }
  };

  const toggleDept = (dept: Department) => {
    if (selectedDepts.includes(dept)) {
      if (selectedDepts.length > 1) {
        setSelectedDepts(selectedDepts.filter((d) => d !== dept));
      }
    } else {
      setSelectedDepts([...selectedDepts, dept]);
    }
  };

  const handleTimeChange = (start: string, end: string) => {
    setValidationError(null);
    setStartTime(start);
    setEndTime(end);
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    let diff = (eH * 60 + eM) - (sH * 60 + sM);
    if (diff <= 0) diff += 24 * 60;
    setDurationMinutes(diff);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const now = new Date();
    const currentToday = getLocalDateString(now);
    const currentLocalTime = getLocalTimeString(now);

    // 1. Strict Date Validation
    if (blockDate < currentToday) {
      setValidationError('Cannot schedule a block in the past. Date must be today or a future date.');
      return;
    }

    // 2. Strict Time Validation for today's date
    if (blockDate === currentToday && startTime < currentLocalTime) {
      setValidationError(`Start time (${startTime}) has already passed today (${currentLocalTime} IST). Please select a future time or choose tomorrow.`);
      return;
    }

    setSubmitting(true);

    const fullStartTime = `${blockDate} ${startTime}`;
    const fullEndTime = `${blockDate} ${endTime}`;

    const payload = {
      section_id: activeSectionId,
      start_time: fullStartTime,
      end_time: fullEndTime,
      duration_minutes: Number(durationMinutes),
      block_type: blockType,
      departments: selectedDepts,
      planner_notes: plannerNotes,
      pull_pending_tasks: pullPendingTasks,
      approved_by: 'Chief Controller (Planning)',
    };

    try {
      const res = await fetch('/api/plan/blocks/schedule-future', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setValidationError(data.detail || 'Failed to schedule advance block.');
        return;
      }
      if (data.status === 'success') {
        onBlockScheduled(data.blocks?.length || 0, data.message);
        onClose();
      }
    } catch (err: any) {
      console.error('Failed to schedule future block:', err);
      setValidationError(err.message || 'Network error while scheduling block.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-slate-950 border-b border-slate-800 p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Schedule Advance Mega Block</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase">
                  Future Window Reservation
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Reserve future traffic possessions (e.g. tonight from 01:00 to 03:00 on Section 1) and bundle departments in advance.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1-Click Test Scenarios */}
        <div className="bg-slate-950/60 border-b border-slate-800 px-5 py-3 space-y-2">
          <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>1-Click Popular Booking Presets:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => applyPreset('TONIGHT_MEGA_SEC1')}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-purple-500/50 text-xs text-slate-200 flex flex-col gap-0.5 text-left transition-all cursor-pointer shadow-sm"
            >
              <div className="flex items-center gap-1 font-bold text-purple-300 text-[11px]">
                <Moon className="w-3 h-3 text-purple-400 shrink-0" />
                <span>Tonight 01:00-03:00</span>
              </div>
              <span className="text-[10px] text-slate-400">Sec 1 (PRYJ-SFG) 120m</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('NIGHT_LULL_FULL')}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 flex flex-col gap-0.5 text-left transition-all cursor-pointer"
            >
              <div className="flex items-center gap-1 font-bold text-blue-400 text-[11px]">
                <Moon className="w-3 h-3 text-blue-400 shrink-0" />
                <span>Tonight 01:30-04:30</span>
              </div>
              <span className="text-[10px] text-slate-400">Full Night Lull (180m)</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('TOMORROW_NIGHT')}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 flex flex-col gap-0.5 text-left transition-all cursor-pointer"
            >
              <div className="flex items-center gap-1 font-bold text-emerald-400 text-[11px]">
                <Calendar className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Tomorrow Night</span>
              </div>
              <span className="text-[10px] text-slate-400">Sec 3 (MRE-BRE) 150m</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('MIDDAY_INTEGRATED')}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 flex flex-col gap-0.5 text-left transition-all cursor-pointer"
            >
              <div className="flex items-center gap-1 font-bold text-amber-400 text-[11px]">
                <Sun className="w-3 h-3 text-amber-400 shrink-0" />
                <span>Midday 11:30-13:30</span>
              </div>
              <span className="text-[10px] text-slate-400">Integrated Gap (120m)</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[62vh] overflow-y-auto">
          {/* STEP 1: Corridor Location & Track Direction */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-purple-400" />
                <span>Step 1: Corridor Section & Track Direction</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30 font-bold">
                Target: {activeSectionId} (Sec {currentStation.secNo})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Section */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Corridor Section (Between Stations)
                </label>
                <select
                  value={stationBase}
                  onChange={(e) => setStationBase(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500 font-medium cursor-pointer"
                >
                  {CORRIDOR_STATION_PAIRS.map((s) => (
                    <option key={s.baseId} value={s.baseId}>
                      Sec {s.secNo}: {s.name} ({s.km})
                    </option>
                  ))}
                </select>
              </div>

              {/* Option 2: Track Line Direction */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Track Direction
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLineDirection('UP')}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                      lineDirection === 'UP'
                        ? 'bg-blue-600/20 border-blue-400 text-white ring-1 ring-blue-500'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-xs font-bold flex items-center gap-1 text-blue-400">
                      <ArrowRight className="w-3 h-3" />
                      UP MAIN
                    </span>
                    {lineDirection === 'UP' && <span className="w-2 h-2 rounded-full bg-blue-400"></span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => setLineDirection('DN')}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                      lineDirection === 'DN'
                        ? 'bg-indigo-600/20 border-indigo-400 text-white ring-1 ring-indigo-500'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-xs font-bold flex items-center gap-1 text-indigo-400">
                      <ArrowLeft className="w-3 h-3" />
                      DOWN MAIN
                    </span>
                    {lineDirection === 'DN' && <span className="w-2 h-2 rounded-full bg-indigo-400"></span>}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 2: Date & Time Window */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span>Step 2: Date & Future Time Window</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 font-bold">
                Duration: {durationMinutes} mins ({Number((durationMinutes / 60).toFixed(1))} hrs)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Block Date
                </label>
                <input
                  type="date"
                  min={todayStr}
                  value={blockDate}
                  onChange={(e) => {
                    setBlockDate(e.target.value);
                    setValidationError(null);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Start Time (HH:MM)
                </label>
                <input
                  type="time"
                  min={blockDate === todayStr ? currentTimeStr : undefined}
                  value={startTime}
                  onChange={(e) => handleTimeChange(e.target.value, endTime)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  End Time (HH:MM)
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => handleTimeChange(startTime, e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  required
                />
              </div>
            </div>
          </div>

          {/* STEP 3: Participating Departments & Bundling */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Step 3: Multi-Department Bundling</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">
                {selectedDepts.length >= 2 ? '✓ Multi-Department Bundled' : 'Single Department'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => toggleDept('ENGINEERING')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                  selectedDepts.includes('ENGINEERING')
                    ? 'bg-emerald-950/30 border-emerald-500/70 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <ShieldAlert className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Track / Civil</span>
                </div>
                <span className="text-[10px] text-slate-400">TMS • Rails & Sleepers</span>
              </button>

              <button
                type="button"
                onClick={() => toggleDept('TRD')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                  selectedDepts.includes('TRD')
                    ? 'bg-amber-950/30 border-amber-500/70 text-amber-300'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Electrical (OHE)</span>
                </div>
                <span className="text-[10px] text-slate-400">TDMS • Power Block</span>
              </button>

              <button
                type="button"
                onClick={() => toggleDept('ST')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                  selectedDepts.includes('ST')
                    ? 'bg-purple-950/30 border-purple-500/70 text-purple-300'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Radio className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>Signals & S&T</span>
                </div>
                <span className="text-[10px] text-slate-400">SMMS • Interlocking</span>
              </button>
            </div>

            {/* Auto-bundle backlog checkbox */}
            <label className="flex items-center gap-2 pt-1 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={pullPendingTasks}
                onChange={(e) => setPullPendingTasks(e.target.checked)}
                className="rounded bg-slate-950 border-slate-700 text-purple-600 focus:ring-0"
              />
              <span>
                <strong>Auto-Bundle Backlog Tasks:</strong> Automatically assign matching open repair tasks in this section during this possession.
              </span>
            </label>
          </div>

          {/* Planner Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Sanction / Controller Operational Notes
            </label>
            <input
              type="text"
              value={plannerNotes}
              onChange={(e) => setPlannerNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              placeholder="e.g. Advance Mega Block scheduled for 120m night overhaul."
            />
          </div>

          {/* Validation Error Alert */}
          {validationError && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-center gap-2 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-purple-600/20"
            >
              <CalendarPlus className="w-4 h-4" />
              {submitting
                ? 'Registering and scheduling advance Mega Block...'
                : `Confirm & Schedule Advance Block (${durationMinutes} mins)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
