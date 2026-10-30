import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  Experiment,
  Machine,
  Sensor,
  SecurityScenarioType,
  SystemService,
  TrustState,
} from '../types/industrial';
import { experimentService } from '../services/experimentService';
import { telemetryService } from '../services/telemetryService';
import { securityService, TrustAssessmentSummary } from '../services/securityService';
import { INITIAL_SYSTEM_SERVICES } from '../services/mock/mockData';

interface SimulationContextType {
  activeExperiment: Experiment | null;
  experiments: Experiment[];
  machines: Machine[];
  sensors: Sensor[];
  systemServices: SystemService[];
  trustSummary: TrustAssessmentSummary | null;
  isRunning: boolean;
  simulationSpeed: number; // 1, 2, 5
  activeAttack: SecurityScenarioType;
  selectedMachineId: string | null;
  setSelectedMachineId: (id: string | null) => void;
  startSimulation: () => Promise<void>;
  pauseSimulation: () => Promise<void>;
  stopSimulation: () => Promise<void>;
  resetSimulation: () => Promise<void>;
  setSimulationSpeed: (speed: number) => void;
  selectExperiment: (id: string) => Promise<void>;
  triggerSecurityScenario: (scenario: SecurityScenarioType) => Promise<void>;
  restoreSecurityNominal: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export const SimulationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [activeExperiment, setActiveExperiment] = useState<Experiment | null>(null);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [systemServices] = useState<SystemService[]>(INITIAL_SYSTEM_SERVICES);
  const [trustSummary, setTrustSummary] = useState<TrustAssessmentSummary | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);
  const [activeAttack, setActiveAttack] = useState<SecurityScenarioType>('normal');
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);

  const refreshAll = useCallback(async () => {
    const exps = await experimentService.getExperiments();
    setExperiments(exps);
    if (!activeExperiment && exps.length > 0) {
      setActiveExperiment(exps[0]);
    } else if (activeExperiment) {
      const refreshedActive = exps.find((e) => e.id === activeExperiment.id);
      if (refreshedActive) setActiveExperiment(refreshedActive);
    }

    const machs = await telemetryService.getMachines();
    setMachines(machs);

    const sens = await telemetryService.getSensors();
    setSensors(sens);

    const trust = await securityService.evaluateTrust(sens);
    setTrustSummary(trust);

    setActiveAttack(securityService.getActiveAttack());
  }, [activeExperiment]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Simulation tick loop when isRunning is true
  useEffect(() => {
    if (!isRunning || !activeExperiment) return;

    const intervalMs = 1000 / simulationSpeed;
    const timer = setInterval(async () => {
      if (activeExperiment.status === 'RUNNING') {
        const updated = await experimentService.tickSimulation(activeExperiment.id, 20 * simulationSpeed);
        setActiveExperiment({ ...updated });
        
        // Slightly vary simulated telemetry for lifelike behavior
        setMachines((prev) =>
          prev.map((m) => {
            const jitter = (Math.random() - 0.5) * 0.08;
            return {
              ...m,
              activePowerKw: Number(Math.max(m.idlePowerKw, m.activePowerKw + jitter).toFixed(2)),
              temperatureC: Number(Math.min(85, m.temperatureC + (Math.random() - 0.48) * 0.1).toFixed(1)),
            };
          })
        );
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isRunning, simulationSpeed, activeExperiment]);

  const startSimulation = async () => {
    if (!activeExperiment) return;
    const updated = await experimentService.updateExperimentStatus(activeExperiment.id, 'RUNNING');
    setActiveExperiment({ ...updated });
    setIsRunning(true);
  };

  const pauseSimulation = async () => {
    if (!activeExperiment) return;
    const updated = await experimentService.updateExperimentStatus(activeExperiment.id, 'PAUSED');
    setActiveExperiment({ ...updated });
    setIsRunning(false);
  };

  const stopSimulation = async () => {
    if (!activeExperiment) return;
    const updated = await experimentService.updateExperimentStatus(activeExperiment.id, 'COMPLETED');
    setActiveExperiment({ ...updated });
    setIsRunning(false);
  };

  const resetSimulation = async () => {
    if (!activeExperiment) return;
    const updated = await experimentService.resetExperiment(activeExperiment.id);
    setActiveExperiment({ ...updated });
    setIsRunning(false);
    refreshAll();
  };

  const selectExperiment = async (id: string) => {
    const exp = await experimentService.getExperimentById(id);
    if (exp) {
      setActiveExperiment(exp);
      setIsRunning(exp.status === 'RUNNING');
    }
  };

  const triggerSecurityScenario = async (scenario: SecurityScenarioType) => {
    await securityService.executeAttackScenario(scenario);
    await refreshAll();
  };

  const restoreSecurityNominal = async () => {
    await securityService.restoreNominalOperation();
    await refreshAll();
  };

  return (
    <SimulationContext.Provider
      value={{
        activeExperiment,
        experiments,
        machines,
        sensors,
        systemServices,
        trustSummary,
        isRunning,
        simulationSpeed,
        activeAttack,
        selectedMachineId,
        setSelectedMachineId,
        startSimulation,
        pauseSimulation,
        stopSimulation,
        resetSimulation,
        setSimulationSpeed,
        selectExperiment,
        triggerSecurityScenario,
        restoreSecurityNominal,
        refreshAll,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
};
