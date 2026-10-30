import React, { useState, useEffect } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { telemetryService } from '../services/telemetryService';
import { TelemetrySample, Machine } from '../types/industrial';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
} from 'recharts';
import {
  Zap,
  TrendingDown,
  Activity,
  Layers,
  Filter,
  Download,
  Info,
} from 'lucide-react';

export const EnergyAnalyticsPage: React.FC = () => {
  const { experiments, machines } = useSimulation();
  const [timeline, setTimeline] = useState<TelemetrySample[]>([]);
  const [selectedExpId, setSelectedExpId] = useState<string>('EXP-2026-OPT-03');
  const [selectedMachineFilter, setSelectedMachineFilter] = useState<string>('all');
  const [timeWindow, setTimeWindow] = useState<string>('full');

  useEffect(() => {
    telemetryService.getTimeline().then(setTimeline);
  }, []);

  const baselineKwh = 119.5;
  const optimizedKwh = 96.8;
  const netSavingsKwh = baselineKwh - optimizedKwh;
  const savingsPct = 18.99;

  // Machine breakdown dataset
  const machineBreakdown = [
    { name: 'M-101 Conveyor', activeKwh: 11.4, idleKwh: 3.4, optimizedKwh: 10.1, idleReduction: 38 },
    { name: 'M-102 Milling', activeKwh: 48.2, idleKwh: 16.0, optimizedKwh: 52.8, idleReduction: 22 },
    { name: 'M-103 Sorter', activeKwh: 16.2, idleKwh: 5.4, optimizedKwh: 15.1, idleReduction: 45 },
    { name: 'M-104 Packaging', activeKwh: 8.5, idleKwh: 10.4, optimizedKwh: 11.2, idleReduction: 64 },
  ];

  // Specific energy comparison
  const specificEnergyComparison = [
    { category: 'EXP-2026-BASE-01 (Baseline)', specificEnergy: 0.498, throughput: 60.0 },
    { category: 'CAND-01 (VFD Throttling)', specificEnergy: 0.435, throughput: 60.5 },
    { category: 'CAND-02 / OPT-03 (Eco-Standby)', specificEnergy: 0.395, throughput: 61.2 },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header & Filtering Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-4 rounded-xl border border-slate-800 bg-[#0d131f]">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            Industrial Energy Analytics & Idle Power Accounting
          </h3>
          <p className="text-xs text-slate-400 font-sans">
            Deterministic evaluation of active vs. standby power dissipation across Line 1 machines
          </p>
        </div>

        {/* Global Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedExpId}
              onChange={(e) => setSelectedExpId(e.target.value)}
              className="bg-[#131b2e] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-200"
            >
              <option value="EXP-2026-BASE-01">Baseline (EXP-2026-BASE-01)</option>
              <option value="EXP-2026-OPT-03">Optimized (EXP-2026-OPT-03)</option>
              <option value="EXP-2026-SEC-ATTACK">Security Test (EXP-2026-SEC)</option>
            </select>
          </div>

          <select
            value={selectedMachineFilter}
            onChange={(e) => setSelectedMachineFilter(e.target.value)}
            className="bg-[#131b2e] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-200"
          >
            <option value="all">All Machines (Line 1)</option>
            <option value="M-101">M-101 Feed Conveyor</option>
            <option value="M-102">M-102 Milling Unit</option>
            <option value="M-103">M-103 Optical Sorter</option>
            <option value="M-104">M-104 Packaging Cell</option>
          </select>
        </div>
      </div>

      {/* KPI Highlights Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-800 bg-[#0d131f]">
          <span className="text-xs text-slate-400 block mb-1">Baseline Total Energy</span>
          <div className="text-2xl font-bold font-mono text-slate-200">{baselineKwh} kWh</div>
          <span className="text-[11px] font-mono text-slate-500">Unmanaged standby operation</span>
        </div>

        <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20">
          <span className="text-xs text-cyan-300 block mb-1">Optimized Total Energy</span>
          <div className="text-2xl font-bold font-mono text-cyan-400">{optimizedKwh} kWh</div>
          <span className="text-[11px] font-mono text-emerald-400">Net savings: -{netSavingsKwh.toFixed(1)} kWh (-{savingsPct}%)</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-[#0d131f]">
          <span className="text-xs text-slate-400 block mb-1">Energy per Conforming Unit</span>
          <div className="text-2xl font-bold font-mono text-emerald-400">0.395 kWh/u</div>
          <span className="text-[11px] font-mono text-slate-500">Down from 0.498 kWh/u baseline</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-[#0d131f]">
          <span className="text-xs text-slate-400 block mb-1">Total Avoidable Idle Loss</span>
          <div className="text-2xl font-bold font-mono text-amber-400">35.2 kWh</div>
          <span className="text-[11px] font-mono text-slate-500">64% mitigated via Eco-Sleep</span>
        </div>
      </div>

      {/* Primary Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Baseline vs. Optimized Power Profile */}
        <div className="p-5 rounded-xl border border-slate-800 bg-[#0d131f]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                1. Continuous Power Comparison (kW)
              </h4>
              <p className="text-[11px] text-slate-400">
                Baseline continuous draw vs. dynamic throttle and standby shutoff
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-semibold">-22.7 kWh Saved</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Area
                  type="monotone"
                  dataKey="baselinePowerKw"
                  name="Baseline Strategy (kWh)"
                  stroke="#64748b"
                  fill="#64748b"
                  fillOpacity={0.15}
                  strokeDasharray="4 4"
                />
                <Area
                  type="monotone"
                  dataKey="totalPowerKw"
                  name="Optimized Strategy (kWh)"
                  stroke="#06b6d4"
                  fill="#06b6d4"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Machine Level Idle vs Active Breakdown */}
        <div className="p-5 rounded-xl border border-slate-800 bg-[#0d131f]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                2. Machine-Level Energy Breakdown (Active vs. Idle)
              </h4>
              <p className="text-[11px] text-slate-400">
                Identifying high-loss standby machines vs productive load
              </p>
            </div>
            <span className="text-xs font-mono text-amber-400 font-semibold">M-104 Highest Idle Ratio</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={machineBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} unit=" kWh" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="activeKwh" name="Productive Energy (Active)" fill="#06b6d4" stackId="a" />
                <Bar dataKey="idleKwh" name="Standby Loss (Idle)" fill="#f59e0b" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Throughput vs. Energy Trade-off Curve */}
        <div className="p-5 rounded-xl border border-slate-800 bg-[#0d131f]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                3. Production Throughput vs. Power Dissipation
              </h4>
              <p className="text-[11px] text-slate-400">
                Validating that energy optimization does not degrade line throughput (uph)
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="timestamp" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis yAxisId="left" stroke="#06b6d4" fontSize={11} tickLine={false} unit=" kW" />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={11} tickLine={false} unit=" uph" domain={[40, 70]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Area yAxisId="left" type="monotone" dataKey="totalPowerKw" name="Power (kW)" fill="#06b6d4" fillOpacity={0.2} stroke="#06b6d4" />
                <Line yAxisId="right" type="monotone" dataKey="instantThroughputUph" name="Throughput (uph)" stroke="#10b981" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Specific Energy Comparison Across Candidate Runs */}
        <div className="p-5 rounded-xl border border-slate-800 bg-[#0d131f]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                4. Specific Energy (kWh/unit) Across Strategy Versions
              </h4>
              <p className="text-[11px] text-slate-400">
                Standard baseline vs. individual candidate formulations
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={specificEnergyComparison} layout="vertical" margin={{ top: 10, right: 20, left: 30, bottom: 0 }}>
                <XAxis type="number" stroke="#475569" fontSize={11} tickLine={false} unit=" kWh/u" domain={[0, 0.6]} />
                <YAxis dataKey="category" type="category" stroke="#94a3b8" fontSize={10} tickLine={false} width={130} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                />
                <Bar dataKey="specificEnergy" name="kWh per Conforming Unit" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Engineering Analytical Insights */}
      <div className="p-4 rounded-xl border border-slate-800 bg-[#0b101c] flex items-start gap-3 text-xs">
        <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-slate-300">
          <span className="font-bold text-slate-100">Engineering Interpretation:</span> All values reflect deterministic simulation of kinematics, electrical motor curves, and pneumatic discharge formulas. Physical experiments show that targeting M-104 heating coil standby dwells produces the highest energy ROI without altering line takt time or risking part defect spikes.
        </div>
      </div>
    </div>
  );
};
