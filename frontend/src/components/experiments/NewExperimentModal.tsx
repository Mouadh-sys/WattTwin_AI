import React, { useState } from 'react';
import { OptimizationObjective, SecurityScenarioType, ExperimentConfiguration } from '../../types/industrial';
import { useSimulation } from '../../context/SimulationContext';
import { experimentService } from '../../services/experimentService';
import { X, Check, ShieldAlert, Cpu, Sliders, Target, CheckCircle2 } from 'lucide-react';

interface NewExperimentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (experimentId: string) => void;
}

export const NewExperimentModal: React.FC<NewExperimentModalProps> = ({ isOpen, onClose, onCreated }) => {
  const { refreshAll } = useSimulation();

  const [name, setName] = useState('Dynamic Eco-Standby & Variable Frequency Trial');
  const [description, setDescription] = useState('Evaluate synchronized conveyor deceleration and packaging heater standby throttling to minimize energy per conforming unit.');
  const [version, setVersion] = useState('v1.3.0');
  const [objective, setObjective] = useState<OptimizationObjective>('min_energy_per_unit');
  const [scenario, setScenario] = useState<SecurityScenarioType>('normal');
  const [productionTarget, setProductionTarget] = useState(250);
  const [durationSec, setDurationSec] = useState(3600);
  const [minThroughput, setMinThroughput] = useState(55);
  const [maxDefectRate, setMaxDefectRate] = useState(4.0);
  const [maxTemp, setMaxTemp] = useState(80.0);
  const [enforceInvariants, setEnforceInvariants] = useState(true);

  // Machine parameters
  const [conveyorSpeed, setConveyorSpeed] = useState(0.88);
  const [batchSize, setBatchSize] = useState(12);
  const [pressureBar, setPressureBar] = useState(5.2);
  const [packagingEco, setPackagingEco] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const config: Omit<ExperimentConfiguration, 'id' | 'createdAt'> = {
        name,
        description,
        version,
        scenario,
        productionTarget,
        simulationDurationSec: durationSec,
        objective,
        constraints: {
          minThroughputUph: minThroughput,
          maxDefectRatePct: maxDefectRate,
          maxTemperatureC: maxTemp,
          enforceSafetyInvariants: enforceInvariants,
        },
        machineParameters: {
          conveyorSpeedFactor: conveyorSpeed,
          processingBatchSize: batchSize,
          sortingPneumaticPressureBar: pressureBar,
          packagingStandbyPowerSave: packagingEco,
        },
        baselineExperimentId: 'EXP-2026-BASE-01',
        randomSeed: Math.floor(Math.random() * 1000) + 1,
      };

      const created = await experimentService.createExperiment(config);
      await refreshAll();
      setIsSubmitting(false);
      onCreated(created.id);
      onClose();
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs select-none">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-slate-100">Configure New Industrial Experiment</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs font-sans">
          {/* Section 1: Experiment Info */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" /> 1. Experiment Identification
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Experiment Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-[#131b2e] border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-hidden focus:border-cyan-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Configuration Version</label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="w-full bg-[#131b2e] border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Optimization Objective</label>
                  <select
                    value={objective}
                    onChange={(e) => setObjective(e.target.value as OptimizationObjective)}
                    className="w-full bg-[#131b2e] border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono"
                  >
                    <option value="min_energy_per_unit">Min Energy per Conforming Unit</option>
                    <option value="min_total_energy">Min Total Energy (kWh)</option>
                    <option value="energy_throughput_tradeoff">Energy vs Throughput Pareto Trade-off</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description & Rationale</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-[#131b2e] border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-hidden focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Operating & Machine Parameters */}
          <div className="pt-4 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" /> 2. Machine & Production Parameters
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  M-101 Conveyor Speed Factor: <span className="font-mono text-cyan-400">{conveyorSpeed}x</span>
                </label>
                <input
                  type="range"
                  min="0.6"
                  max="1.2"
                  step="0.02"
                  value={conveyorSpeed}
                  onChange={(e) => setConveyorSpeed(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500"
                />
                <span className="text-[10px] text-slate-400">Baseline is 1.0x (50 Hz nominal)</span>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  M-103 Sorter Pneumatic Pressure: <span className="font-mono text-cyan-400">{pressureBar} bar</span>
                </label>
                <input
                  type="range"
                  min="4.0"
                  max="7.0"
                  step="0.1"
                  value={pressureBar}
                  onChange={(e) => setPressureBar(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500"
                />
                <span className="text-[10px] text-slate-400">Baseline is 6.5 bar</span>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Target Production (units)</label>
                <input
                  type="number"
                  value={productionTarget}
                  onChange={(e) => setProductionTarget(parseInt(e.target.value) || 250)}
                  className="w-full bg-[#131b2e] border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Simulation Duration (seconds)</label>
                <input
                  type="number"
                  value={durationSec}
                  onChange={(e) => setDurationSec(parseInt(e.target.value) || 3600)}
                  className="w-full bg-[#131b2e] border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <input
                type="checkbox"
                id="packagingEco"
                checked={packagingEco}
                onChange={(e) => setPackagingEco(e.target.checked)}
                className="rounded accent-cyan-500 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="packagingEco" className="text-slate-200 cursor-pointer">
                Enable M-104 Smart Eco-Standby (Cuts heating power during empty buffer queues)
              </label>
            </div>
          </div>

          {/* Section 3: Optimization Constraints */}
          <div className="pt-4 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400" /> 3. Independent Safety Constraints
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Min Throughput (uph)</label>
                <input
                  type="number"
                  value={minThroughput}
                  onChange={(e) => setMinThroughput(parseFloat(e.target.value) || 55)}
                  className="w-full bg-[#131b2e] border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Max Defect Rate (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={maxDefectRate}
                  onChange={(e) => setMaxDefectRate(parseFloat(e.target.value) || 4)}
                  className="w-full bg-[#131b2e] border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Max Spindle Temp (°C)</label>
                <input
                  type="number"
                  value={maxTemp}
                  onChange={(e) => setMaxTemp(parseFloat(e.target.value) || 80)}
                  className="w-full bg-[#131b2e] border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <input
                type="checkbox"
                id="enforceInvariants"
                checked={enforceInvariants}
                onChange={(e) => setEnforceInvariants(e.target.checked)}
                className="rounded accent-emerald-500 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="enforceInvariants" className="text-slate-200 cursor-pointer">
                Strict invariant validation (Automatic rejection if any constraint violated)
              </label>
            </div>
          </div>

          {/* Section 4: Security Scenario */}
          <div className="pt-4 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" /> 4. Security & Anomaly Injection Test
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'normal', label: 'Normal Operation', desc: 'No attack injection. Clean telemetry stream.' },
                { id: 'sensor_spoofing', label: 'A1 - Sensor Spoofing', desc: 'Inject +5.5 kW false reading on M-102.' },
                { id: 'twin_poisoning', label: 'A2 - Digital Twin Poisoning', desc: 'Mutate thermal model parameters.' },
                { id: 'agent_manipulation', label: 'A3 - Agent Manipulation', desc: 'Forge unauthorized PLC register write.' },
              ].map((s) => (
                <div
                  key={s.id}
                  onClick={() => setScenario(s.id as SecurityScenarioType)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    scenario === s.id
                      ? 'bg-cyan-950/30 border-cyan-500 text-slate-100'
                      : 'bg-[#131b2e] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-slate-200 mb-0.5">{s.label}</div>
                  <div className="text-[11px] text-slate-400">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#0d131f] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Check className="w-4 h-4" />
            {isSubmitting ? 'Initializing Simulation...' : 'Initialize & Launch Experiment'}
          </button>
        </div>
      </div>
    </div>
  );
};
