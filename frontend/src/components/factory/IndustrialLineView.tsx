import React from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { MachineId, MachineState } from '../../types/industrial';
import { Zap, Activity, Thermometer, Gauge, ShieldAlert, Cpu } from 'lucide-react';

interface IndustrialLineViewProps {
  onSelectMachine?: (id: MachineId) => void;
  selectedId?: string | null;
}

export const IndustrialLineView: React.FC<IndustrialLineViewProps> = ({
  onSelectMachine,
  selectedId,
}) => {
  const { machines, isRunning, activeAttack } = useSimulation();

  const getMachine = (id: MachineId) => machines.find((m) => m.id === id);

  const m101 = getMachine('M-101');
  const m102 = getMachine('M-102');
  const m103 = getMachine('M-103');
  const m104 = getMachine('M-104');

  const getStateColor = (state?: MachineState) => {
    switch (state) {
      case 'RUNNING':
        return '#10b981'; // green
      case 'IDLE':
        return '#f59e0b'; // amber
      case 'FAULT':
        return '#ef4444'; // red
      case 'STOPPED':
        return '#64748b'; // slate
      default:
        return '#94a3b8';
    }
  };

  const isAttacked = (id: MachineId) => {
    if (activeAttack === 'sensor_spoofing' && id === 'M-102') return true;
    return false;
  };

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-slate-800 bg-[#0d131f] p-4 select-none">
      {/* Background Industrial Blueprint Grid */}
      <div className="absolute inset-0 industrial-grid opacity-30 pointer-events-none" />

      {/* Header bar of the schematic view */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-300">
            Line 1: Discrete Manufacturing & Inspection Cell
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            · OpenPLC Modbus Loop (4 Nodes)
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Running
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Idle/Standby
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-500" /> Stopped
          </span>
          {activeAttack !== 'normal' && (
            <span className="flex items-center gap-1 text-rose-400 font-semibold">
              <ShieldAlert className="w-3.5 h-3.5" /> Cyber Anomaly Active
            </span>
          )}
        </div>
      </div>

      {/* Interactive SVG Schematic Diagram */}
      <div className="relative w-full aspect-[21/9] min-h-[300px]">
        <svg
          viewBox="0 0 1000 420"
          className="w-full h-full"
          style={{ shapeRendering: 'geometricPrecision' }}
        >
          <defs>
            {/* Linear Gradients for industrial machines */}
            <linearGradient id="conveyorGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="machineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#111827" />
            </linearGradient>
            <linearGradient id="busLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>

            {/* Workpiece marker */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* OpenPLC Industrial Bus Connection (Modbus TCP Backbone) */}
          <g id="modbus-backbone" opacity="0.8">
            <path
              d="M 50 380 L 950 380"
              stroke="#0369a1"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
            {/* Drop lines to each machine */}
            <path d="M 160 380 L 160 330" stroke="#0284c7" strokeWidth="2" />
            <path d="M 390 380 L 390 330" stroke="#0284c7" strokeWidth="2" />
            <path d="M 620 380 L 620 330" stroke="#0284c7" strokeWidth="2" />
            <path d="M 850 380 L 850 330" stroke="#0284c7" strokeWidth="2" />
            
            {/* Master OpenPLC node box */}
            <rect x="30" y="360" width="85" height="36" rx="4" fill="#082f49" stroke="#0284c7" strokeWidth="1.5" />
            <text x="72" y="376" fill="#7dd3fc" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">OpenPLC</text>
            <text x="72" y="388" fill="#38bdf8" fontSize="8" fontFamily="monospace" textAnchor="middle">127.0.0.1:502</text>
          </g>

          {/* Continuous Conveyor Belt Loop System (Connecting all 4 stations) */}
          <g id="conveyor-track">
            {/* Main belt bed */}
            <rect x="70" y="210" width="860" height="24" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="2" />
            {/* Belt rollers */}
            {[100, 180, 260, 340, 420, 500, 580, 660, 740, 820, 900].map((rx, idx) => (
              <circle key={idx} cx={rx} cy={222} r="8" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
            ))}

            {/* Material Flow: Animated workpieces moving along the line when running */}
            {isRunning && (
              <>
                <g>
                  <circle cx="120" cy="202" r="7" fill="#38bdf8" filter="url(#glow)">
                    <animate attributeName="cx" from="80" to="920" dur="8s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="340" cy="202" r="7" fill="#0ea5e9">
                    <animate attributeName="cx" from="80" to="920" dur="8s" begin="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="560" cy="202" r="7" fill="#06b6d4">
                    <animate attributeName="cx" from="80" to="920" dur="8s" begin="4s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="780" cy="202" r="7" fill="#22c55e">
                    <animate attributeName="cx" from="80" to="920" dur="8s" begin="6s" repeatCount="indefinite" />
                  </circle>
                </g>
              </>
            )}
          </g>

          {/* ================= STATION 1: M-101 CONVEYOR VFD ================= */}
          <g
            id="station-m101"
            className="cursor-pointer transition-all duration-150"
            onClick={() => onSelectMachine?.('M-101')}
          >
            {/* Outer Machine Housing */}
            <rect
              x="80"
              y="60"
              width="170"
              height="250"
              rx="8"
              fill="url(#machineGrad)"
              stroke={selectedId === 'M-101' ? '#38bdf8' : '#334155'}
              strokeWidth={selectedId === 'M-101' ? '2.5' : '1.5'}
            />
            {/* Station Title */}
            <text x="95" y="85" fill="#94a3b8" fontSize="10" fontFamily="monospace">M-101 · %MW101</text>
            <text x="95" y="103" fill="#f8fafc" fontSize="12" fontWeight="bold">Feed Conveyor</text>
            <text x="95" y="117" fill="#64748b" fontSize="9">Variable Frequency Drive</text>

            {/* Motor Icon & Graphic */}
            <circle cx="165" cy="165" r="32" fill="#0f172a" stroke="#475569" strokeWidth="2" />
            <circle cx="165" cy="165" r="16" fill="#1e293b" />
            <path
              d="M 165 137 L 165 193 M 137 165 L 193 165"
              stroke="#64748b"
              strokeWidth="2"
              strokeDasharray={isRunning ? '2 2' : 'none'}
            >
              {isRunning && (
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 165 165"
                  to="360 165 165"
                  dur="3s"
                  repeatCount="indefinite"
                />
              )}
            </path>

            {/* Machine State Indicator LED */}
            <circle cx="230" cy="82" r="5" fill={getStateColor(m101?.state)} />

            {/* Telemetry pill */}
            <rect x="92" y="240" width="146" height="58" rx="4" fill="#0b0f19" stroke="#1e293b" />
            <text x="100" y="258" fill="#94a3b8" fontSize="9" fontFamily="monospace">Power: <tspan fill="#38bdf8" fontWeight="bold">{m101?.activePowerKw || 2.85} kW</tspan></text>
            <text x="100" y="274" fill="#94a3b8" fontSize="9" fontFamily="monospace">Speed: <tspan fill="#f8fafc">{m101?.speedRpm || 1420} RPM</tspan></text>
            <text x="100" y="290" fill="#94a3b8" fontSize="9" fontFamily="monospace">Temp: <tspan fill="#f8fafc">{m101?.temperatureC || 46.2}°C</tspan></text>
          </g>

          {/* ================= STATION 2: M-102 PRECISION MILLING CNC ================= */}
          <g
            id="station-m102"
            className="cursor-pointer transition-all duration-150"
            onClick={() => onSelectMachine?.('M-102')}
          >
            {/* Outer Machine Housing */}
            <rect
              x="300"
              y="40"
              width="190"
              height="270"
              rx="8"
              fill="url(#machineGrad)"
              stroke={
                isAttacked('M-102')
                  ? '#ef4444'
                  : selectedId === 'M-102'
                  ? '#38bdf8'
                  : '#334155'
              }
              strokeWidth={selectedId === 'M-102' || isAttacked('M-102') ? '2.5' : '1.5'}
            />
            {/* Attack Banner if active */}
            {isAttacked('M-102') && (
              <g>
                <rect x="300" y="40" width="190" height="20" rx="4" fill="#dc2626" />
                <text x="395" y="54" fill="#ffffff" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                  SPOOFED TELEMETRY DETECTED
                </text>
              </g>
            )}

            {/* Station Title */}
            <text x="315" y={isAttacked('M-102') ? 78 : 65} fill="#94a3b8" fontSize="10" fontFamily="monospace">M-102 · %MW102</text>
            <text x="315" y={isAttacked('M-102') ? 95 : 83} fill="#f8fafc" fontSize="12" fontWeight="bold">Precision Milling</text>
            <text x="315" y={isAttacked('M-102') ? 109 : 97} fill="#64748b" fontSize="9">Spindle & Heat Chamber</text>

            {/* Spindle & Cutter Graphic */}
            <rect x="375" y="115" width="40" height="60" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" />
            <polygon points="385,175 405,175 395,195" fill={isRunning ? '#f59e0b' : '#64748b'} />

            {/* Machine State Indicator LED */}
            <circle cx="470" cy={isAttacked('M-102') ? 75 : 65} r="5" fill={getStateColor(m102?.state)} />

            {/* Telemetry pill */}
            <rect x="312" y="225" width="166" height="72" rx="4" fill="#0b0f19" stroke="#1e293b" />
            <text x="320" y="244" fill="#94a3b8" fontSize="9" fontFamily="monospace">
              Power: <tspan fill={isAttacked('M-102') ? '#ef4444' : '#38bdf8'} fontWeight="bold">{m102?.activePowerKw || 13.4} kW</tspan>
            </text>
            <text x="320" y="260" fill="#94a3b8" fontSize="9" fontFamily="monospace">
              Twin Exp: <tspan fill="#10b981">13.20 kW</tspan>
            </text>
            <text x="320" y="276" fill="#94a3b8" fontSize="9" fontFamily="monospace">
              Residual: <tspan fill={isAttacked('M-102') ? '#ef4444' : '#f8fafc'}>{isAttacked('M-102') ? '+5.5 kW (UNTRUSTED)' : '0.2 kW'}</tspan>
            </text>
            <text x="320" y="292" fill="#94a3b8" fontSize="9" fontFamily="monospace">
              Temp: <tspan fill="#f8fafc">{m102?.temperatureC || 68.7}°C</tspan>
            </text>
          </g>

          {/* ================= STATION 3: M-103 PNEUMATIC SORTER ================= */}
          <g
            id="station-m103"
            className="cursor-pointer transition-all duration-150"
            onClick={() => onSelectMachine?.('M-103')}
          >
            {/* Outer Machine Housing */}
            <rect
              x="540"
              y="60"
              width="170"
              height="250"
              rx="8"
              fill="url(#machineGrad)"
              stroke={selectedId === 'M-103' ? '#38bdf8' : '#334155'}
              strokeWidth={selectedId === 'M-103' ? '2.5' : '1.5'}
            />
            {/* Station Title */}
            <text x="555" y="85" fill="#94a3b8" fontSize="10" fontFamily="monospace">M-103 · %MW103</text>
            <text x="555" y="103" fill="#f8fafc" fontSize="12" fontWeight="bold">Optical Sorter</text>
            <text x="555" y="117" fill="#64748b" fontSize="9">Pneumatic Ejection Manifold</text>

            {/* Optical sensor & Piston valve */}
            <rect x="615" y="130" width="22" height="45" fill="#0f172a" stroke="#64748b" />
            <path d="M 626 175 L 626 200" stroke="#38bdf8" strokeWidth="3" />
            <circle cx="626" cy="138" r="4" fill="#06b6d4" />

            {/* Machine State Indicator LED */}
            <circle cx="690" cy="82" r="5" fill={getStateColor(m103?.state)} />

            {/* Telemetry pill */}
            <rect x="552" y="240" width="146" height="58" rx="4" fill="#0b0f19" stroke="#1e293b" />
            <text x="560" y="258" fill="#94a3b8" fontSize="9" fontFamily="monospace">Power: <tspan fill="#38bdf8" fontWeight="bold">{m103?.activePowerKw || 4.1} kW</tspan></text>
            <text x="560" y="274" fill="#94a3b8" fontSize="9" fontFamily="monospace">Pressure: <tspan fill="#f8fafc">6.2 bar</tspan></text>
            <text x="560" y="290" fill="#94a3b8" fontSize="9" fontFamily="monospace">Duty: <tspan fill="#f8fafc">{m103?.dutyCyclePct || 54.0}%</tspan></text>
          </g>

          {/* ================= STATION 4: M-104 PACKAGING & PALLETIZER ================= */}
          <g
            id="station-m104"
            className="cursor-pointer transition-all duration-150"
            onClick={() => onSelectMachine?.('M-104')}
          >
            {/* Outer Machine Housing */}
            <rect
              x="760"
              y="60"
              width="170"
              height="250"
              rx="8"
              fill="url(#machineGrad)"
              stroke={selectedId === 'M-104' ? '#38bdf8' : '#334155'}
              strokeWidth={selectedId === 'M-104' ? '2.5' : '1.5'}
            />
            {/* Station Title */}
            <text x="775" y="85" fill="#94a3b8" fontSize="10" fontFamily="monospace">M-104 · %MW104</text>
            <text x="775" y="103" fill="#f8fafc" fontSize="12" fontWeight="bold">Packaging Cell</text>
            <text x="775" y="117" fill="#64748b" fontSize="9">Sealing & Pallet Stacking</text>

            {/* Heating block & packaging arm */}
            <rect x="815" y="135" width="60" height="35" rx="3" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" />
            <path d="M 825 152 L 865 152" stroke={m104?.state === 'IDLE' ? '#f59e0b' : '#ef4444'} strokeWidth="2" strokeDasharray="3 3" />

            {/* Machine State Indicator LED */}
            <circle cx="910" cy="82" r="5" fill={getStateColor(m104?.state)} />

            {/* Standby waste badge */}
            {m104?.state === 'IDLE' && (
              <g>
                <rect x="775" y="180" width="138" height="18" rx="3" fill="#451a03" stroke="#b45309" strokeWidth="1" />
                <text x="844" y="192" fill="#fbbf24" fontSize="8" fontFamily="monospace" textAnchor="middle">
                  UNMANAGED STANDBY: 1.75 kW
                </text>
              </g>
            )}

            {/* Telemetry pill */}
            <rect x="772" y="240" width="146" height="58" rx="4" fill="#0b0f19" stroke="#1e293b" />
            <text x="780" y="258" fill="#94a3b8" fontSize="9" fontFamily="monospace">Power: <tspan fill="#38bdf8" fontWeight="bold">{m104?.activePowerKw || 1.75} kW</tspan></text>
            <text x="780" y="274" fill="#94a3b8" fontSize="9" fontFamily="monospace">Idle Loss: <tspan fill="#fbbf24">37.8%</tspan></text>
            <text x="780" y="290" fill="#94a3b8" fontSize="9" fontFamily="monospace">Counter: <tspan fill="#10b981">184 units</tspan></text>
          </g>
        </svg>
      </div>

      {/* Footer hint */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-mono">
        <span>Click any machine station node to inspect real-time Modbus telemetry & parameter limits</span>
        <span>Simulated isolated environment · Modbus register map synchronized</span>
      </div>
    </div>
  );
};
