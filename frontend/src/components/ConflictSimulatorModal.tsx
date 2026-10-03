import React, { useState } from 'react';
import { Section } from '../types';
import { X, AlertTriangle, Train, Clock, ArrowRight, Zap, ShieldAlert } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sections: Section[];
  onInjectConflict: (trainNo: string, trainName: string, delayMins: number, sectionId: string) => void;
}

const TRAIN_PRESETS = [
  {
    number: '12424',
    name: 'Dibrugarh Rajdhani Express',
    type: 'Rajdhani / Premium',
    defaultDelay: 40,
    sectionId: 'SEC_SFG_MRE_UP',
    impactDesc: 'Priority 1 Mail/Express. Delaying this train causes cascade detention across NCR.',
  },
  {
    number: '22436',
    name: 'Vande Bharat Express',
    type: 'Vande Bharat Semi-High Speed',
    defaultDelay: 35,
    sectionId: 'SEC_MRE_BRE_UP',
    impactDesc: '160 kmph high-priority rake. Enters section right as OHE maintenance begins.',
  },
  {
    number: '12301',
    name: 'Howrah Rajdhani Express',
    type: 'Rajdhani / Premium',
    defaultDelay: 50,
    sectionId: 'SEC_SRO_KGA_UP',
    impactDesc: 'Upstream signal breakdown at Mirzapur caused 50-minute detention.',
  },
  {
    number: 'BOXN-804',
    name: 'Dedicated Freight Corridor Feeder',
    type: 'Heavy Freight (58 Wagons)',
    defaultDelay: 60,
    sectionId: 'SEC_KGA_FTP_UP',
    impactDesc: 'Heavy gross trailing weight. Cannot be easily looped without 25kV power.',
  },
];

export const ConflictSimulatorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  sections,
  onInjectConflict,
}) => {
  if (!isOpen) return null;

  const [selectedTrain, setSelectedTrain] = useState(TRAIN_PRESETS[0]);
  const [delayMinutes, setDelayMinutes] = useState<number>(TRAIN_PRESETS[0].defaultDelay);
  const [selectedSectionId, setSelectedSectionId] = useState<string>(TRAIN_PRESETS[0].sectionId);

  const handleSelectPreset = (preset: typeof TRAIN_PRESETS[0]) => {
    setSelectedTrain(preset);
    setDelayMinutes(preset.defaultDelay);
    setSelectedSectionId(preset.sectionId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onInjectConflict(selectedTrain.number, selectedTrain.name, delayMinutes, selectedSectionId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-950 border-b border-slate-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-500/20 rounded-lg border border-rose-500/30">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-100">
                  Simulate Upstream Train Delay & Conflict
                </span>
                <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold font-mono px-2 py-0.5 rounded">
                  HEADWAY DISRUPTION
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Inject a dynamic train delay to test OR-Tools CP-SAT autonomous conflict resolution
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Preset Buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Select Real-World Train Scenario:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {TRAIN_PRESETS.map((preset) => {
                const isSelected = selectedTrain.number === preset.number;
                return (
                  <button
                    key={preset.number}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-rose-950/40 border-rose-500 text-white shadow-lg shadow-rose-950/40'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-slate-200 flex items-center gap-1.5">
                        <Train className="w-3.5 h-3.5 text-sky-400" />
                        {preset.number}
                      </span>
                      <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                        +{preset.defaultDelay}m
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-200 mt-1 truncate">
                      {preset.name}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                      {preset.type}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conflict Parameters */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-sky-400" />
              Disruption Parameters
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Upstream Delay Amount
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={15}
                    max={90}
                    step={5}
                    value={delayMinutes}
                    onChange={(e) => setDelayMinutes(Number(e.target.value))}
                    className="w-full accent-rose-500"
                  />
                  <span className="font-mono font-bold text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2 py-1 rounded shrink-0">
                    +{delayMinutes}m
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Corridor Section Impacted
                </label>
                <select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 font-mono focus:border-rose-500 outline-none"
                >
                  {sections.map((s) => (
                    <option key={s.section_id} value={s.section_id}>
                      {s.name} ({s.traffic_density_gmt} GMT)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-xs text-slate-400 bg-slate-900/60 p-3 rounded-lg border border-slate-800 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200">Expected Collision Consequence:</strong>{' '}
                {selectedTrain.impactDesc}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-950/60 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              Inject Delay & Trigger Conflict
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
