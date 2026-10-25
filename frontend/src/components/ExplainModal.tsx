import React, { useState, useEffect } from 'react';
import { ScheduledBlock, Department } from '../types';
import {
  X,
  CheckCircle2,
  XCircle,
  Layers,
  ShieldAlert,
  Zap,
  Radio,
  Info,
  Clock,
  MapPin,
  Lightbulb,
  AlertTriangle,
  CalendarPlus,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  block: ScheduledBlock | null;
  onClose: () => void;
  onApprove: (
    blockId: string,
    notes: string,
    timingOptions?: {
      executionTiming: 'SCHEDULED' | 'NOW' | 'CUSTOM';
      customStartTime?: string;
      customEndTime?: string;
    }
  ) => Promise<void>;
  onReject: (blockId: string, notes: string) => Promise<void>;
}

const DEPT_ICONS: Record<Department, { label: string; icon: React.ReactNode; color: string }> = {
  ENGINEERING: {
    label: 'Track (Civil)',
    icon: <ShieldAlert className="w-4 h-4 text-emerald-400" />,
    color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  },
  TRD: {
    label: 'Overhead Wire (OHE)',
    icon: <Zap className="w-4 h-4 text-amber-400" />,
    color: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  },
  ST: {
    label: 'Signals & Telecom',
    icon: <Radio className="w-4 h-4 text-purple-400" />,
    color: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
  },
};

const SECTION_NAMES: Record<string, string> = {
  SEC_PRG_SFG: 'Prayagraj ➔ Subedarganj',
  SEC_SFG_MRE: 'Subedarganj ➔ Manauri',
  SEC_MRE_BRE: 'Manauri ➔ Bharwari',
  SEC_BRE_SRO: 'Bharwari ➔ Sirathu',
  SEC_SRO_KGA: 'Sirathu ➔ Khaga',
  SEC_KGA_FTP: 'Khaga ➔ Fatehpur',
  SEC_FTP_BKO: 'Fatehpur ➔ Bindki Road',
  SEC_BKO_CNB: 'Bindki Road ➔ Kanpur Central',
};

const formatSectionName = (secId: string) => {
  const isDown = secId.endsWith('_DN');
  const base = secId.replace('_UP', '').replace('_DN', '');
  const human = SECTION_NAMES[base] || base.replace('SEC_', '');
  return `${human} (${isDown ? 'DOWN MAIN' : 'UP MAIN'})`;
};

export const ExplainModal: React.FC<Props> = ({
  block,
  onClose,
  onApprove,
  onReject,
}) => {
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [justApproved, setJustApproved] = useState(false);
  const [executionTiming, setExecutionTiming] = useState<'SCHEDULED' | 'NOW' | 'CUSTOM'>('SCHEDULED');
  const [customDate, setCustomDate] = useState<string>('');
  const [customStartTime, setCustomStartTime] = useState<string>('02:00');

  // Reset local state whenever a different block is opened
  useEffect(() => {
    setNotes('');
    setSubmitting(false);
    setJustApproved(false);
    setExecutionTiming('SCHEDULED');

    if (block?.start_time) {
      const bDate = block.start_time.split(' ')[0];
      const today = new Date().toISOString().split('T')[0];
      setCustomDate(bDate || today);
      const bTime = block.start_time.split(' ')[1];
      if (bTime) setCustomStartTime(bTime);
    }
  }, [block?.block_id]);

  if (!block) return null;

  // Live Timing Calculations for "Apply NOW" option
  const now = new Date();
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const nowTimeStr = `${currentHours}:${currentMinutes}`;
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const durationMin = block.duration_minutes || 120;
  const nowEnd = new Date(now.getTime() + durationMin * 60000);
  const nowEndStr = `${String(nowEnd.getHours()).padStart(2, '0')}:${String(nowEnd.getMinutes()).padStart(2, '0')}`;

  const getCustomEndTimeStr = () => {
    try {
      const [h, m] = customStartTime.split(':').map(Number);
      const d = new Date();
      d.setHours(h, m + durationMin, 0, 0);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch {
      return '';
    }
  };

  const handleApprove = async () => {
    setSubmitting(true);
    let customStart: string | undefined = undefined;
    let customEnd: string | undefined = undefined;

    if (executionTiming === 'CUSTOM') {
      customStart = `${customDate || todayStr} ${customStartTime}`;
      customEnd = `${customDate || todayStr} ${getCustomEndTimeStr()}`;
    }

    await onApprove(block.block_id, notes, {
      executionTiming,
      customStartTime: customStart,
      customEndTime: customEnd,
    });
    setSubmitting(false);
    setJustApproved(true);
  };

  const handleReject = async () => {
    setSubmitting(true);
    await onReject(block.block_id, notes);
    setSubmitting(false);
  };

  const isApproved = block.status === 'APPROVED' || justApproved;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="bg-slate-950 border-b border-slate-800 p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-blue-400">
                {block.block_id.replace('BLK_', 'Block ')}
              </span>
              {block.is_bundled && (
                <span className="bg-blue-500/10 text-blue-300 border border-blue-500/30 text-xs font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                  <Layers className="w-3 h-3" /> Multi-Team Bundled Window
                </span>
              )}
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                  isApproved
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {isApproved ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                {isApproved ? 'Approved & Locked' : 'Pending Review'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1.5 font-mono flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                Section: <strong className="text-slate-200">{formatSectionName(block.section_id)}</strong>
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                Duration: <strong className="text-slate-200">{block.duration_minutes}m ({Math.floor(block.duration_minutes / 60)}h {block.duration_minutes % 60}m)</strong>
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
          {/* Section 1: AI Reasoning */}
          <div className="bg-slate-950 border border-blue-900/40 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
              <Lightbulb className="w-4 h-4 text-blue-400" />
              Why Did the AI Choose This Slot?
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This window falls during the low-traffic night period (01:00 - 05:00 AM). Scheduling {block.tasks.length} repairs together in this single slot eliminates duplicate line shutdowns and avoids stopping passenger trains during busy daytime hours.
            </p>
          </div>

          {/* Section 2: Tasks Co-scheduled in this block */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Repairs Scheduled in This Window ({block.tasks.length}):</span>
              <span className="text-[11px] font-normal text-slate-400">Total Duration: {block.duration_minutes} mins</span>
            </h3>

            <div className="space-y-2.5">
              {block.tasks.map((task) => {
                const dept = DEPT_ICONS[task.department];

                return (
                  <div
                    key={task.task_id}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${dept.color}`}>
                          {dept.icon}
                          {dept.label}
                        </span>
                        <span className="font-bold text-xs text-slate-100">{task.title}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                        Priority {task.priority_score}/100
                      </span>
                    </div>

                    <p className="text-xs text-slate-400">{task.description}</p>

                    {/* AI Decision Rationale */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 text-xs flex items-start gap-2">
                      <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-300">AI Priority Rationale: </span>
                        <span className="text-slate-400">{task.rationale}</span>
                      </div>
                    </div>

                    {/* Score Breakdown Pills */}
                    {task.score_factors && (
                      <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono text-slate-400 pt-1">
                        <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          Safety: <strong className="text-emerald-400">+{task.score_factors.safety_severity ?? (task.severity === 'EMERGENCY' ? 40 : task.severity === 'CRITICAL' ? 25 : 10)}</strong>
                        </span>
                        <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          Overdue: <strong className="text-amber-400">+{task.score_factors.overdue_days || 0}</strong>
                        </span>
                        <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          Density: <strong className="text-blue-400">+{task.score_factors.corridor_density || 12.5}</strong>
                        </span>
                        <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          Compliance: <strong className="text-purple-400">+{task.score_factors.statutory_compliance ?? (task.is_statutory ? 15 : 0)}</strong>
                        </span>
                        {Boolean(task.score_factors.speed_restriction_penalty) && (
                          <span className="bg-slate-900 px-2 py-0.5 rounded border border-rose-500/30">
                            Caution Order: <strong className="text-rose-400">+{task.score_factors.speed_restriction_penalty}</strong>
                          </span>
                        )}
                        {Boolean(task.score_factors.planned_mega_block) && (
                          <span className="bg-slate-900 px-2 py-0.5 rounded border border-amber-500/40 text-amber-300">
                            Executive Sanction: <strong>+{task.score_factors.planned_mega_block}</strong>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: TIMING PROMINENCE & CHOOSE EXECUTION (NOW vs IN FUTURE) */}
          {!isApproved ? (
            <div className="space-y-3.5 bg-slate-950 p-4 rounded-2xl border border-blue-500/30 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>Choose When to Apply This Track Block</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  Select Execution Timing
                </span>
              </div>

              {/* Two Prominent Timing Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* OPTION 1: Sanction for Future / Planned Slot */}
                <div
                  onClick={() => setExecutionTiming('SCHEDULED')}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 relative text-left ${
                    executionTiming === 'SCHEDULED'
                      ? 'bg-blue-950/50 border-blue-500 shadow-lg ring-2 ring-blue-500/30'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                      <span>Apply in Future (Scheduled Slot)</span>
                    </span>
                    <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[9px] font-bold px-1.5 py-0.5 rounded">
                      AI Recommended
                    </span>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 font-mono text-xs space-y-1">
                    <div className="text-slate-400 text-[10px]">Planned Possession Time:</div>
                    <div className="text-emerald-400 font-extrabold text-sm">
                      {block.start_time} ➔ {block.end_time?.includes(' ') ? block.end_time.split(' ')[1] : block.end_time} IST
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Duration: <strong>{block.duration_minutes} Minutes</strong> ({Math.floor(block.duration_minutes / 60)}h {block.duration_minutes % 60}m)
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-snug">
                    Executes during the planned low-traffic slot. Express trains operate without interruption.
                  </p>
                </div>

                {/* OPTION 2: Apply Block NOW (Immediate Possession) */}
                <div
                  onClick={() => setExecutionTiming('NOW')}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 relative text-left ${
                    executionTiming === 'NOW'
                      ? 'bg-red-950/50 border-red-500 shadow-lg ring-2 ring-red-500/40'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                      <span>Apply Block NOW (Immediate)</span>
                    </span>
                    <span className="bg-red-500/20 text-red-300 border border-red-500/40 text-[9px] font-bold px-1.5 py-0.5 rounded animate-pulse">
                      Immediate Shutdown
                    </span>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 font-mono text-xs space-y-1">
                    <div className="text-slate-400 text-[10px]">Immediate Execution:</div>
                    <div className="text-red-400 font-extrabold text-sm">
                      NOW ({nowTimeStr} IST) ➔ {nowEndStr} IST
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Starts immediately for <strong>{block.duration_minutes} Minutes</strong>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-snug">
                    Halt line traffic immediately for urgent work. Active trains will be piloted under Caution Orders.
                  </p>
                </div>
              </div>

              {/* Optional Custom Timing Picker */}
              <div className="pt-1 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setExecutionTiming(executionTiming === 'CUSTOM' ? 'SCHEDULED' : 'CUSTOM')}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  <span>{executionTiming === 'CUSTOM' ? 'Cancel Custom Timing' : 'Or Pick a Specific Custom Date & Time...'}</span>
                </button>

                {executionTiming === 'CUSTOM' && (
                  <div className="mt-2.5 p-3 bg-slate-900/90 rounded-xl border border-blue-500/40 space-y-2 animate-in fade-in">
                    <div className="text-xs font-bold text-slate-200">Custom Future Possession Schedule:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Execution Date:</label>
                        <input
                          type="date"
                          value={customDate}
                          min={todayStr}
                          onChange={(e) => setCustomDate(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Start Time (IST):</label>
                        <input
                          type="time"
                          value={customStartTime}
                          onChange={(e) => setCustomStartTime(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div className="text-[11px] font-mono text-emerald-400">
                      Scheduled Window: <strong>{customDate || todayStr} {customStartTime} ➔ {getCustomEndTimeStr()} IST ({block.duration_minutes} mins)</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Post-Approval Confirmed Possession Box */
            <div className="p-4 bg-emerald-950/60 border border-emerald-500/60 rounded-xl space-y-2.5 shadow-lg shadow-emerald-950/40 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Track Possession Sanctioned & Confirmed
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  SANCTION GRANTED
                </span>
              </div>

              <div className="p-3 bg-slate-900/90 rounded-lg border border-emerald-500/30 space-y-1">
                <div className="text-xs text-slate-300 font-medium">
                  Track Will Be BLOCKED During:
                </div>
                <div className="text-base font-extrabold text-white font-mono flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    {block.start_time} ➔ {block.end_time?.includes(' ') ? block.end_time.split(' ')[1] : block.end_time} IST
                  </span>
                </div>
                <div className="text-xs text-emerald-300 font-mono">
                  Possession Duration: <strong>{block.duration_minutes} Minutes</strong> ({Number((block.duration_minutes / 60).toFixed(1))} Hours)
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono pt-0.5">
                <span>Sanctioned by: <strong className="text-emerald-300">{block.approved_by || 'Chief Controller'}</strong></span>
                <span>{block.approval_timestamp ? `Approved at: ${block.approval_timestamp}` : 'Status: Sanction Active'}</span>
              </div>

              <div className="text-[10px] text-emerald-300/90 font-mono bg-emerald-950/80 p-2 rounded border border-emerald-800/60">
                ✓ Caution Order (30 km/h) generated • Section Station Masters and Traction Power Controller (TPC) notified • Single-Line Working (TSLW) active during possession.
              </div>
            </div>
          )}

          {/* Section 4: Controller Remarks & History */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Section Controller Remarks / Instructions:
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Verified traction power cutoff with Substation; Caution order 30 kmph notified to Station Master..."
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
            {block.approved_by && (
              <div className="text-xs text-emerald-400 flex items-center gap-1.5 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Sanctioned by <strong>{block.approved_by}</strong> at {block.approval_timestamp}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-950 border-t border-slate-800 p-4 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            {isApproved ? 'Close' : 'Cancel'}
          </button>

          <div className="flex items-center gap-2">
            {!isApproved && (
              <button
                onClick={handleReject}
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" /> Reject Block
              </button>
            )}
            <button
              onClick={handleApprove}
              disabled={submitting || isApproved}
              className={`px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer disabled:opacity-60 ${
                isApproved
                  ? 'bg-emerald-700 text-emerald-100'
                  : executionTiming === 'NOW'
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting
                ? 'Applying Sanction...'
                : isApproved
                ? '✓ Permit Sanctioned'
                : executionTiming === 'NOW'
                ? '🚨 Sanction & Apply Block NOW'
                : executionTiming === 'CUSTOM'
                ? '📅 Sanction for Custom Slot'
                : '✓ Sanction for Scheduled Slot'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
