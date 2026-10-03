import React, { useState } from 'react';
import { ScheduledBlock, Department } from '../types';
import { X, CheckCircle2, XCircle, Layers, ShieldAlert, Zap, Radio, Info } from 'lucide-react';

interface Props {
  block: ScheduledBlock | null;
  onClose: () => void;
  onApprove: (blockId: string, notes: string) => Promise<void>;
  onReject: (blockId: string, notes: string) => Promise<void>;
}

const DEPT_ICONS: Record<Department, React.ReactNode> = {
  ENGINEERING: <ShieldAlert className="w-4 h-4 text-emerald-400" />,
  TRD: <Zap className="w-4 h-4 text-amber-400" />,
  ST: <Radio className="w-4 h-4 text-purple-400" />,
};

export const ExplainModal: React.FC<Props> = ({
  block,
  onClose,
  onApprove,
  onReject,
}) => {
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!block) return null;

  const handleApprove = async () => {
    setSubmitting(true);
    await onApprove(block.block_id, notes);
    setSubmitting(false);
  };

  const handleReject = async () => {
    setSubmitting(true);
    await onReject(block.block_id, notes);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="bg-slate-950/80 border-b border-slate-800 p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-sky-400">{block.block_id}</span>
              {block.is_bundled && (
                <span className="bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                  <Layers className="w-3 h-3" /> Multi-Dept Bundled Possession
                </span>
              )}
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                block.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-300'
              }`}>
                {block.status}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Section: <span className="text-slate-200 font-medium">{block.section_id}</span> | Window: <span className="font-mono text-slate-200">{block.start_time} ({block.duration_minutes}m)</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {/* Section 1: Tasks Co-scheduled in this block */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              Co-Scheduled Maintenance Tasks ({block.tasks.length})
            </h3>
            <div className="space-y-2.5">
              {block.tasks.map((task) => (
                <div
                  key={task.task_id}
                  className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {DEPT_ICONS[task.department]}
                      <span className="font-semibold text-sm text-slate-200">{task.title}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded">
                      Score: {task.priority_score}/100
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">{task.description}</p>

                  {/* Explainability Rationale */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded p-2 text-xs flex items-start gap-2">
                    <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium text-slate-300">AI Decision Rationale: </span>
                      <span className="text-slate-400">{task.rationale}</span>
                    </div>
                  </div>

                  {/* Factor Contribution Bar */}
                  {task.score_factors && (
                    <div className="pt-1">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Score Breakdown</div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                        <div className="bg-slate-900 px-2 py-1 rounded border border-slate-800">
                          <span className="text-slate-500">Safety: </span>
                          <span className="text-emerald-400 font-bold">+{task.score_factors.safety_severity || 0}</span>
                        </div>
                        <div className="bg-slate-900 px-2 py-1 rounded border border-slate-800">
                          <span className="text-slate-500">Overdue: </span>
                          <span className="text-amber-400 font-bold">+{task.score_factors.overdue_days || 0}</span>
                        </div>
                        <div className="bg-slate-900 px-2 py-1 rounded border border-slate-800">
                          <span className="text-slate-500">Density: </span>
                          <span className="text-sky-400 font-bold">+{task.score_factors.corridor_density || 0}</span>
                        </div>
                        <div className="bg-slate-900 px-2 py-1 rounded border border-slate-800">
                          <span className="text-slate-500">Statutory: </span>
                          <span className="text-purple-400 font-bold">+{task.score_factors.statutory_compliance || 0}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Controller Notes & Approval Trail */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Section Controller Operational Notes
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Power block isolation coordinated with Prayagraj substation; Caution order 30 kmph to be notified to Lucknow Control..."
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
            />
            {block.approved_by && (
              <div className="text-xs text-emerald-400 mt-1">
                Approved by <span className="font-semibold">{block.approved_by}</span> at {block.approval_timestamp}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950/80 border-t border-slate-800 p-4 flex items-center justify-end gap-3">
          <button
            onClick={handleReject}
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <XCircle className="w-4 h-4" /> Reject Block
          </button>
          <button
            onClick={handleApprove}
            disabled={submitting || block.status === 'APPROVED'}
            className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-950/50"
          >
            <CheckCircle2 className="w-4 h-4" /> {block.status === 'APPROVED' ? 'Approved' : 'Approve Block Possession'}
          </button>
        </div>
      </div>
    </div>
  );
};
