import React from 'react';
import { Machine } from '../../types/industrial';
import { X, Activity, Zap, Thermometer, Gauge, Cpu, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';

interface MachineDetailDrawerProps {
  machine: Machine | null;
  onClose: () => void;
}

export const MachineDetailDrawer: React.FC<MachineDetailDrawerProps> = ({ machine, onClose }) => {
  const { sensors, activeAttack } = useSimulation();

  if (!machine) return null;

  const machineSensors = sensors.filter((s) => s.machineId === machine.id);
  const isCompromised = activeAttack === 'sensor_spoofing' && machine.id === 'M-102';

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#0f172a] border-l border-slate-800 shadow-2xl z-50 flex flex-col">
      {/* Drawer Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-cyan-400 font-semibold">{machine.id}</span>
            <span className="text-xs font-mono text-slate-500">· {machine.plcRegister}</span>
          </div>
          <h3 className="text-base font-bold text-slate-100">{machine.name}</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Security Alert Banner if attacked */}
        {isCompromised && (
          <div className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-xs text-rose-200">
            <div className="flex items-center gap-1.5 font-bold mb-1 text-rose-400">
              <AlertTriangle className="w-4 h-4" /> Telemetry Anomaly Detected
            </div>
            Sensor SEN-PWR-102 shows +5.5 kW residual deviation compared to physics-based digital twin. Optimization algorithms have quarantined this node.
          </div>
        )}

        {/* Status Card */}
        <div className="p-4 rounded-xl bg-[#131b2e] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Operational State</span>
            <span
              className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                machine.state === 'RUNNING'
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                  : machine.state === 'IDLE'
                  ? 'bg-amber-950/60 text-amber-400 border border-amber-800'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {machine.state}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {machine.statusMessage}
          </p>
        </div>

        {/* Operating Telemetry Grid */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Real-time Telemetry (Simulated Modbus)
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-[#131b2e] border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Zap className="w-3.5 h-3.5 text-cyan-400" /> Active Power
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-100">
                {machine.activePowerKw} <span className="text-xs font-normal text-slate-400">kW</span>
              </div>
              <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                Idle base: {machine.idlePowerKw} kW
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#131b2e] border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Thermometer className="w-3.5 h-3.5 text-amber-400" /> Temperature
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-100">
                {machine.temperatureC} <span className="text-xs font-normal text-slate-400">°C</span>
              </div>
              <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                Safe limit: &lt; 85°C
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#131b2e] border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Gauge className="w-3.5 h-3.5 text-emerald-400" /> Velocity / RPM
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-100">
                {machine.speedRpm} <span className="text-xs font-normal text-slate-400">RPM</span>
              </div>
              <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                Duty: {machine.dutyCyclePct}%
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#131b2e] border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Activity className="w-3.5 h-3.5 text-purple-400" /> Vibration RMS
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-100">
                {machine.vibrationMmS} <span className="text-xs font-normal text-slate-400">mm/s</span>
              </div>
              <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                ISO 10816 Zone A
              </div>
            </div>
          </div>
        </div>

        {/* Associated Sensors & Trust Table */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Assigned Physical Sensors
          </h4>
          <div className="space-y-2">
            {machineSensors.map((s) => (
              <div
                key={s.id}
                className="p-3 rounded-lg bg-[#131b2e] border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-200">{s.name}</div>
                  <div className="font-mono text-[11px] text-slate-500">
                    {s.id} · Range [{s.minRange} - {s.maxRange} {s.unit}]
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-slate-100">
                    {s.currentValue} {s.unit}
                  </div>
                  <span
                    className={`font-mono text-[10px] font-semibold ${
                      s.trustState === 'TRUSTED'
                        ? 'text-emerald-400'
                        : s.trustState === 'SUSPECT'
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {s.trustState}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Digital Twin Residual Analysis */}
        <div className="p-4 rounded-xl bg-[#0b101c] border border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h5 className="text-xs font-bold text-slate-200">Digital Twin State Coherence</h5>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Expected Power (Model):</span>
              <span className="text-slate-200">{machine.idlePowerKw + 6.2} kW</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Observed Residual |y - ŷ|:</span>
              <span className={isCompromised ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                {isCompromised ? '5.50 kW (HIGH DRIFT)' : '0.14 kW (NOMINAL)'}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Modbus Coherence:</span>
              <span className="text-slate-200">100% (No packet loss)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Drawer Footer */}
      <div className="p-4 border-t border-slate-800 bg-[#0d131f] text-[11px] text-slate-500 font-mono flex items-center justify-between">
        <span>Hardware Register: {machine.plcRegister}</span>
        <span className="text-cyan-400">Read-Only Observation</span>
      </div>
    </div>
  );
};
