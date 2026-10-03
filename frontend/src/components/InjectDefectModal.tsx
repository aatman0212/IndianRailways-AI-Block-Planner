import React, { useState } from 'react';
import { Section, Department, Severity, UnifiedMaintenanceTask } from '../types';
import { X, AlertOctagon, Zap, ShieldAlert, Radio, Sparkles, Send } from 'lucide-react';

interface Props {
  sections: Section[];
  isOpen: boolean;
  onClose: () => void;
  onDefectInjected: (newBlockCount: number, taskTitle: string, score: number) => void;
}

export const InjectDefectModal: React.FC<Props> = ({
  sections,
  isOpen,
  onClose,
  onDefectInjected,
}) => {
  const [department, setDepartment] = useState<Department>('ENGINEERING');
  const [sectionId, setSectionId] = useState<string>(sections[0]?.section_id || 'SEC_SFG_MRE_UP');
  const [assetId, setAssetId] = useState<string>('RAIL_KM_870_FRACTURE');
  const [title, setTitle] = useState<string>('Emergency Rail Fracture Detected at Km 870');
  const [description, setDescription] = useState<string>(
    'Ultrasonic Flaw Detector (USFD) confirmed transverse fracture on Up Main line. Immediate 30 km/h caution order imposed.'
  );
  const [severity, setSeverity] = useState<Severity>('EMERGENCY');
  const [duration, setDuration] = useState<number>(120);
  const [speedRestriction, setSpeedRestriction] = useState<string>('30 km/h');
  const [isStatutory, setIsStatutory] = useState<boolean>(false);
  const [requiresPowerBlock, setRequiresPowerBlock] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  // Quick Preset Scenarios for Instant Demo
  const applyPreset = (type: 'FRACTURE' | 'OHE_SAG' | 'SIGNAL_FAIL') => {
    if (type === 'FRACTURE') {
      setDepartment('ENGINEERING');
      setSectionId(sections[2]?.section_id || 'SEC_MRE_BRE_UP');
      setAssetId(`RAIL_KM_855_${Math.floor(100 + Math.random() * 900)}`);
      setTitle('Sudden Rail Fracture on High-Speed Up Line');
      setDescription('Patrolman reported 4mm rail gap at weld joint. Caution order 30 km/h enforced on Rajdhani route.');
      setSeverity('EMERGENCY');
      setDuration(120);
      setSpeedRestriction('30 km/h');
      setIsStatutory(false);
      setRequiresPowerBlock(false);
    } else if (type === 'OHE_SAG') {
      setDepartment('TRD');
      setSectionId(sections[1]?.section_id || 'SEC_SFG_MRE_UP');
      setAssetId(`OHE_MAST_${Math.floor(830 + Math.random() * 50)}`);
      setTitle('Severe OHE Catenary Wire Dropper Snapping');
      setDescription('Loose dropper causing 150mm catenary sag under high ambient temperature. Risk of pantograph entanglement.');
      setSeverity('EMERGENCY');
      setDuration(100);
      setSpeedRestriction('');
      setIsStatutory(true);
      setRequiresPowerBlock(true);
    } else if (type === 'SIGNAL_FAIL') {
      setDepartment('ST');
      setSectionId(sections[4]?.section_id || 'SEC_SRO_KGA_UP');
      setAssetId(`POINT_MCH_${Math.floor(200 + Math.random() * 100)}`);
      setTitle('Point Machine Detection Failure (Loss of Correspondence)');
      setDescription('Interlocking route setting blocked due to switch detection contact pitting. Manual crank handle required.');
      setSeverity('CRITICAL');
      setDuration(75);
      setSpeedRestriction('50 km/h');
      setIsStatutory(false);
      setRequiresPowerBlock(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const now = new Date();
    const taskId = `${department.substring(0, 3)}_${Date.now().toString().slice(-4)}`;

    const payload: UnifiedMaintenanceTask = {
      task_id: taskId,
      department,
      source_system: department === 'ENGINEERING' ? 'TMS' : department === 'TRD' ? 'TDMS' : 'SMMS',
      section_id: sectionId,
      asset_id: assetId,
      title,
      description,
      severity,
      min_duration_minutes: Number(duration),
      reported_date: now.toISOString().split('T')[0],
      due_date: new Date(now.getTime() + 86400000).toISOString().split('T')[0],
      days_overdue: severity === 'EMERGENCY' ? 1 : 0,
      is_statutory: isStatutory,
      requires_power_block: requiresPowerBlock,
      requires_traffic_block: true,
      speed_restriction: speedRestriction || undefined,
      priority_score: 0,
      score_factors: {},
      rationale: '',
    };

    try {
      const res = await fetch('/api/tasks?auto_replan=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.status === 'success') {
        onDefectInjected(data.blocks?.length || 0, data.task?.title, data.task?.priority_score || 85);
        onClose();
      }
    } catch (err) {
      console.error('Failed to inject defect:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-slate-950 border-b border-slate-800 p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Report Maintenance Defect / Emergency
              </h2>
              <p className="text-xs text-slate-400">
                Simulates real-time incoming defect ingestion from TMS, TDMS, or SMMS.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Demo Scenario Presets */}
        <div className="bg-slate-950/60 border-b border-slate-800/80 px-5 py-3">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            Quick Demo Presets (Click to autofill):
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => applyPreset('FRACTURE')}
              className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-emerald-300 flex items-center gap-1 transition-colors text-left"
            >
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>Rail Fracture (P.Way)</span>
            </button>
            <button
              type="button"
              onClick={() => applyPreset('OHE_SAG')}
              className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-amber-300 flex items-center gap-1 transition-colors text-left"
            >
              <Zap className="w-3.5 h-3.5 shrink-0" />
              <span>OHE Sag (TRD)</span>
            </button>
            <button
              type="button"
              onClick={() => applyPreset('SIGNAL_FAIL')}
              className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-purple-300 flex items-center gap-1 transition-colors text-left"
            >
              <Radio className="w-3.5 h-3.5 shrink-0" />
              <span>Signal Point (S&T)</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Department & Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Department (Source System)
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as Department)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="ENGINEERING">Engineering (TMS - Track)</option>
                <option value="TRD">TRD (TDMS - Traction/OHE)</option>
                <option value="ST">S&T (SMMS - Signalling)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Corridor Section
              </label>
              <select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
                {sections.map((s) => (
                  <option key={s.section_id} value={s.section_id}>
                    {s.name} ({s.traffic_density_gmt} GMT)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title & Asset ID */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Defect Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Asset Tag</label>
              <input
                type="text"
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Defect Description & Technical Findings
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Severity, Duration & Caution Order */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as Severity)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="EMERGENCY">EMERGENCY (IOM)</option>
                <option value="CRITICAL">CRITICAL (48h)</option>
                <option value="ROUTINE">ROUTINE</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Required Block (mins)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                min={30}
                max={240}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Caution Order / Speed
              </label>
              <input
                type="text"
                value={speedRestriction}
                onChange={(e) => setSpeedRestriction(e.target.value)}
                placeholder="e.g. 30 km/h"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex items-center gap-5 pt-1 text-xs text-slate-300">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={requiresPowerBlock}
                onChange={(e) => setRequiresPowerBlock(e.target.checked)}
                className="rounded bg-slate-950 border-slate-800 text-sky-500 focus:ring-0"
              />
              Requires OHE Power Block
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isStatutory}
                onChange={(e) => setIsStatutory(e.target.checked)}
                className="rounded bg-slate-950 border-slate-800 text-sky-500 focus:ring-0"
              />
              Statutory Periodic Inspection
            </label>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-950/50 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              {submitting
                ? 'Scoring & Recalculating Corridor...'
                : 'Inject Defect & Trigger AI Dynamic Re-Planning'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
