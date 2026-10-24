import React, { useState } from 'react';
import { Section, Department, Severity, UnifiedMaintenanceTask } from '../types';
import { X, AlertOctagon, Zap, ShieldAlert, Radio, Sparkles, Send, CheckCircle2, ArrowRight, ArrowLeft, MapPin, Gauge } from 'lucide-react';

interface Props {
  sections: Section[];
  isOpen: boolean;
  onClose: () => void;
  onDefectInjected: (newBlockCount: number, taskTitle: string, score: number) => void;
}

// 8 Official Station Pairs along the 191 km Prayagraj - Kanpur Trunk Corridor
const CORRIDOR_STATION_PAIRS = [
  { baseId: 'SEC_PRG_SFG', name: 'Prayagraj Jn ➔ Subedarganj', from: 'PRYJ', to: 'SFG', km: 'Km 827.0 – 831.5', len: '4.5 km' },
  { baseId: 'SEC_SFG_MRE', name: 'Subedarganj ➔ Manauri', from: 'SFG', to: 'MRE', km: 'Km 831.5 – 845.2', len: '13.7 km' },
  { baseId: 'SEC_MRE_BRE', name: 'Manauri ➔ Bharwari', from: 'MRE', to: 'BRE', km: 'Km 845.2 – 865.8', len: '20.6 km' },
  { baseId: 'SEC_BRE_SRO', name: 'Bharwari ➔ Sirathu', from: 'BRE', to: 'SRO', km: 'Km 865.8 – 888.4', len: '22.6 km' },
  { baseId: 'SEC_SRO_KGA', name: 'Sirathu ➔ Khaga', from: 'SRO', to: 'KGA', km: 'Km 888.4 – 914.6', len: '26.2 km' },
  { baseId: 'SEC_KGA_FTP', name: 'Khaga ➔ Fatehpur', from: 'KGA', to: 'FTP', km: 'Km 914.6 – 945.0', len: '30.4 km' },
  { baseId: 'SEC_FTP_BKO', name: 'Fatehpur ➔ Bindki Road', from: 'FTP', to: 'BKO', km: 'Km 945.0 – 977.3', len: '32.3 km' },
  { baseId: 'SEC_BKO_CNB', name: 'Bindki Road ➔ Kanpur Central', from: 'BKO', to: 'CNB', km: 'Km 977.3 – 1018.0', len: '40.7 km' },
];

export const InjectDefectModal: React.FC<Props> = ({
  sections,
  isOpen,
  onClose,
  onDefectInjected,
}) => {
  const [department, setDepartment] = useState<Department>('ENGINEERING');
  // Two separate options as requested: 1. Station base pair, 2. UP/DOWN track direction
  const [stationBase, setStationBase] = useState<string>('SEC_SFG_MRE');
  const [lineDirection, setLineDirection] = useState<'UP' | 'DN'>('UP');

  const [assetId, setAssetId] = useState<string>('RAIL_KM_839_FRACTURE');
  const [title, setTitle] = useState<string>('Emergency Rail Fracture on Up Main Line');
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

  // Active composite section ID (e.g. SEC_SFG_MRE_UP or SEC_SFG_MRE_DN)
  const activeSectionId = `${stationBase}_${lineDirection}`;
  const currentStationInfo = CORRIDOR_STATION_PAIRS.find((s) => s.baseId === stationBase) || CORRIDOR_STATION_PAIRS[1];

  // Quick Preset Scenarios for Instant 1-Click Demo (Supporting both UP and DOWN tracks!)
  const applyPreset = (type: 'FRACTURE_UP' | 'OHE_SAG_UP' | 'DOWN_TRACK_DEFECT' | 'SIGNAL_FAIL_DN') => {
    if (type === 'FRACTURE_UP') {
      setDepartment('ENGINEERING');
      setStationBase('SEC_MRE_BRE');
      setLineDirection('UP');
      setAssetId(`RAIL_KM_855_${Math.floor(100 + Math.random() * 900)}`);
      setTitle('Sudden Rail Fracture on UP Main Track (Km 855)');
      setDescription('Track patrolman reported 4mm rail gap at weld joint on UP Main. Caution order 30 km/h enforced on Rajdhani route.');
      setSeverity('EMERGENCY');
      setDuration(120);
      setSpeedRestriction('30 km/h');
      setIsStatutory(false);
      setRequiresPowerBlock(false);
    } else if (type === 'OHE_SAG_UP') {
      setDepartment('TRD');
      setStationBase('SEC_SFG_MRE');
      setLineDirection('UP');
      setAssetId(`OHE_MAST_${Math.floor(830 + Math.random() * 50)}`);
      setTitle('Overhead Catenary Sag on UP Main Line');
      setDescription('Loose dropper causing 150mm catenary sag under high heat. Immediate power isolation required.');
      setSeverity('EMERGENCY');
      setDuration(100);
      setSpeedRestriction('');
      setIsStatutory(true);
      setRequiresPowerBlock(true);
    } else if (type === 'DOWN_TRACK_DEFECT') {
      setDepartment('ENGINEERING');
      setStationBase('SEC_SRO_KGA');
      setLineDirection('DN');
      setAssetId(`RAIL_DN_KM_904_${Math.floor(100 + Math.random() * 900)}`);
      setTitle('USFD Transverse Defect on DOWN Main Track (Km 904)');
      setDescription('USFD detected internal fissure on DOWN Main rail head. Speed restricted to 30 km/h towards Prayagraj.');
      setSeverity('EMERGENCY');
      setDuration(90);
      setSpeedRestriction('30 km/h');
      setIsStatutory(false);
      setRequiresPowerBlock(false);
    } else if (type === 'SIGNAL_FAIL_DN') {
      setDepartment('ST');
      setStationBase('SEC_FTP_BKO');
      setLineDirection('DN');
      setAssetId(`POINT_MCH_${Math.floor(200 + Math.random() * 100)}`);
      setTitle('Down Loop Point Machine Failure (SMMS Alert)');
      setDescription('Interlocking switch detection contact failure on DOWN Main line before Bindki Road. S&T possession needed.');
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
      section_id: activeSectionId,
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
            <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Report Track Defect or Emergency
              </h2>
              <p className="text-xs text-slate-400">
                Test how the AI automatically re-optimizes the corridor plan on UP or DOWN tracks.
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
        <div className="bg-slate-950/60 border-b border-slate-800 px-5 py-3 space-y-2">
          <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            1-Click Test Scenarios (UP & DOWN Tracks):
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => applyPreset('FRACTURE_UP')}
              className="px-2.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 flex flex-col gap-1 transition-all text-left cursor-pointer"
            >
              <div className="flex items-center gap-1 font-semibold text-emerald-400 text-[11px]">
                <ShieldAlert className="w-3 h-3 shrink-0" />
                <span>UP Rail Fracture</span>
              </div>
              <span className="text-[9px] text-blue-300 font-mono">UP MAIN (PRYJ➔CNB)</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('OHE_SAG_UP')}
              className="px-2.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 flex flex-col gap-1 transition-all text-left cursor-pointer"
            >
              <div className="flex items-center gap-1 font-semibold text-amber-400 text-[11px]">
                <Zap className="w-3 h-3 shrink-0" />
                <span>UP Wire Sag</span>
              </div>
              <span className="text-[9px] text-blue-300 font-mono">UP MAIN (OHE)</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('DOWN_TRACK_DEFECT')}
              className="px-2.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-indigo-700/60 text-xs text-slate-200 flex flex-col gap-1 transition-all text-left cursor-pointer"
            >
              <div className="flex items-center gap-1 font-semibold text-indigo-400 text-[11px]">
                <ShieldAlert className="w-3 h-3 shrink-0" />
                <span>DOWN Defect</span>
              </div>
              <span className="text-[9px] text-indigo-300 font-mono">DOWN MAIN (CNB➔PRYJ)</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('SIGNAL_FAIL_DN')}
              className="px-2.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-indigo-700/60 text-xs text-slate-200 flex flex-col gap-1 transition-all text-left cursor-pointer"
            >
              <div className="flex items-center gap-1 font-semibold text-purple-400 text-[11px]">
                <Radio className="w-3 h-3 shrink-0" />
                <span>DOWN Switch</span>
              </div>
              <span className="text-[9px] text-indigo-300 font-mono">DOWN MAIN (S&T)</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Department Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Responsible Department / Discipline
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value as Department)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
            >
              <option value="ENGINEERING">Track / Civil Maintenance (TMS - Track Management System)</option>
              <option value="TRD">Traction Distribution / Overhead OHE (TDMS)</option>
              <option value="ST">Signalling & Telecommunication (SMMS - Point / Interlocking)</option>
            </select>
          </div>

          {/* TWO SEPARATE OPTIONS: Option 1 (Station) & Option 2 (UP/DOWN) */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span>Corridor Location & Track Direction</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/30 font-bold">
                Target Section: {activeSectionId}
              </span>
            </div>

            {/* Option 1: Station / Section Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1 flex items-center justify-between">
                <span>Option 1: Corridor Station Section</span>
                <span className="text-[10px] font-mono text-slate-400">
                  {currentStationInfo.km} ({currentStationInfo.len})
                </span>
              </label>
              <select
                value={stationBase}
                onChange={(e) => setStationBase(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
              >
                {CORRIDOR_STATION_PAIRS.map((s) => (
                  <option key={s.baseId} value={s.baseId}>
                    {s.name} ({s.from} ➔ {s.to}) • {s.km}
                  </option>
                ))}
              </select>
            </div>

            {/* Option 2: Track Line Direction (UP vs DOWN) */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Option 2: Track Direction (UP or DOWN Track)
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {/* UP MAIN Option */}
                <button
                  type="button"
                  onClick={() => setLineDirection('UP')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                    lineDirection === 'UP'
                      ? 'bg-blue-600/20 border-blue-400 text-white ring-2 ring-blue-500/50 shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-blue-400">
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                      <span>UP MAIN LINE</span>
                    </span>
                    {lineDirection === 'UP' && (
                      <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-300">
                    Westbound: Prayagraj Jn ➔ Kanpur Central
                  </span>
                </button>

                {/* DOWN MAIN Option */}
                <button
                  type="button"
                  onClick={() => setLineDirection('DN')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                    lineDirection === 'DN'
                      ? 'bg-indigo-600/20 border-indigo-400 text-white ring-2 ring-indigo-500/50 shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-indigo-400">
                      <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                      <span>DOWN MAIN LINE</span>
                    </span>
                    {lineDirection === 'DN' && (
                      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-300">
                    Eastbound: Kanpur Central ➔ Prayagraj Jn
                  </span>
                </button>
              </div>
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
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Asset Tag</label>
              <input
                type="text"
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Technical Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Severity, Duration & Caution Order */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Urgency</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as Severity)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="EMERGENCY">Emergency (Immediate)</option>
                <option value="CRITICAL">Critical (Fix in 48h)</option>
                <option value="ROUTINE">Routine Maintenance</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Time Needed (mins)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                min={30}
                max={240}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Speed Caution Order
              </label>
              <input
                type="text"
                value={speedRestriction}
                onChange={(e) => setSpeedRestriction(e.target.value)}
                placeholder="e.g. 30 km/h"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
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
                className="rounded bg-slate-950 border-slate-800 text-blue-500 focus:ring-0"
              />
              Requires Overhead Power Cutoff
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isStatutory}
                onChange={(e) => setIsStatutory(e.target.checked)}
                className="rounded bg-slate-950 border-slate-800 text-blue-500 focus:ring-0"
              />
              Mandatory Periodic Inspection
            </label>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50 transition-colors cursor-pointer shadow-sm"
            >
              <Send className="w-4 h-4" />
              {submitting
                ? 'AI is re-optimizing the corridor schedule...'
                : 'Submit Defect & Re-Calculate Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
