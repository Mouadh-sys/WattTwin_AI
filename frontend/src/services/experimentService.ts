import { Experiment, ExperimentConfiguration, ExperimentStatus, OptimizationCandidate } from '../types/industrial';
import { INITIAL_EXPERIMENTS, INITIAL_CANDIDATES } from './mock/mockData';
import { auditService } from './auditService';
import { securityService } from './securityService';

class ExperimentService {
  private experiments: Experiment[] = JSON.parse(JSON.stringify(INITIAL_EXPERIMENTS));
  private candidates: OptimizationCandidate[] = JSON.parse(JSON.stringify(INITIAL_CANDIDATES));

  public async getExperiments(): Promise<Experiment[]> {
    return [...this.experiments];
  }

  public async getExperimentById(id: string): Promise<Experiment | undefined> {
    return this.experiments.find((e) => e.id === id);
  }

  public async getCandidates(experimentId?: string): Promise<OptimizationCandidate[]> {
    if (!experimentId) return [...this.candidates];
    return this.candidates.filter((c) => c.experimentId === experimentId);
  }

  public async createExperiment(config: Omit<ExperimentConfiguration, 'id' | 'createdAt'>): Promise<Experiment> {
    const id = `EXP-2026-RUN-${Math.floor(100 + Math.random() * 900)}`;
    const fullConfig: ExperimentConfiguration = {
      ...config,
      id,
      createdAt: new Date().toISOString(),
    };

    // Calculate baseline comparison
    const baselineTotal = 119.5;
    const baselinePerUnit = 0.498;

    // Estimate initial predicted performance based on parameters
    const speedFactor = config.machineParameters.conveyorSpeedFactor;
    const pressure = config.machineParameters.sortingPneumaticPressureBar;
    const ecoSave = config.machineParameters.packagingStandbyPowerSave;

    // Power savings estimation
    let factor = 1.0;
    if (speedFactor < 1.0) factor -= (1.0 - speedFactor) * 0.25;
    if (pressure < 6.5) factor -= ((6.5 - pressure) / 6.5) * 0.08;
    if (ecoSave) factor -= 0.12;

    const estimatedTotal = Number((baselineTotal * factor).toFixed(1));
    const estimatedPerUnit = Number((estimatedTotal / (config.productionTarget || 250)).toFixed(3));
    const improvement = Number((((baselinePerUnit - estimatedPerUnit) / baselinePerUnit) * 100).toFixed(1));

    const newExperiment: Experiment = {
      id,
      config: fullConfig,
      status: 'CONFIGURED',
      progressPct: 0,
      currentSimTimeSec: 0,
      metrics: {
        totalEnergyKwh: 0,
        baselineEnergyKwh: baselineTotal,
        energyPerUnitKwh: estimatedPerUnit,
        baselineEnergyPerUnitKwh: baselinePerUnit,
        energyImprovementPct: improvement,
        throughputUph: Number((60.0 * (speedFactor >= 0.8 ? 1.02 : speedFactor / 0.8)).toFixed(1)),
        qualityRatePct: 97.5,
        conformingUnits: 0,
        defectiveUnits: 0,
        idleEnergySharePct: ecoSave ? 16.5 : 36.2,
        constraintViolationsCount: speedFactor < 0.75 ? 1 : 0,
        dataTrustOverall: config.scenario === 'sensor_spoofing' ? 'UNTRUSTED' : 'TRUSTED',
      },
    };

    this.experiments.unshift(newExperiment);

    auditService.logEvent({
      actor: 'Operator',
      action: `Created Experiment Configuration ${id}`,
      associatedExperimentId: id,
      result: 'SUCCESS',
      severity: 'INFO',
      evidenceReference: id,
      details: `Configured objective: ${config.objective}, Target: ${config.productionTarget} units, Duration: ${config.simulationDurationSec}s.`,
    });

    if (config.scenario !== 'normal') {
      await securityService.executeAttackScenario(config.scenario);
    }

    return newExperiment;
  }

  public async updateExperimentStatus(id: string, status: ExperimentStatus): Promise<Experiment> {
    const idx = this.experiments.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error(`Experiment ${id} not found`);

    const exp = this.experiments[idx];
    exp.status = status;

    if (status === 'RUNNING' && !exp.startedAt) {
      exp.startedAt = new Date().toISOString();
    }
    if (status === 'COMPLETED' || status === 'ABORTED') {
      exp.completedAt = new Date().toISOString();
      if (status === 'COMPLETED') exp.progressPct = 100;
    }

    auditService.logEvent({
      actor: 'Experiment Runner',
      action: `Updated Experiment Status to ${status}`,
      associatedExperimentId: id,
      result: 'SUCCESS',
      severity: 'INFO',
      evidenceReference: id,
      details: `Execution state transition: ${status}`,
    });

    return exp;
  }

  public async tickSimulation(id: string, stepSec = 30): Promise<Experiment> {
    const idx = this.experiments.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error(`Experiment ${id} not found`);

    const exp = this.experiments[idx];
    if (exp.status !== 'RUNNING') return exp;

    const newSimTime = Math.min(exp.config.simulationDurationSec, exp.currentSimTimeSec + stepSec);
    const progress = Math.min(100, Math.round((newSimTime / exp.config.simulationDurationSec) * 100));

    // Dynamic metrics accumulation
    const fraction = newSimTime / exp.config.simulationDurationSec;
    const totalSimulatedTargetKwh = exp.config.baselineExperimentId ? 96.8 : 119.5;
    const totalEnergy = Number((totalSimulatedTargetKwh * fraction).toFixed(1));
    const totalUnits = Math.round(exp.config.productionTarget * fraction);
    const conforming = Math.round(totalUnits * 0.975);
    const defective = totalUnits - conforming;

    exp.currentSimTimeSec = newSimTime;
    exp.progressPct = progress;
    exp.metrics.totalEnergyKwh = totalEnergy;
    exp.metrics.conformingUnits = conforming;
    exp.metrics.defectiveUnits = defective;

    if (progress >= 100) {
      exp.status = 'COMPLETED';
      exp.completedAt = new Date().toISOString();
      auditService.logEvent({
        actor: 'Experiment Runner',
        action: `Simulation Run Completed for ${id}`,
        associatedExperimentId: id,
        result: 'SUCCESS',
        severity: 'INFO',
        evidenceReference: id,
        details: `Final energy: ${totalEnergy} kWh, Conforming units: ${conforming}.`,
      });
    }

    return exp;
  }

  public async resetExperiment(id: string): Promise<Experiment> {
    const idx = this.experiments.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error(`Experiment ${id} not found`);

    const exp = this.experiments[idx];
    exp.status = 'CONFIGURED';
    exp.progressPct = 0;
    exp.currentSimTimeSec = 0;
    exp.metrics.totalEnergyKwh = 0;
    exp.metrics.conformingUnits = 0;
    exp.metrics.defectiveUnits = 0;
    exp.startedAt = undefined;
    exp.completedAt = undefined;

    auditService.logEvent({
      actor: 'Experiment Runner',
      action: `Reset Experiment State ${id}`,
      associatedExperimentId: id,
      result: 'SUCCESS',
      severity: 'INFO',
      evidenceReference: id,
      details: 'Simulation clock, registers and accumulator buffers reset to t=0.',
    });

    return exp;
  }
}

export const experimentService = new ExperimentService();
