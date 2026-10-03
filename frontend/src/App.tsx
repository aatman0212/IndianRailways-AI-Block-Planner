import React, { useState, useEffect } from 'react';
import { Section, ScheduledBlock, PlanAnalytics, UnifiedMaintenanceTask, TrafficConflict } from './types';
import { KpiCards } from './components/KpiCards';
import { CorridorGantt } from './components/CorridorGantt';
import { TrackSchematic } from './components/TrackSchematic';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { TaskInventory } from './components/TaskInventory';
import { ExplainModal } from './components/ExplainModal';
import { InjectDefectModal } from './components/InjectDefectModal';
import { OfficialBulletinModal } from './components/OfficialBulletinModal';
import { ConflictSimulatorModal } from './components/ConflictSimulatorModal';
import { ConflictBanner } from './components/ConflictBanner';
import {
  Train,
  RefreshCw,
  Layers,
  CheckCircle2,
  AlertCircle,
  Shield,
  Sparkles,
  AlertOctagon,
  FileText,
  Sliders,
  Radio,
  MapPin,
  Clock,
  AlertTriangle,
} from 'lucide-react';

export const App: React.FC = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [tasks, setTasks] = useState<UnifiedMaintenanceTask[]>([]);
  const [blocks, setBlocks] = useState<ScheduledBlock[]>([]);
  const [analytics, setAnalytics] = useState<PlanAnalytics | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<ScheduledBlock | null>(null);
  const [isInjectModalOpen, setIsInjectModalOpen] = useState<boolean>(false);
  const [isBulletinModalOpen, setIsBulletinModalOpen] = useState<boolean>(false);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState<boolean>(false);
  const [activeConflict, setActiveConflict] = useState<TrafficConflict | null>(null);
  const [isResolvingConflict, setIsResolvingConflict] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [optimizing, setOptimizing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'GANTT' | 'MIMIC' | 'WHATIF' | 'TASKS'>('GANTT');
  const [notification, setNotification] = useState<{ msg: string; type?: 'info' | 'alert' } | null>(null);

  // Live ticking IST Clock
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg: string, type: 'info' | 'alert' = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [secRes, tasksRes, planRes] = await Promise.all([
        fetch('/api/network/sections'),
        fetch('/api/tasks'),
        fetch('/api/plan/current'),
      ]);

      const secData = await secRes.json();
      const tasksData = await tasksRes.json();
      const planData = await planRes.json();

      setSections(secData);
      setTasks(tasksData);
      setBlocks(planData.blocks || []);
      setAnalytics(planData.analytics || null);

      try {
        const confRes = await fetch('/api/simulate/conflict');
        const confData = await confRes.json();
        if (confData.conflict) {
          setActiveConflict(confData.conflict);
        }
      } catch {
        // ignore
      }
    } catch (err) {
      console.error('Failed to load railway data:', err);
      showToast('Error connecting to backend API. Please ensure FastAPI is running.', 'alert');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInjectConflict = async (trainNo: string, trainName: string, delayMins: number, sectionId: string) => {
    try {
      const res = await fetch('/api/simulate/conflict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          train_number: trainNo,
          train_name: trainName,
          delay_minutes: delayMins,
          section_id: sectionId,
        }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setActiveConflict(data.conflict);
        showToast(
          `🚨 CONFLICT DETECTED: Train ${trainNo} ${trainName} (+${delayMins}m delay) violates headway of active block on ${data.conflict.section_name}!`,
          'alert'
        );
      }
    } catch (err) {
      console.error('Failed to inject conflict:', err);
      showToast('Failed to simulate train delay.', 'alert');
    }
  };

  const handleResolveConflict = async () => {
    try {
      setIsResolvingConflict(true);
      const res = await fetch('/api/simulate/resolve-conflict', { method: 'POST' });
      const data = await res.json();
      if (data.status === 'resolved') {
        setActiveConflict(null);
        setBlocks(data.blocks || []);
        setAnalytics(data.analytics || null);
        showToast(`⚡ ${data.resolution_note}`, 'info');
      }
    } catch (err) {
      console.error('Failed to resolve conflict:', err);
      showToast('Error resolving conflict with optimizer.', 'alert');
    } finally {
      setIsResolvingConflict(false);
    }
  };

  const handleClearConflict = async () => {
    try {
      await fetch('/api/simulate/clear-conflict', { method: 'POST' });
      setActiveConflict(null);
      showToast('Conflict alert dismissed.', 'info');
    } catch (err) {
      console.error('Failed to clear conflict:', err);
    }
  };

  const handleDefectInjected = async (newBlockCount: number, taskTitle: string, score: number) => {
    await fetchData();
    showToast(
      `🚨 DEFECT INJECTED: "${taskTitle}" received AI Priority ${score}/100! Corridor schedule dynamically updated with ${newBlockCount} blocks.`,
      'alert'
    );
  };

  const handleGeneratePlan = async () => {
    try {
      setOptimizing(true);
      const res = await fetch('/api/plan/generate', { method: 'POST' });
      const data = await res.json();
      setBlocks(data.blocks || []);
      setAnalytics(data.analytics || null);
      showToast(
        `AI Block Plan generated! Co-scheduled ${data.blocks.length} blocks with ${data.analytics?.bundled_blocks_count} multi-dept bundled possessions.`
      );
    } catch (err) {
      console.error('Plan generation failed:', err);
      showToast('Optimization failed. Check server logs.', 'alert');
    } finally {
      setOptimizing(false);
    }
  };

  const handleApproveBlock = async (blockId: string, notes: string) => {
    try {
      const res = await fetch(`/api/plan/blocks/${blockId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_name: 'Chief Controller Prayagraj', planner_notes: notes }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setBlocks((prev) => prev.map((b) => (b.block_id === blockId ? data.block : b)));
        setSelectedBlock(null);
        showToast(`Block ${blockId} officially approved by Section Controller.`);
      }
    } catch (err) {
      console.error('Failed to approve block:', err);
      showToast('Approval action failed.', 'alert');
    }
  };

  const handleRejectBlock = async (blockId: string, notes: string) => {
    try {
      const res = await fetch(`/api/plan/blocks/${blockId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_name: 'Chief Controller Prayagraj', planner_notes: notes }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setBlocks((prev) => prev.map((b) => (b.block_id === blockId ? data.block : b)));
        setSelectedBlock(null);
        showToast(`Block ${blockId} rejected.`);
      }
    } catch (err) {
      console.error('Failed to reject block:', err);
      showToast('Reject action failed.', 'alert');
    }
  };

  return (
    <div className="min-h-screen bg-[#070d18] text-slate-100 flex flex-col selection:bg-sky-500/30 font-sans">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl text-xs flex items-center gap-2.5 animate-in slide-in-from-top duration-200 border ${
            notification.type === 'alert'
              ? 'bg-rose-950 border-rose-500/60 text-rose-200 shadow-rose-950/60'
              : 'bg-sky-950 border-sky-500/60 text-sky-200 shadow-sky-950/60'
          }`}
        >
          {notification.type === 'alert' ? (
            <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
          )}
          <span className="font-medium">{notification.msg}</span>
        </div>
      )}

      {/* Indian Railways Mission Control Top Bar */}
      <header className="bg-slate-950 border-b border-slate-800/80 sticky top-0 z-40 shadow-xl backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-18 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Identity & Crest */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-700 via-blue-900 to-slate-900 rounded-xl border border-sky-400/40 p-2 flex items-center justify-center shadow-lg shadow-blue-950/60">
                <Train className="w-7 h-7 text-sky-400" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm md:text-base tracking-tight text-white uppercase font-mono">
                    NORTH CENTRAL RAILWAY
                  </span>
                  <span className="bg-blue-600/30 text-blue-300 border border-blue-500/40 text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                    PRAYAGRAJ DIVISION
                  </span>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-2 font-mono mt-0.5">
                  <span>COA 2.0 • AI Automatic Corridor Block Planner</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Central Control Room
                  </span>
                </div>
              </div>
            </div>

            {/* Live Clock & Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Live IST Clock */}
              <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl font-mono text-xs">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-slate-200 font-bold tracking-wider">{currentTime || '00:00:00'} IST</span>
              </div>

              {/* Official Bulletin Export (Print/CSV) */}
              <button
                onClick={() => setIsBulletinModalOpen(true)}
                className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow transition-all cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Form T/409 Bulletin</span>
              </button>

              {/* Simulate Train Delay & Conflict Button */}
              <button
                onClick={() => setIsConflictModalOpen(true)}
                className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-rose-500/40 hover:border-rose-400 font-semibold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow transition-all cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Simulate Train Delay</span>
              </button>

              {/* Emergency Defect Injector Button */}
              <button
                onClick={() => setIsInjectModalOpen(true)}
                className="bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-rose-950/50 transition-all cursor-pointer"
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>Report Defect</span>
              </button>

              {/* Run Optimizer Button */}
              <button
                onClick={handleGeneratePlan}
                disabled={optimizing}
                className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs px-4 py-1.5 rounded-xl flex items-center gap-2 shadow-lg shadow-sky-950/60 disabled:opacity-50 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${optimizing ? 'animate-spin' : ''}`} />
                {optimizing ? 'Optimizing...' : 'Run AI Optimizer'}
              </button>
            </div>
          </div>

          {/* Mission Control Tabs */}
          <div className="flex gap-4 border-t border-slate-800/80 text-xs overflow-x-auto">
            <button
              onClick={() => setActiveTab('GANTT')}
              className={`py-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
                activeTab === 'GANTT'
                  ? 'border-sky-400 text-sky-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              24-Hour Corridor Possession Matrix
            </button>
            <button
              onClick={() => setActiveTab('MIMIC')}
              className={`py-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
                activeTab === 'MIMIC'
                  ? 'border-sky-400 text-sky-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="w-4 h-4 text-emerald-400" />
              Live Route Mimic & Digital Twin
            </button>
            <button
              onClick={() => setActiveTab('WHATIF')}
              className={`py-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
                activeTab === 'WHATIF'
                  ? 'border-sky-400 text-sky-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-4 h-4 text-amber-400" />
              Operational "What-If" Simulator
            </button>
            <button
              onClick={() => setActiveTab('TASKS')}
              className={`py-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
                activeTab === 'TASKS'
                  ? 'border-sky-400 text-sky-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4 text-purple-400" />
              Integrated Defect Inventory ({tasks.length})
            </button>
          </div>
        </div>
      </header>

      {/* Main Mission Control Dashboard Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* Active Train Delay Conflict Banner */}
        {activeConflict && (
          <ConflictBanner
            conflict={activeConflict}
            onResolve={handleResolveConflict}
            onClear={handleClearConflict}
            isResolving={isResolvingConflict}
          />
        )}

        {/* Real-Time Telemetry KPI Gauges */}
        <KpiCards analytics={analytics} />

        {/* Tab 1: Corridor Gantt Possession Matrix */}
        {activeTab === 'GANTT' && (
          <CorridorGantt
            sections={sections}
            blocks={blocks}
            onSelectBlock={(b) => setSelectedBlock(b)}
            selectedBlockId={selectedBlock?.block_id || null}
          />
        )}

        {/* Tab 2: Live Route Mimic & Track Schematics */}
        {activeTab === 'MIMIC' && (
          <TrackSchematic
            sections={sections}
            blocks={blocks}
            onSelectBlock={(b) => setSelectedBlock(b)}
          />
        )}

        {/* Tab 3: What-If Operational Trade-off Simulator */}
        {activeTab === 'WHATIF' && (
          <WhatIfSimulator sections={sections} blocks={blocks} />
        )}

        {/* Tab 4: Defect Inventory */}
        {activeTab === 'TASKS' && <TaskInventory tasks={tasks} />}
      </main>

      {/* Explainability & Approval Modal */}
      <ExplainModal
        block={selectedBlock}
        onClose={() => setSelectedBlock(null)}
        onApprove={handleApproveBlock}
        onReject={handleRejectBlock}
      />

      {/* Emergency Defect Injector Modal */}
      <InjectDefectModal
        sections={sections}
        isOpen={isInjectModalOpen}
        onClose={() => setIsInjectModalOpen(false)}
        onDefectInjected={handleDefectInjected}
      />

      {/* Official Indian Railways Form T/409 Bulletin Modal */}
      <OfficialBulletinModal
        isOpen={isBulletinModalOpen}
        onClose={() => setIsBulletinModalOpen(false)}
        blocks={blocks}
        sections={sections}
      />

      {/* Train Delay Conflict Simulator Modal */}
      <ConflictSimulatorModal
        isOpen={isConflictModalOpen}
        onClose={() => setIsConflictModalOpen(false)}
        sections={sections}
        onInjectConflict={handleInjectConflict}
      />
    </div>
  );
};
