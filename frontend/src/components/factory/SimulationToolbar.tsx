import React from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { Play, Pause, Square, RotateCcw, FastForward, Clock, ShieldCheck } from 'lucide-react';

export const SimulationToolbar: React.FC = () => {
  const {
    activeExperiment,
    isRunning,
    simulationSpeed,
    startSimulation,
    pauseSimulation,
    stopSimulation,
    resetSimulation,
    setSimulationSpeed,
  } = useSimulation();

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const currentSec = activeExperiment?.currentSimTimeSec || 0;
  const totalSec = activeExperiment?.config.simulationDurationSec || 3600;
  const progressPct = activeExperiment?.progressPct || 0;

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-3.5 mb-6">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          {!isRunning ? (
            <button
              onClick={startSimulation}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start</span>
            </button>
          ) : (
            <button
              onClick={pauseSimulation}
              className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause</span>
            </button>
          )}

          <button
            onClick={stopSimulation}
            disabled={!isRunning && progressPct === 0}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Square className="w-3.5 h-3.5" />
            <span>Stop</span>
          </button>

          <button
            onClick={resetSimulation}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 bg-[#131b2e] p-1 rounded-lg border border-slate-800 ml-2">
            {[1, 2, 5].map((speed) => (
              <button
                key={speed}
                onClick={() => setSimulationSpeed(speed)}
                className={`px-2 py-0.5 text-xs font-mono rounded font-semibold transition-colors cursor-pointer ${
                  simulationSpeed === speed
                    ? 'bg-cyan-500 text-slate-950'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Simulation Clock & Progress */}
        <div className="flex-1 max-w-md flex flex-col justify-center">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              Virtual Clock: <span className="text-slate-100 font-bold">{formatSeconds(currentSec)}</span> / {formatSeconds(totalSec)}
            </span>
            <span className="text-cyan-400 font-bold">{progressPct}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-500 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Safety Disclaimer Banner */}
        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 bg-[#111726] px-3 py-1.5 rounded-lg border border-slate-800 shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="hidden xl:inline">Isolated Virtual Twin · No physical PLC connected</span>
          <span className="xl:hidden">Virtual Twin Mode</span>
        </div>
      </div>
    </div>
  );
};
