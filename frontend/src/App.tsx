import React, { useState, useEffect } from 'react';
import { Section, ScheduledBlock, PlanAnalytics, UnifiedMaintenanceTask } from './types';
import { VisualHero } from './components/VisualHero';
import { KpiCards } from './components/KpiCards';
import { QuickGuide } from './components/QuickGuide';
import { CorridorGantt } from './components/CorridorGantt';
import { TrackSchematic } from './components/TrackSchematic';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { TaskInventory } from './components/TaskInventory';
import { ExplainModal } from './components/ExplainModal';
import { InjectDefectModal } from './components/InjectDefectModal';
import { OfficialBulletinModal } from './components/OfficialBulletinModal';
import { ScheduleFutureBlockModal } from './components/ScheduleFutureBlockModal';
import { RailCopilot } from './components/RailCopilot';
import {
  Train,
  RefreshCw,
  Layers,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sliders,
  Radio,
  Clock,
  Bot,
  Calendar,
  Navigation,
  PlusCircle,
  CalendarPlus,
  Sparkles,
} from 'lucide-react';

export const App: React.FC = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [tasks, setTasks] = useState<UnifiedMaintenanceTask[]>([]);
  const [blocks, setBlocks] = useState<ScheduledBlock[]>([]);
  const [analytics, setAnalytics] = useState<PlanAnalytics | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<ScheduledBlock | null>(null);
  const [isInjectModalOpen, setIsInjectModalOpen] = useState<boolean>(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [isBulletinModalOpen, setIsBulletinModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [optimizing, setOptimizing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'GANTT' | 'APPROVED' | 'MIMIC' | 'WHATIF' | 'TASKS' | 'COPILOT'>('GANTT');
  const [notification, setNotification] = useState<{ msg: string; type?: 'info' | 'alert' } | null>(null);

  const approvedCount = blocks.filter((b) => b.status === 'APPROVED').length;

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
    } catch (err) {
      console.error('Failed to load railway data:', err);
      showToast('Error connecting to backend API. Please verify the server is running.', 'alert');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDefectInjected = async (newBlockCount: number, taskTitle: string, score: number) => {
    await fetchData();
    setActiveTab('GANTT');
    showToast(
      `🚨 Defect recorded: "${taskTitle}" (Priority ${score}/100). Schedule immediately re-optimized into earliest window!`,
      'alert'
    );
  };

  const handleFutureBlockScheduled = async (newBlockCount: number, message: string) => {
    await fetchData();
    showToast(
      message || `Advance Mega Block successfully scheduled. Schedule updated with ${newBlockCount} blocks.`,
      'info'
    );
  };

  const handleGeneratePlan = async () => {
    try {
      setOptimizing(true);
      const res = await fetch('/api/plan/generate', { method: 'POST' });
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      const newBlocks = Array.isArray(data.blocks) ? data.blocks : [];
      const newAnalytics = data.analytics || null;
      setBlocks(newBlocks);
      setAnalytics(newAnalytics);
      if (Array.isArray(data.tasks)) {
        setTasks(data.tasks);
      }
      showToast(
        `Plan updated: ${newBlocks.length} corridor blocks scheduled with ${newAnalytics?.bundled_blocks_count || 0} multi-department possessions.`,
        'info'
      );
    } catch (err: any) {
      console.error('Plan generation failed:', err);
      const errorMsg = err?.message?.includes('Failed to fetch')
        ? 'Cannot connect to backend server (Port 8000). Please ensure server is running.'
        : `Optimization error: ${err?.message || 'Server error'}`;
      showToast(errorMsg, 'alert');
    } finally {
      setOptimizing(false);
    }
  };

  const handleApproveBlock = async (
    blockId: string,
    notes: string,
    timingOptions?: {
      executionTiming: 'SCHEDULED' | 'NOW' | 'CUSTOM';
      customStartTime?: string;
      customEndTime?: string;
    }
  ) => {
    try {
      const payload: Record<string, any> = {
        user_name: 'Chief Controller Prayagraj',
        planner_notes: notes,
        execution_timing: timingOptions?.executionTiming || 'SCHEDULED',
      };
      if (timingOptions?.executionTiming === 'CUSTOM' && timingOptions.customStartTime) {
        payload.custom_start_time = timingOptions.customStartTime;
        payload.custom_end_time = timingOptions.customEndTime;
      }

      const res = await fetch(`/api/plan/blocks/${blockId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.status === 'success') {
        const b = data.block;
        setBlocks((prev) => prev.map((item) => (item.block_id === blockId ? b : item)));
        setSelectedBlock(null);
        const timingDesc =
          timingOptions?.executionTiming === 'NOW'
            ? '🚨 IMMEDIATE POSSESSION APPLIED NOW'
            : timingOptions?.executionTiming === 'CUSTOM'
            ? '📅 FUTURE CUSTOM SLOT'
            : '🕒 SCHEDULED SLOT SANCTIONED';
        showToast(
          `✓ ${timingDesc}: Section ${b.section_id} locked! Blocked from ${b.start_time} to ${b.end_time?.includes(' ') ? b.end_time.split(' ')[1] : b.end_time} IST (${b.duration_minutes}m). Caution orders dispatched.`,
          'info'
        );
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-xs flex items-center gap-2.5 border shadow-xl animate-in fade-in slide-in-from-top-2 ${
            notification.type === 'alert'
              ? 'bg-slate-900 border-red-700/80 text-red-200'
              : 'bg-slate-900 border-emerald-700/80 text-emerald-200'
          }`}
        >
          {notification.type === 'alert' ? (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span className="font-medium">{notification.msg}</span>
        </div>
      )}

      {/* Main Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Identity */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600/10 border border-blue-500/30 rounded-xl flex items-center justify-center text-blue-400 shadow-sm">
                <Train className="w-5 h-5" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-base tracking-tight text-white">
                    AI Railway Block Planner
                  </h1>
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Live Corridor Active
                  </span>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <span>Prayagraj Division (NCR)</span>
                  <span className="text-slate-600">•</span>
                  <span>191 km High-Density Trunk Route</span>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Live IST Clock */}
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>{currentTime || '00:00:00'} IST</span>
              </div>

              {/* Form T/409 Bulletin */}
              <button
                onClick={() => setIsBulletinModalOpen(true)}
                className="bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
              >
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Form T/409 Circular</span>
              </button>

              {/* Report Defect Button */}
              <button
                onClick={() => setIsInjectModalOpen(true)}
                className="bg-slate-950 hover:bg-slate-800 text-amber-300 border border-amber-600/40 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
              >
                <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Report Defect</span>
              </button>

              {/* Schedule Future Mega Block Button */}
              <button
                onClick={() => setIsScheduleModalOpen(true)}
                className="bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-500/50 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer font-bold shadow-sm shadow-purple-950"
              >
                <CalendarPlus className="w-3.5 h-3.5 text-purple-400" />
                <span>+ Schedule Mega Block</span>
              </button>

              {/* Run Optimizer Button */}
              <button
                onClick={handleGeneratePlan}
                disabled={optimizing}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-1.5 rounded-lg flex items-center gap-1.5 disabled:opacity-50 transition-colors cursor-pointer font-bold shadow-sm shadow-blue-600/30"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${optimizing ? 'animate-spin' : ''}`} />
                <span>{optimizing ? 'Optimizing Plan...' : 'Run AI Optimizer'}</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 border-t border-slate-800 text-xs overflow-x-auto pt-1">
            <button
              onClick={() => setActiveTab('GANTT')}
              className={`py-2.5 px-3 font-semibold border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === 'GANTT'
                  ? 'border-blue-500 text-white bg-blue-500/5 rounded-t-lg'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>Schedule & Approvals</span>
            </button>

            <button
              onClick={() => setActiveTab('APPROVED')}
              className={`py-2.5 px-3 font-semibold border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === 'APPROVED'
                  ? 'border-emerald-500 text-white bg-emerald-500/10 rounded-t-lg'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Sanctioned Possessions</span>
              {approvedCount > 0 && (
                <span className="bg-emerald-500 text-slate-950 font-extrabold text-[10px] px-1.5 py-0.2 rounded-full">
                  {approvedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('MIMIC')}
              className={`py-2.5 px-3 font-semibold border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === 'MIMIC'
                  ? 'border-blue-500 text-white bg-blue-500/5 rounded-t-lg'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Navigation className="w-4 h-4 text-emerald-400" />
              <span>Visual Live Map</span>
            </button>

            <button
              onClick={() => setActiveTab('WHATIF')}
              className={`py-2.5 px-3 font-semibold border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === 'WHATIF'
                  ? 'border-blue-500 text-white bg-blue-500/5 rounded-t-lg'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-4 h-4 text-purple-400" />
              <span>What-If Test Bench</span>
            </button>

            <button
              onClick={() => setActiveTab('TASKS')}
              className={`py-2.5 px-3 font-semibold border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === 'TASKS'
                  ? 'border-blue-500 text-white bg-blue-500/5 rounded-t-lg'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Repair Demands ({tasks.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('COPILOT')}
              className={`py-2.5 px-3 font-semibold border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === 'COPILOT'
                  ? 'border-blue-500 text-white bg-blue-500/5 rounded-t-lg'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bot className="w-4 h-4 text-sky-400" />
              <span>AI Chat Assistant</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex-1 w-full space-y-5">
        {/* The Big Picture Visual Diagram (Before vs After AI) */}
        <VisualHero />

        {/* Collapsible 3-Step Quick Guide */}
        <QuickGuide />

        {/* Telemetry KPI Cards */}
        <KpiCards analytics={analytics} />

        {/* Tab: IR-Copilot AI Assistant */}
        {activeTab === 'COPILOT' && (
          <RailCopilot
            blocks={blocks}
            analytics={analytics}
            onPlanUpdated={(newBlocks, newAnalytics) => {
              setBlocks(newBlocks);
              setAnalytics(newAnalytics);
              showToast('Schedule re-optimized by AI Assistant.');
            }}
          />
        )}

        {/* Tab: Corridor Gantt Matrix (All Blocks) */}
        {activeTab === 'GANTT' && (
          <CorridorGantt
            sections={sections}
            blocks={blocks}
            onSelectBlock={(b) => setSelectedBlock(b)}
            selectedBlockId={selectedBlock?.block_id || null}
            initialStatusFilter="ALL"
          />
        )}

        {/* Tab: Dedicated Officially Sanctioned Possessions */}
        {activeTab === 'APPROVED' && (
          <CorridorGantt
            sections={sections}
            blocks={blocks}
            onSelectBlock={(b) => setSelectedBlock(b)}
            selectedBlockId={selectedBlock?.block_id || null}
            initialStatusFilter="APPROVED"
          />
        )}

        {/* Tab: Route Mimic */}
        {activeTab === 'MIMIC' && (
          <TrackSchematic
            sections={sections}
            blocks={blocks}
            onSelectBlock={(b) => setSelectedBlock(b)}
          />
        )}

        {/* Tab: What-If Simulator */}
        {activeTab === 'WHATIF' && (
          <WhatIfSimulator sections={sections} blocks={blocks} />
        )}

        {/* Tab: Defect Inventory */}
        {activeTab === 'TASKS' && <TaskInventory tasks={tasks} />}
      </main>

      {/* Explainability & Approval Modal */}
      <ExplainModal
        block={selectedBlock}
        onClose={() => setSelectedBlock(null)}
        onApprove={handleApproveBlock}
        onReject={handleRejectBlock}
      />

      {/* Defect Injector Modal */}
      <InjectDefectModal
        sections={sections}
        isOpen={isInjectModalOpen}
        onClose={() => setIsInjectModalOpen(false)}
        onDefectInjected={handleDefectInjected}
      />

      {/* Official Form T/409 Bulletin Modal */}
      <OfficialBulletinModal
        isOpen={isBulletinModalOpen}
        onClose={() => setIsBulletinModalOpen(false)}
        blocks={blocks}
        sections={sections}
      />

      {/* Advance Mega Block Reservation Modal */}
      <ScheduleFutureBlockModal
        sections={sections}
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onBlockScheduled={handleFutureBlockScheduled}
      />
    </div>
  );
};
