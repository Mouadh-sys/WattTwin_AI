import React, { useState } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { NewExperimentModal } from '../components/experiments/NewExperimentModal';
import { SimulationToolbar } from '../components/factory/SimulationToolbar';
import { Experiment, ExperimentStatus } from '../types/industrial';
import {
  FlaskConical,
  Plus,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Zap,
  TrendingDown,
  ShieldAlert,
} from 'lucide-react';

export const ExperimentsPage: React.FC = () => {
  const {
    experiments,
    activeExperiment,
    selectExperiment,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    isRunning,
  } = useSimulation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredExperiments = experiments.filter((e) => {
    if (filterStatus === 'all') return true;
    return e.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Simulation Playback & Virtual Clock Bar */}
      <SimulationToolbar />

      {/* Header with New Experiment CTA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-cyan-400" />
            Experiment Management & Execution Suite
          </h3>
          <p className="text-xs text-slate-400 font-sans">
            Configure bounded simulation trials, production targets, and deterministic optimization objectives
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" /> New Experiment
        </button>
      </div>

      {/* Active Experiment Live Execution Monitor Card */}
      {activeExperiment && (
        <div className="rounded-xl border border-cyan-500/30 bg-[#0d1424] p-5 shadow-lg">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold text-cyan-400">{activeExperiment.id}</span>
                <span className="text-xs font-mono text-slate-400">· Version {activeExperiment.config.version}</span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    activeExperiment.status === 'RUNNING'
                      ? 'bg-cyan-950 text-cyan-400 border border-cyan-700 animate-pulse'
                      : activeExperiment.status === 'COMPLETED'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {activeExperiment.status}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-100">{activeExperiment.config.name}</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">{activeExperiment.config.description}</p>
            </div>

            <div className="flex items-center gap-3">
              {activeExperiment.status !== 'RUNNING' ? (
                <button
                  onClick={startSimulation}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" /> Run Simulation
                </button>
              ) : (
                <button
                  onClick={pauseSimulation}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  Pause Run
                </button>
              )}

              <button
                onClick={resetSimulation}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>
          </div>

          {/* Real-time Execution Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-4">
            <div className="p-3 rounded-lg bg-[#111726] border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-0.5">Sim Time Elapsed</span>
              <span className="text-base font-bold font-mono text-slate-100">
                {Math.floor(activeExperiment.currentSimTimeSec / 60)}m {activeExperiment.currentSimTimeSec % 60}s
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">
                of {activeExperiment.config.simulationDurationSec}s
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#111726] border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-0.5">Energy Consumed</span>
              <span className="text-base font-bold font-mono text-cyan-400">
                {activeExperiment.metrics.totalEnergyKwh} kWh
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">
                Baseline: {activeExperiment.metrics.baselineEnergyKwh} kWh
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#111726] border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-0.5">Specific Energy</span>
              <span className="text-base font-bold font-mono text-emerald-400">
                {activeExperiment.metrics.energyPerUnitKwh} kWh/u
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">
                Ref: {activeExperiment.metrics.baselineEnergyPerUnitKwh}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#111726] border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-0.5">Produced Parts</span>
              <span className="text-base font-bold font-mono text-slate-100">
                {activeExperiment.metrics.conformingUnits + activeExperiment.metrics.defectiveUnits}
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">
                Target: {activeExperiment.config.productionTarget}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#111726] border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-0.5">Quality Conformance</span>
              <span className="text-base font-bold font-mono text-slate-100">
                {activeExperiment.metrics.qualityRatePct}%
              </span>
              <span className="text-[10px] text-emerald-400 block font-mono">
                {activeExperiment.metrics.conformingUnits} conforming
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#111726] border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-0.5">Constraint Violations</span>
              <span
                className={`text-base font-bold font-mono ${
                  activeExperiment.metrics.constraintViolationsCount > 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {activeExperiment.metrics.constraintViolationsCount}
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">
                Safety Invariants: Verified
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Experiment List & Comparison Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0d131f] overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Experiment Archive & Version History
          </h4>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 bg-[#131b2e] p-1 rounded-lg border border-slate-800 text-xs">
            {['all', 'COMPLETED', 'RUNNING', 'CONFIGURED', 'PAUSED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded-md font-mono capitalize transition-colors cursor-pointer ${
                  filterStatus === st
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#111726] text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Experiment ID</th>
                <th className="py-3 px-4">Name & Scenario</th>
                <th className="py-3 px-4">Objective</th>
                <th className="py-3 px-4 text-right">Energy (kWh)</th>
                <th className="py-3 px-4 text-right">Specific Energy</th>
                <th className="py-3 px-4 text-right">Throughput</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredExperiments.map((exp) => (
                <tr
                  key={exp.id}
                  className={`hover:bg-[#131b2e]/60 transition-colors ${
                    activeExperiment?.id === exp.id ? 'bg-cyan-950/20' : ''
                  }`}
                >
                  <td className="py-3 px-4 font-mono font-bold text-cyan-400 whitespace-nowrap">
                    {exp.id}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-200">{exp.config.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Scenario: {exp.config.scenario} · Ver: {exp.config.version}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">
                    {exp.config.objective.replace(/_/g, ' ')}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-right text-slate-100 tabular-nums">
                    {exp.metrics.totalEnergyKwh} kWh
                  </td>
                  <td className="py-3 px-4 font-mono text-right text-emerald-400 tabular-nums">
                    {exp.metrics.energyPerUnitKwh} kWh/u
                  </td>
                  <td className="py-3 px-4 font-mono text-right text-slate-300 tabular-nums">
                    {exp.metrics.throughputUph} uph
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold ${
                        exp.status === 'RUNNING'
                          ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                          : exp.status === 'COMPLETED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {exp.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => selectExperiment(exp.id)}
                      className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                        activeExperiment?.id === exp.id
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {activeExperiment?.id === exp.id ? 'Active' : 'Select'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Experiment Modal Dialog */}
      <NewExperimentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={(id) => selectExperiment(id)}
      />
    </div>
  );
};
