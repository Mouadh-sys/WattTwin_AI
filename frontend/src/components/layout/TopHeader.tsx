import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSimulation } from '../../context/SimulationContext';
import { ShieldCheck, ShieldAlert, AlertTriangle, Plus, Play, Pause } from 'lucide-react';

interface TopHeaderProps {
  onOpenNewExperiment?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onOpenNewExperiment }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeExperiment, trustSummary, isRunning, startSimulation, pauseSimulation, activeAttack } = useSimulation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Overview Dashboard';
      case '/digital-twin':
        return 'Digital Twin & Schematic Telemetry';
      case '/experiments':
        return 'Experiment Management & Execution';
      case '/energy-analytics':
        return 'Energy Analytics & Comparative Modeling';
      case '/security':
        return 'Data Trust & OT Cybersecurity';
      case '/agent':
        return 'Agentic AI Orchestrator (MCP)';
      case '/recommendations':
        return 'Strategy Recommendations & Approval';
      case '/audit':
        return 'Audit Ledger & Process Traceability';
      case '/settings':
        return 'System Configuration & Parameters';
      default:
        return 'Dashboard';
    }
  };

  const getTrustBadge = () => {
    const state = trustSummary?.overallState || 'TRUSTED';
    if (state === 'UNTRUSTED') {
      return (
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-bold bg-rose-950/60 text-rose-400 border border-rose-800">
          <ShieldAlert className="w-3.5 h-3.5" /> UNTRUSTED
        </span>
      );
    }
    if (state === 'SUSPECT') {
      return (
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-950/60 text-amber-400 border border-amber-800">
          <AlertTriangle className="w-3.5 h-3.5" /> SUSPECT
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800">
        <ShieldCheck className="w-3.5 h-3.5" /> TRUSTED
      </span>
    );
  };

  return (
    <header className="h-16 px-6 border-b border-slate-800 bg-[#0a0f19] flex items-center justify-between gap-4 select-none shrink-0 z-20">
      {/* Zone 1: Breadcrumb and Active Experiment */}
      <div className="flex items-center gap-3 overflow-hidden">
        <h2 className="text-sm font-bold text-slate-100 whitespace-nowrap">{getPageTitle()}</h2>
        <span className="text-slate-600">/</span>
        <span className="text-xs font-mono text-slate-400 truncate hidden sm:inline">
          {activeExperiment?.id || 'EXP-2026-BASE-01'}
        </span>
      </div>

      {/* Zone 2: Status & Trust Indicators */}
      <div className="flex items-center gap-4">
        {/* Simulation Notice */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>VIRTUAL TWIN ACTIVE</span>
        </div>

        {/* Data Trust Indicator */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 hidden md:inline">Data Trust:</span>
          {getTrustBadge()}
        </div>

        {activeAttack !== 'normal' && (
          <span className="hidden xl:inline text-xs font-mono text-rose-400 bg-rose-950/50 border border-rose-800/80 px-2 py-0.5 rounded animate-pulse">
            Adversarial Test Active
          </span>
        )}
      </div>

      {/* Zone 3: Quick Action CTAs */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={isRunning ? pauseSimulation : startSimulation}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            isRunning
              ? 'bg-amber-600 hover:bg-amber-500 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700'
          }`}
        >
          {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{isRunning ? 'Pause Sim' : 'Run Sim'}</span>
        </button>

        <button
          onClick={() => {
            if (onOpenNewExperiment) {
              onOpenNewExperiment();
            } else {
              navigate('/experiments');
            }
          }}
          className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Experiment</span>
        </button>
      </div>
    </header>
  );
};
