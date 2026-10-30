import React, { useState, useEffect } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { MetricCard } from '../components/common/MetricCard';
import { IndustrialLineView } from '../components/factory/IndustrialLineView';
import { MachineDetailDrawer } from '../components/factory/MachineDetailDrawer';
import { SimulationToolbar } from '../components/factory/SimulationToolbar';
import { MachineId, Machine } from '../types/industrial';
import { telemetryService } from '../services/telemetryService';
import { TelemetrySample } from '../types/industrial';
import {
  Zap,
  Activity,
  Layers,
  CheckCircle,
  ShieldCheck,
  TrendingDown,
  Server,
  ArrowRight,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Link } from 'react-router-dom';

export const OverviewPage: React.FC = () => {
  const {
    activeExperiment,
    machines,
    systemServices,
    trustSummary,
    selectedMachineId,
    setSelectedMachineId,
  } = useSimulation();

  const [timeline, setTimeline] = useState<TelemetrySample[]>([]);

  useEffect(() => {
    telemetryService.getTimeline().then(setTimeline);
  }, []);

  const selectedMachine: Machine | null =
    machines.find((m) => m.id === selectedMachineId) || null;

  const metrics = activeExperiment?.metrics || {
    totalEnergyKwh: 119.5,
    baselineEnergyKwh: 119.5,
    energyPerUnitKwh: 0.498,
    baselineEnergyPerUnitKwh: 0.498,
    energyImprovementPct: 0.0,
    throughputUph: 60.0,
    qualityRatePct: 96.0,
    conformingUnits: 240,
    defectiveUnits: 10,
    idleEnergySharePct: 37.8,
    constraintViolationsCount: 0,
    dataTrustOverall: 'TRUSTED' as const,
  };

  // Machine power distribution data for chart
  const machineDistributionData = machines.map((m) => ({
    name: m.name.split(' ')[0],
    fullName: m.name,
    active: m.activePowerKw,
    idle: m.idlePowerKw,
    id: m.id,
  }));

  return (
    <div className="space-y-6">
      {/* Simulation Playback & Virtual Clock Bar */}
      <SimulationToolbar />

      {/* Top-Level KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <MetricCard
          label="Total Simulated Energy"
          value={metrics.totalEnergyKwh || '119.5'}
          unit="kWh"
          baselineValue={`${metrics.baselineEnergyKwh} kWh`}
          improvementPct={metrics.energyImprovementPct}
          invertTrendColor={true}
          status={metrics.energyImprovementPct > 0 ? 'nominal' : 'neutral'}
          statusText={metrics.energyImprovementPct > 0 ? 'Optimized' : 'Baseline'}
          icon={<Zap className="w-4 h-4 text-cyan-400" />}
        />

        <MetricCard
          label="Energy per Conforming Unit"
          value={metrics.energyPerUnitKwh || '0.498'}
          unit="kWh/u"
          baselineValue={`${metrics.baselineEnergyPerUnitKwh} kWh/u`}
          improvementPct={metrics.energyImprovementPct}
          invertTrendColor={true}
          status={metrics.energyImprovementPct > 0 ? 'nominal' : 'neutral'}
          statusText="Primary Objective"
          icon={<TrendingDown className="w-4 h-4 text-emerald-400" />}
        />

        <MetricCard
          label="Simulated Throughput"
          value={metrics.throughputUph || '60.0'}
          unit="uph"
          baselineValue="60.0 uph"
          status={metrics.throughputUph >= 55 ? 'nominal' : 'alert'}
          statusText={metrics.throughputUph >= 55 ? 'Above 55 uph min' : 'Violation'}
          icon={<Activity className="w-4 h-4 text-cyan-400" />}
        />

        <MetricCard
          label="Process Quality Rate"
          value={metrics.qualityRatePct || '96.0'}
          unit="%"
          baselineValue="96.0%"
          status={metrics.qualityRatePct >= 95 ? 'nominal' : 'warning'}
          statusText={`${metrics.conformingUnits || 240} Conf. / ${metrics.defectiveUnits || 10} Def.`}
          icon={<CheckCircle className="w-4 h-4 text-emerald-400" />}
        />

        <MetricCard
          label="Relative Energy Gain"
          value={metrics.energyImprovementPct > 0 ? `+${metrics.energyImprovementPct}` : '0.0'}
          unit="%"
          annotation="Vs. Reference Baseline"
          status={metrics.energyImprovementPct > 0 ? 'nominal' : 'neutral'}
          statusText={metrics.energyImprovementPct > 0 ? 'Target Achieved' : 'Nominal Run'}
          icon={<Layers className="w-4 h-4 text-cyan-400" />}
        />

        <MetricCard
          label="Data Trust State"
          value={trustSummary?.overallState || 'TRUSTED'}
          annotation={`Conf: ${trustSummary?.confidenceScore || 98}%`}
          status={
            trustSummary?.overallState === 'UNTRUSTED'
              ? 'alert'
              : trustSummary?.overallState === 'SUSPECT'
              ? 'warning'
              : 'nominal'
          }
          statusText={
            trustSummary?.overallState === 'UNTRUSTED'
              ? 'Optim. Locked'
              : trustSummary?.overallState === 'SUSPECT'
              ? 'Restricted'
              : 'Nominal'
          }
          icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
        />
      </div>

      {/* Production Overview: Interactive Factory Schematic */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100">Live Production Line Schematic</h3>
            <p className="text-xs text-slate-400 font-sans">
              Real-time kinematic simulation of 4 discrete manufacturing stations with Modbus PLC coupling
            </p>
          </div>
          <Link
            to="/digital-twin"
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
          >
            Detailed Twin View <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <IndustrialLineView
          onSelectMachine={(id: MachineId) => setSelectedMachineId(id)}
          selectedId={selectedMachineId}
        />
      </div>

      {/* Energy Overview & Machine Breakdown Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dynamic Energy Consumption Timeline */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-[#0d131f] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Simulated Power Over Time (kW)
              </h4>
              <p className="text-[11px] text-slate-400 font-sans">
                Baseline profile vs. Active optimization trial with machine cycling
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-3 h-1 bg-slate-500 rounded-sm" /> Baseline
              </span>
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-3 h-1 bg-cyan-400 rounded-sm" /> Optimized
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOptimized" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#64748b" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#64748b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="timestamp" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} unit=" kW" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="baselinePowerKw"
                  name="Baseline Power"
                  stroke="#64748b"
                  strokeDasharray="3 3"
                  fillOpacity={1}
                  fill="url(#colorBaseline)"
                />
                <Area
                  type="monotone"
                  dataKey="totalPowerKw"
                  name="Optimized Power"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorOptimized)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Machine Power Distribution Bar */}
        <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-5 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              Active vs Idle Power by Station
            </h4>
            <p className="text-[11px] text-slate-400 font-sans mb-4">
              Standby energy sinks targeted by deterministic optimization
            </p>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={machineDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={10} tickLine={false} unit=" kW" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                    iconSize={8}
                  />
                  <Bar dataKey="idle" name="Idle Baseline" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="active" name="Current Active" fill="#06b6d4" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
            Key finding: M-104 Packaging contributes 37.8% of idle waste due to unmanaged heater dwell.
          </div>
        </div>
      </div>

      {/* System Health & Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Services Health Matrix */}
        <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Core System Services & Telemetry Adapters
              </h4>
            </div>
            <span className="text-[11px] font-mono text-emerald-400">7 / 7 Online</span>
          </div>

          <div className="space-y-2">
            {systemServices.map((srv) => (
              <div
                key={srv.id}
                className="p-2.5 rounded-lg bg-[#111726] border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div className="truncate pr-2">
                  <div className="font-semibold text-slate-200 truncate">{srv.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">{srv.role}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] font-mono text-slate-400">{srv.latencyMs} ms</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800">
                    {srv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Industrial Activity & Governance Events */}
        <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Operational Activity & Security Events
                </h4>
              </div>
              <Link
                to="/audit"
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                View Audit Trail <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-[#111726] border border-slate-800 text-xs">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="font-mono text-cyan-400 font-semibold">RECOMMENDATION</span>
                  <span className="font-mono text-[10px]">2026-10-30 01:10</span>
                </div>
                <div className="text-slate-200 font-medium">
                  REC-2026-001 (Eco-Standby & VFD Throttling) awaiting operator review.
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Predicted savings: 22.7 kWh (18.99%). Validated by independent checker.
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#111726] border border-slate-800 text-xs">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="font-mono text-emerald-400 font-semibold">EXPERIMENT COMPLETED</span>
                  <span className="font-mono text-[10px]">2026-10-29 15:30</span>
                </div>
                <div className="text-slate-200 font-medium">
                  EXP-2026-OPT-03 achieved 96.8 kWh with zero safety invariant violations.
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#111726] border border-slate-800 text-xs">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="font-mono text-amber-400 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> SECURITY MONITOR
                  </span>
                  <span className="font-mono text-[10px]">2026-10-30 00:18</span>
                </div>
                <div className="text-slate-200 font-medium">
                  Synthetic sensor spoofing test evaluated. Optimizer interlock successfully engaged.
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Actor: AI Agent + OpenPLC Runtime</span>
            <span className="text-slate-400">Zero Unhandled Faults</span>
          </div>
        </div>
      </div>

      {/* Machine Telemetry Inspection Drawer */}
      <MachineDetailDrawer
        machine={selectedMachine}
        onClose={() => setSelectedMachineId(null)}
      />
    </div>
  );
};
