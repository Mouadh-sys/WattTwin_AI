import React, { useState, useEffect } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { agentService, AgentQueryResult } from '../services/agentService';
import { AgentExecution, ToolInvocation, AgentStatus } from '../types/industrial';
import {
  Bot,
  Terminal,
  Play,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Layers,
  Send,
  HelpCircle,
  Clock,
  Code,
  Lock,
} from 'lucide-react';

export const AiAgentPage: React.FC = () => {
  const { activeExperiment, trustSummary } = useSimulation();

  const [execution, setExecution] = useState<AgentExecution | null>(null);
  const [isRunningInvestigation, setIsRunningInvestigation] = useState(false);
  const [activeTab, setActiveTab] = useState<'tools' | 'reasoning' | 'validator'>('tools');
  const [selectedTool, setSelectedTool] = useState<ToolInvocation | null>(null);

  // Natural language query chat state
  const [queryInput, setQueryInput] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryHistory, setQueryHistory] = useState<
    { query: string; result: AgentQueryResult; timestamp: string }[]
  >([
    {
      query: 'Why is energy consumption higher than the baseline?',
      result: {
        answer:
          'Standby analysis reveals that Machine M-104 (Packaging) maintains continuous 1.75 kW idle heating during queue starvation, consuming 37.8% of all idle energy. Furthermore, M-101 conveyor runs at 100% rated frequency even when buffers are saturated.',
        reasoning: 'Extracted active vs idle duration integrals from EXP-2026-BASE-01 Modbus telemetry log.',
        toolInvocations: [
          {
            id: 'TOOL-INIT',
            timestamp: '2026-10-30T01:10:00Z',
            toolName: 'get_telemetry_summary',
            inputs: { metric: 'idle_vs_active_ratio' },
            outputs: { m104_idle_share: '37.8%' },
            status: 'SUCCESS',
            durationMs: 32,
            explanation: 'Aggregated machine idle energy shares.',
          },
        ],
        proposedAction: 'Run candidate optimization with Packaging Eco-Idle and VFD factor 0.88.',
        isActionAuthorized: true,
      },
      timestamp: '01:12:00',
    },
  ]);

  useEffect(() => {
    agentService.getExecution().then((ex) => {
      setExecution(ex);
      if (ex.toolInvocations.length > 0) {
        setSelectedTool(ex.toolInvocations[0]);
      }
    });
  }, []);

  const handleRunInvestigation = async () => {
    setIsRunningInvestigation(true);
    try {
      const expId = activeExperiment?.id || 'EXP-2026-BASE-01';
      const updated = await agentService.runAutonomousInvestigation(expId);
      setExecution(updated);
      if (updated.toolInvocations.length > 0) {
        setSelectedTool(updated.toolInvocations[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunningInvestigation(false);
    }
  };

  const handleSendQuery = async (queryText?: string) => {
    const text = queryText || queryInput;
    if (!text.trim() || isQuerying) return;

    setIsQuerying(true);
    try {
      const res = await agentService.queryAgent(text, activeExperiment?.id);
      setQueryHistory((prev) => [
        ...prev,
        {
          query: text,
          result: res,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setQueryInput('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsQuerying(false);
    }
  };

  const getStatusColor = (status?: AgentStatus) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-950 text-emerald-400 border-emerald-800';
      case 'EXECUTING':
      case 'PLANNING':
        return 'bg-cyan-950 text-cyan-400 border-cyan-800 animate-pulse';
      case 'WAITING FOR VALIDATION':
        return 'bg-amber-950 text-amber-400 border-amber-800';
      case 'FAILED':
        return 'bg-rose-950 text-rose-400 border-rose-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const approvedTools = [
    { name: 'get_telemetry_summary', desc: 'Queries aggregated power, duty cycles, and part counts' },
    { name: 'inspect_residuals', desc: 'Compares real-time sensor streams against digital twin physics model' },
    { name: 'evaluate_data_trust', desc: 'Checks sensor freshness, noise boundaries, and z-score anomaly bands' },
    { name: 'propose_strategy', desc: 'Invokes OR-Tools deterministic solver with explicit constraints' },
    { name: 'run_candidate_simulation', desc: 'Executes simulated trial of proposed operating parameters in sandbox' },
    { name: 'compare_experiments', desc: 'Calculates relative kWh savings, throughput delta, and defect changes' },
    { name: 'generate_recommendation', desc: 'Synthesizes traceable engineering proposal with 95% CI evidence' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner: Agent Identity & Operational Boundary */}
      <div className="p-5 rounded-xl border border-slate-800 bg-[#0d131f] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-cyan-400">AGENTIC AI ASSISTANT</span>
            <span className="text-xs font-mono text-slate-400">· MCP Orchestration Gateway</span>
          </div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            Energy Diagnostic & Optimization Orchestrator
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans">
            Coordinates approved diagnostic tools, requests deterministic simulations, and drafts recommendations.
            Operates strictly read-only on industrial registers: zero direct PLC write capability.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right font-mono">
            <span className="text-xs text-slate-400 block">Agent Status:</span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded border inline-block mt-0.5 ${getStatusColor(execution?.status)}`}>
              {execution?.status || 'IDLE'}
            </span>
          </div>

          <button
            onClick={handleRunInvestigation}
            disabled={isRunningInvestigation}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isRunningInvestigation ? <RotateCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            <span>Run Diagnostic Plan</span>
          </button>
        </div>
      </div>

      {/* Safety Boundary & Privileges Guard Box */}
      <div className="p-4 rounded-xl border border-slate-800 bg-[#0b101c] grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-slate-300">
            <strong className="text-slate-100">PLC Write Lock:</strong> Direct coil/holding writes forbidden by MCP whitelist.
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-slate-300">
            <strong className="text-slate-100">Independent Validator:</strong> Candidates must pass external safety checks.
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-slate-300">
            <strong className="text-slate-100">Human Approval:</strong> All deployments require explicit operator signoff.
          </span>
        </div>
      </div>

      {/* Current Task & Investigation Plan */}
      {execution && (
        <div className="p-5 rounded-xl border border-slate-800 bg-[#0d131f] space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div>
              <span className="text-xs font-mono text-cyan-400 font-bold block mb-0.5">{execution.id}</span>
              <h4 className="text-sm font-bold text-slate-100">{execution.currentTask}</h4>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Target: {activeExperiment?.id || 'EXP-2026-BASE-01'}
            </span>
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2 font-mono">
              Approved Diagnostic & Simulation Plan
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {execution.investigationPlan.map((step, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-[#111726] border border-slate-800 text-xs text-slate-300 font-mono flex items-center gap-2"
                >
                  <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                    {idx + 1}
                  </span>
                  <span className="truncate">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Two Column Workspace: Tool Invocation Inspector & Natural Language Operator Prompt */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Tool Invocations & Trace Log */}
        <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-[#0d131f] flex flex-col">
          {/* Tabs */}
          <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-[#111726]">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Authorized MCP Tool Execution Trace
              </span>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {execution?.toolInvocations.length || 0} Invocations Logged
            </span>
          </div>

          {/* Tool Timeline List */}
          <div className="p-4 border-b border-slate-800 max-h-56 overflow-y-auto space-y-2">
            {execution?.toolInvocations.map((inv) => (
              <div
                key={inv.id}
                onClick={() => setSelectedTool(inv)}
                className={`p-2.5 rounded-lg border cursor-pointer transition-all text-xs font-mono flex items-center justify-between ${
                  selectedTool?.id === inv.id
                    ? 'border-cyan-500 bg-cyan-950/20 text-slate-100'
                    : 'border-slate-800 bg-[#131b2e] text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      inv.status === 'SUCCESS'
                        ? 'bg-emerald-400'
                        : inv.status === 'BLOCKED_BY_POLICY'
                        ? 'bg-rose-400'
                        : 'bg-amber-400'
                    }`}
                  />
                  <span className="font-bold text-slate-200">{inv.toolName}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] text-slate-400">{inv.durationMs}ms</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                      inv.status === 'SUCCESS'
                        ? 'bg-emerald-950 text-emerald-400'
                        : 'bg-rose-950 text-rose-400'
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Tool JSON Inspector */}
          {selectedTool && (
            <div className="p-4 flex-1 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-400">{selectedTool.toolName}</span>
                <span className="text-[11px] text-slate-400">{selectedTool.id}</span>
              </div>
              <p className="text-slate-300 font-sans text-xs">{selectedTool.explanation}</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Inputs (JSON)</span>
                  <pre className="p-2.5 rounded-lg bg-[#080d16] border border-slate-800 text-[11px] text-cyan-300 overflow-x-auto max-h-36">
                    {JSON.stringify(selectedTool.inputs, null, 2)}
                  </pre>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Outputs (JSON)</span>
                  <pre className="p-2.5 rounded-lg bg-[#080d16] border border-slate-800 text-[11px] text-emerald-300 overflow-x-auto max-h-36">
                    {JSON.stringify(selectedTool.outputs, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Interactive Operator Dialogue & Preset Queries */}
        <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-[#0d131f] flex flex-col h-[520px]">
          <div className="p-3 border-b border-slate-800 bg-[#111726] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Operator Analytical Inquiries
              </span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400">AI Twin Linked</span>
          </div>

          {/* Chat / Response History */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
            {queryHistory.map((item, idx) => (
              <div key={idx} className="space-y-2">
                {/* Operator Query */}
                <div className="p-2.5 rounded-lg bg-cyan-950/20 border border-cyan-800/40 text-cyan-100 font-medium">
                  <span className="text-[10px] font-mono text-cyan-400 block mb-0.5">Operator:</span>
                  {item.query}
                </div>

                {/* Agent Response */}
                <div className="p-3 rounded-lg bg-[#111726] border border-slate-800 text-slate-200 space-y-2 font-sans">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span className="text-emerald-400 font-bold">WattTwin AI:</span>
                    <span>{item.timestamp}</span>
                  </div>
                  <p className="leading-relaxed">{item.result.answer}</p>

                  {item.result.proposedAction && (
                    <div className="p-2 rounded bg-[#0b0f19] border border-slate-800/80 text-[11px] font-mono text-cyan-300">
                      <strong>Proposed Action:</strong> {item.result.proposedAction}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Preset Query Pills */}
          <div className="p-2.5 border-t border-slate-800 bg-[#0b0f19] flex flex-wrap gap-1.5">
            {[
              'Why is energy consumption higher than the baseline?',
              'Which machine contributes most to idle energy consumption?',
              'Find a strategy that reduces energy consumption without reducing throughput.',
              'Explain why the last candidate was rejected.',
            ].map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendQuery(q)}
                className="px-2 py-1 rounded bg-[#131b2e] hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 transition-colors text-left truncate max-w-full cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendQuery();
            }}
            className="p-3 border-t border-slate-800 bg-[#0d131f] flex items-center gap-2"
          >
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Ask an analytical question about Line 1 telemetry..."
              className="flex-1 bg-[#131b2e] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-hidden focus:border-cyan-500 font-sans"
            />
            <button
              type="submit"
              disabled={isQuerying || !queryInput.trim()}
              className="p-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
