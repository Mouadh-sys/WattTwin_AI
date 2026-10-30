import React, { useState } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { securityService } from '../services/securityService';
import { SecurityScenarioType } from '../types/industrial';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Zap,
  Lock,
  Unlock,
  Radio,
  FileCheck,
  CheckCircle2,
  XCircle,
  Eye,
} from 'lucide-react';

export const DataTrustSecurityPage: React.FC = () => {
  const {
    sensors,
    trustSummary,
    activeAttack,
    triggerSecurityScenario,
    restoreSecurityNominal,
  } = useSimulation();

  const [events, setEvents] = useState<any[]>([]);
  const [selectedScenarioTab, setSelectedScenarioTab] = useState<SecurityScenarioType>('sensor_spoofing');

  React.useEffect(() => {
    securityService.getSecurityEvents().then(setEvents);
  }, [activeAttack]);

  const handleTrigger = async (type: SecurityScenarioType) => {
    await triggerSecurityScenario(type);
    const evts = await securityService.getSecurityEvents();
    setEvents(evts);
  };

  const handleRestore = async () => {
    await restoreSecurityNominal();
    const evts = await securityService.getSecurityEvents();
    setEvents(evts);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: OT Security & Data Trust Health */}
      <div className="p-5 rounded-xl border border-slate-800 bg-[#0d131f] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-cyan-400">IEC 62443 / OT DATA INTEGRITY</span>
            <span className="text-xs font-mono text-slate-400">· Trust Verification Engine</span>
          </div>
          <h3 className="text-base font-bold text-slate-100">
            Industrial Sensor Trust & Adversarial Resilience Console
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans">
            Guarantees that unverified, drifting, or maliciously injected telemetry cannot manipulate deterministic optimization algorithms or trigger unsafe operating setpoints (Rule F-10).
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right font-mono">
            <span className="text-xs text-slate-400 block">Overall Trust State:</span>
            <span
              className={`text-lg font-bold ${
                trustSummary?.overallState === 'UNTRUSTED'
                  ? 'text-rose-400'
                  : trustSummary?.overallState === 'SUSPECT'
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {trustSummary?.overallState || 'TRUSTED'}
            </span>
          </div>

          <div className="text-right font-mono pl-4 border-l border-slate-800">
            <span className="text-xs text-slate-400 block">Confidence Score:</span>
            <span className="text-lg font-bold text-slate-100 tabular-nums">
              {trustSummary?.confidenceScore || 98}%
            </span>
          </div>
        </div>
      </div>

      {/* Trust Assessment Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3 rounded-lg border border-slate-800 bg-[#111726]">
          <span className="text-[11px] text-slate-400 block">Trusted Sensors</span>
          <span className="text-lg font-bold font-mono text-emerald-400 tabular-nums">
            {trustSummary?.trustedSensorsCount || 9} / {sensors.length}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Within normal band</span>
        </div>

        <div className="p-3 rounded-lg border border-slate-800 bg-[#111726]">
          <span className="text-[11px] text-slate-400 block">Suspect Sensors</span>
          <span className="text-lg font-bold font-mono text-amber-400 tabular-nums">
            {trustSummary?.suspectSensorsCount || 0}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Minor drift/jitter</span>
        </div>

        <div className="p-3 rounded-lg border border-slate-800 bg-[#111726]">
          <span className="text-[11px] text-slate-400 block">Untrusted Sensors</span>
          <span className="text-lg font-bold font-mono text-rose-400 tabular-nums">
            {trustSummary?.untrustedSensorsCount || 0}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Quarantined nodes</span>
        </div>

        <div className="p-3 rounded-lg border border-slate-800 bg-[#111726]">
          <span className="text-[11px] text-slate-400 block">Residual Anomalies</span>
          <span className="text-lg font-bold font-mono text-slate-200 tabular-nums">
            {trustSummary?.residualAnomalyCount || 0}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">|y - ŷ| &gt; 1.2 kW</span>
        </div>

        <div className="p-3 rounded-lg border border-slate-800 bg-[#111726]">
          <span className="text-[11px] text-slate-400 block">Out-of-Range Flags</span>
          <span className="text-lg font-bold font-mono text-slate-200 tabular-nums">
            {trustSummary?.outOfRangeCount || 0}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Hardware clamp</span>
        </div>

        <div className="p-3 rounded-lg border border-slate-800 bg-[#111726]">
          <span className="text-[11px] text-slate-400 block">Optimizer Interlock</span>
          <span
            className={`text-lg font-bold font-mono flex items-center gap-1 ${
              trustSummary?.isOptimizationAllowed ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {trustSummary?.isOptimizationAllowed ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            {trustSummary?.isOptimizationAllowed ? 'AUTHORIZED' : 'INTERLOCKED'}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {trustSummary?.isOptimizationAllowed ? 'Rule F-09 PASS' : 'Rule F-10 BLOCKED'}
          </span>
        </div>
      </div>

      {/* Interactive Cyber Attack Demonstration Sandbox */}
      <div className="p-5 rounded-xl border border-cyan-500/30 bg-[#0d1424] space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <Radio className="w-4 h-4" /> Three Controlled Cybersecurity Demonstration Scenarios
            </h4>
            <p className="text-xs text-slate-400">
              Trigger synthetic attack injections to evaluate automated detection mechanisms and mitigation interlocks
            </p>
          </div>

          {activeAttack !== 'normal' && (
            <button
              onClick={handleRestore}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Apply Mitigation & Restore Nominal
            </button>
          )}
        </div>

        {/* Scenario Selection Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              id: 'sensor_spoofing',
              title: 'A1. False Sensor Data Injection',
              subtitle: 'Altered Modbus power values on M-102',
              desc: 'Injects +5.5 kW artificial power spike to fool optimizer into detecting machine degradation.',
            },
            {
              id: 'twin_poisoning',
              title: 'A2. Digital Twin Model Poisoning',
              subtitle: 'Calibration & physics matrix tampering',
              desc: 'Alters thermal dissipation constants to trigger false temperature warnings and disrupt scheduling.',
            },
            {
              id: 'agent_manipulation',
              title: 'A3. AI Agent Tool Manipulation',
              subtitle: 'Prompt injection & privilege escalation',
              desc: 'Attempts to command unauthorized direct Modbus coil writes to bypass safety interlocks.',
            },
          ].map((sc) => {
            const isActive = activeAttack === sc.id;
            return (
              <div
                key={sc.id}
                onClick={() => setSelectedScenarioTab(sc.id as SecurityScenarioType)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isActive
                    ? 'border-rose-500 bg-rose-950/30 text-slate-100 shadow-md'
                    : selectedScenarioTab === sc.id
                    ? 'border-cyan-500 bg-[#131b2e] text-slate-100'
                    : 'border-slate-800 bg-[#101625] text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-200 text-xs">{sc.title}</span>
                  {isActive && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500 text-white font-bold animate-pulse">
                      ACTIVE ATTACK
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-cyan-400 font-mono mb-2">{sc.subtitle}</div>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">{sc.desc}</p>

                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTrigger(sc.id as SecurityScenarioType);
                    }}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-rose-600 text-white hover:bg-rose-500'
                        : 'bg-slate-800 hover:bg-slate-700 text-cyan-400'
                    }`}
                  >
                    {isActive ? 'Re-Inject' : 'Simulate Attack'}
                  </button>
                  <span className="text-[10px] font-mono text-slate-400">Isolated Virtual Lab</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sensor Trust Monitoring Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0d131f] overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Real-time Sensor Monitoring & Trust Table
          </h4>
          <span className="text-xs font-mono text-slate-400">9 Modbus Inputs Monitored</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#111726] text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Sensor ID</th>
                <th className="py-3 px-4">Associated Station</th>
                <th className="py-3 px-4">Metric & Unit</th>
                <th className="py-3 px-4 text-right">Observed Value</th>
                <th className="py-3 px-4 text-right">Twin Expected</th>
                <th className="py-3 px-4 text-right">Residual</th>
                <th className="py-3 px-4 text-center">Z-Score</th>
                <th className="py-3 px-4 text-center">Trust Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {sensors.map((sensor) => {
                const isBad = sensor.trustState === 'UNTRUSTED';
                const isWarn = sensor.trustState === 'SUSPECT';

                return (
                  <tr
                    key={sensor.id}
                    className={`hover:bg-[#131b2e]/60 transition-colors ${
                      isBad ? 'bg-rose-950/20' : isWarn ? 'bg-amber-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-bold text-cyan-400">{sensor.id}</td>
                    <td className="py-3 px-4 text-slate-300 font-sans">{sensor.machineId}</td>
                    <td className="py-3 px-4 text-slate-300 font-sans">
                      {sensor.name} ({sensor.unit})
                    </td>
                    <td className={`py-3 px-4 text-right font-bold tabular-nums ${isBad ? 'text-rose-400' : 'text-slate-100'}`}>
                      {sensor.currentValue} {sensor.unit}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400 tabular-nums">
                      {sensor.expectedValue} {sensor.unit}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-bold tabular-nums ${
                        isBad ? 'text-rose-400' : isWarn ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {sensor.residual} {sensor.unit}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-300 tabular-nums">
                      {sensor.zScore}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          isBad
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : isWarn
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        }`}
                      >
                        {sensor.trustState}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Incident Timeline & Traceability Evidence */}
      <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">
          Incident Audit Log & Evidence Chain
        </h4>

        <div className="space-y-3">
          {events.slice(0, 4).map((evt) => (
            <div
              key={evt.id}
              className={`p-4 rounded-xl border text-xs space-y-2 ${
                evt.severity === 'CRITICAL'
                  ? 'border-rose-500/40 bg-rose-950/20'
                  : evt.severity === 'HIGH'
                  ? 'border-amber-500/40 bg-amber-950/20'
                  : 'border-slate-800 bg-[#111726]'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-cyan-400">{evt.id}</span>
                  <span className="font-bold text-slate-100">{evt.title}</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      evt.severity === 'CRITICAL'
                        ? 'bg-rose-500 text-white'
                        : evt.severity === 'HIGH'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {evt.severity}
                  </span>
                  <span className="text-slate-400">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300 font-sans">
                <div>
                  <span className="text-[11px] text-slate-400 block font-mono">Injected Anomaly:</span>
                  {evt.injectedAnomaly}
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-mono">Detection Mechanism:</span>
                  {evt.detectionMechanism}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
                <span className="text-cyan-300">Mitigation: {evt.mitigationAction}</span>
                <span className="text-slate-400">Evidence: {evt.auditEvidence}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
