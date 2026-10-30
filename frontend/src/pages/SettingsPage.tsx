import React, { useState } from 'react';
import { useSimulation } from '../context/SimulationContext';
import {
  Settings,
  Cpu,
  Shield,
  Bot,
  Sliders,
  Database,
  CheckCircle2,
  Lock,
  RotateCcw,
  Save,
  Server,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { systemServices } = useSimulation();

  // Settings State
  const [virtualDtMs, setVirtualDtMs] = useState(100);
  const [residualThresholdKw, setResidualThresholdKw] = useState(1.2);
  const [zScoreLimit, setZScoreLimit] = useState(2.5);
  const [freshnessTimeoutSec, setFreshnessTimeoutSec] = useState(15);
  const [optimizerSolver, setOptimizerSolver] = useState('OR-Tools CP-SAT (Deterministic)');
  const [agentModel, setAgentModel] = useState('Gemini 2.5 Pro / Flash (Autonomous MCP)');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-xl border border-slate-800 bg-[#0d131f] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-cyan-400">CONFIGURATION & MCP PERMISSIONS</span>
            <span className="text-xs font-mono text-slate-400">· System Parameters</span>
          </div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            WattTwin AI System & Protocol Settings
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans">
            Configure kinematic simulation engine fidelity, data trust thresholds, optimizer weights, and MCP tool access boundaries.
          </p>
        </div>

        {isSaved && (
          <div className="px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-mono flex items-center gap-1.5 animate-bounce">
            <CheckCircle2 className="w-4 h-4" /> Parameters Applied Successfully
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Virtual Simulation Engine */}
        <div className="p-5 rounded-xl border border-slate-800 bg-[#0d131f] space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" /> 1. Virtual Simulator & OpenPLC Parameters
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Virtual Step dt: <span className="font-mono text-cyan-400">{virtualDtMs} ms</span>
              </label>
              <input
                type="range"
                min="20"
                max="250"
                step="10"
                value={virtualDtMs}
                onChange={(e) => setVirtualDtMs(parseInt(e.target.value))}
                className="w-full accent-cyan-500"
              />
              <span className="text-[10px] text-slate-400">Recommended 100ms for stable kinematics</span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">OpenPLC Modbus Port</label>
              <input
                type="text"
                disabled
                value="127.0.0.1:502 (TCP Loopback)"
                className="w-full bg-[#131b2e] border border-slate-700 rounded-lg px-3 py-2 text-slate-400 font-mono"
              />
              <span className="text-[10px] text-slate-400">Headless OpenPLC Runtime container</span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Register Mapping Protocol</label>
              <input
                type="text"
                disabled
                value="IEC 61131-3 (%MW100-%MW148)"
                className="w-full bg-[#131b2e] border border-slate-700 rounded-lg px-3 py-2 text-slate-400 font-mono"
              />
              <span className="text-[10px] text-slate-400">Signed 16-bit integer holding registers</span>
            </div>
          </div>
        </div>

        {/* Section 2: Data Trust & Anomaly Detection Thresholds */}
        <div className="p-5 rounded-xl border border-slate-800 bg-[#0d131f] space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" /> 2. OT Security & Data Trust Thresholds
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Max Permitted Residual: <span className="font-mono text-cyan-400">{residualThresholdKw} kW</span>
              </label>
              <input
                type="number"
                step="0.1"
                value={residualThresholdKw}
                onChange={(e) => setResidualThresholdKw(parseFloat(e.target.value))}
                className="w-full bg-[#131b2e] border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono"
              />
              <span className="text-[10px] text-slate-400">Residual &gt; 1.2 kW triggers SUSPECT state</span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Statistical Z-Score Anomaly Bound: <span className="font-mono text-cyan-400">{zScoreLimit}σ</span>
              </label>
              <input
                type="number"
                step="0.1"
                value={zScoreLimit}
                onChange={(e) => setZScoreLimit(parseFloat(e.target.value))}
                className="w-full bg-[#131b2e] border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono"
              />
              <span className="text-[10px] text-slate-400">Z &gt; 2.5 marks sensor UNTRUSTED</span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Telemetry Freshness Timeout: <span className="font-mono text-cyan-400">{freshnessTimeoutSec}s</span>
              </label>
              <input
                type="number"
                value={freshnessTimeoutSec}
                onChange={(e) => setFreshnessTimeoutSec(parseInt(e.target.value))}
                className="w-full bg-[#131b2e] border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono"
              />
              <span className="text-[10px] text-slate-400">Frozen or delayed packets flagged immediately</span>
            </div>
          </div>
        </div>

        {/* Section 3: AI Agent & MCP Security Constraints */}
        <div className="p-5 rounded-xl border border-slate-800 bg-[#0d131f] space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Bot className="w-4 h-4 text-cyan-400" /> 3. Agentic AI & MCP Tool Whitelist Policy
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Orchestrator Backend Model</label>
              <select
                value={agentModel}
                onChange={(e) => setAgentModel(e.target.value)}
                className="w-full bg-[#131b2e] border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono"
              >
                <option value="gemini-2.5-pro">Gemini 2.5 Pro (Analytical Engineering Mode)</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Low-Latency Stream Mode)</option>
                <option value="deterministic-mock">Deterministic Rule Engine (Offline Mock)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Optimizer Solver Backend</label>
              <input
                type="text"
                disabled
                value={optimizerSolver}
                className="w-full bg-[#131b2e] border border-slate-700 rounded-lg px-3 py-2 text-slate-300 font-mono"
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#0b101c] border border-slate-800 text-xs font-mono space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400">
              <Lock className="w-3.5 h-3.5" />
              <span>MCP Permission Policy: STRICT READ-ONLY ON HARDWARE</span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              The agent is cryptographically restricted from invoking modbus_write_register or plc_force_io.
              All proposed changes must be evaluated as simulated candidates and approved by a human engineer.
            </p>
          </div>
        </div>

        {/* Section 4: Backend API & Database Connection Readiness */}
        <div className="p-5 rounded-xl border border-slate-800 bg-[#0d131f] space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" /> 4. FastAPI & PostgreSQL Integration Target
          </h4>

          <div className="p-4 rounded-lg bg-[#111726] border border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between font-mono">
              <span className="text-slate-300">FastAPI Microservice Layer:</span>
              <span className="text-cyan-400 font-bold">MOCK LAYER ACTIVE (Contracts Fully Typed)</span>
            </div>
            <div className="flex items-center justify-between font-mono">
              <span className="text-slate-300">PostgreSQL Schema Status:</span>
              <span className="text-emerald-400 font-bold">STANDALONE READY (Table Schemas Aligned)</span>
            </div>
            <p className="text-slate-400 font-sans text-[11px] pt-1">
              All UI components communicate strictly through typed interfaces in <code>/src/services</code>.
              Connecting to live FastAPI HTTP and WebSocket endpoints requires zero changes to the presentation layer.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <Save className="w-4 h-4" /> Save System Settings
          </button>
        </div>
      </form>
    </div>
  );
};
