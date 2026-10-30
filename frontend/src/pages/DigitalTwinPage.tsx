import React, { useState, useEffect } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { IndustrialLineView } from '../components/factory/IndustrialLineView';
import { MachineDetailDrawer } from '../components/factory/MachineDetailDrawer';
import { SimulationToolbar } from '../components/factory/SimulationToolbar';
import { MachineId, Machine } from '../types/industrial';
import { digitalTwinService } from '../services/digitalTwinService';
import { telemetryService } from '../services/telemetryService';
import { TelemetrySample } from '../types/industrial';
import {
  Cpu,
  Layers,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Gauge,
  Sliders,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export const DigitalTwinPage: React.FC = () => {
  const {
    machines,
    sensors,
    selectedMachineId,
    setSelectedMachineId,
    activeAttack,
  } = useSimulation();

  const [timeline, setTimeline] = useState<TelemetrySample[]>([]);
  const [twinStatus, setTwinStatus] = useState(digitalTwinService.getCalibrationStatus());

  useEffect(() => {
    telemetryService.getTimeline().then(setTimeline);
  }, []);

  const selectedMachine: Machine | null =
    machines.find((m) => m.id === selectedMachineId) || null;

  const handleRecalibrate = () => {
    digitalTwinService.recalibrateModel();
    setTwinStatus(digitalTwinService.getCalibrationStatus());
  };

  return (
    <div className="space-y-6">
      {/* Simulation Playback & Speed Controls */}
      <SimulationToolbar />

      {/* Digital Twin Architecture Banner */}
      <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Physics-Informed Digital Twin Observer
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                v1.2.4 SIGNED
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              Parallel state estimator computing expected power, thermal dissipation, and residual vectors in real-time
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right text-xs font-mono">
            <div className="text-slate-400">Model Drift Factor:</div>
            <div className={`font-bold ${twinStatus.driftFactor > 1.1 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {twinStatus.driftFactor.toFixed(2)}x {twinStatus.driftFactor > 1.1 ? '(DEVIATION DETECTED)' : '(CALIBRATED)'}
            </div>
          </div>
          {twinStatus.driftFactor > 1.0 && (
            <button
              onClick={handleRecalibrate}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" /> Recalibrate Twin
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Factory Schematic */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" /> Virtual Line 1 Interactive Schematic
          </h3>
          <span className="text-xs font-mono text-slate-400">
            Click machine nodes below to open telemetry inspector
          </span>
        </div>

        <IndustrialLineView
          onSelectMachine={(id: MachineId) => setSelectedMachineId(id)}
          selectedId={selectedMachineId}
        />
      </div>

      {/* Expected vs Observed Machine State Comparison Grid */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Expected vs. Observed State Matrix (4 Stations)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {machines.map((m) => {
            const expected = digitalTwinService.estimateMachinePower(m);
            const observed = m.activePowerKw;
            const residual = Math.abs(observed - expected);
            const isAbnormal = residual > 1.2;

            return (
              <div
                key={m.id}
                onClick={() => setSelectedMachineId(m.id)}
                className={`p-4 rounded-xl border bg-[#0d131f] transition-all cursor-pointer hover:border-cyan-500/50 ${
                  isAbnormal ? 'border-rose-500/50 bg-rose-950/10' : 'border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-cyan-400">{m.id}</span>
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      m.state === 'RUNNING'
                        ? 'bg-emerald-950 text-emerald-400'
                        : 'bg-amber-950 text-amber-400'
                    }`}
                  >
                    {m.state}
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-100 truncate mb-3">{m.name}</div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Observed Power:</span>
                    <span className="text-slate-100 font-bold tabular-nums">{observed.toFixed(2)} kW</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Twin Expected:</span>
                    <span className="text-cyan-400 tabular-nums">{expected.toFixed(2)} kW</span>
                  </div>
                  <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                    <span>Residual |y - ŷ|:</span>
                    <span className={`font-bold tabular-nums ${isAbnormal ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {residual.toFixed(2)} kW
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400 font-mono flex items-center justify-between">
                  <span>Register: {m.plcRegister.split(' ')[0]}</span>
                  <span>{isAbnormal ? 'Residual Divergence' : 'Model Aligned'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Residual Evolution Timeline */}
      <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Process Residual Dynamics & Anomaly Band
            </h4>
            <p className="text-[11px] text-slate-400 font-sans">
              Instantaneous telemetry difference between physical sensors and digital twin estimation
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Safety Invariant: Residual &lt; 1.5 kW
          </span>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="timestamp" stroke="#475569" fontSize={11} tickLine={false} />
              <YAxis stroke="#475569" fontSize={11} tickLine={false} unit=" kW" domain={[0, 2.0]} />
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
              <Line
                type="monotone"
                dataKey="activeResidualKw"
                name="Instant Residual |y - ŷ|"
                stroke="#06b6d4"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
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
