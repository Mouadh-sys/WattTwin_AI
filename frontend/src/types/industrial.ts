/**
 * Core Industrial & Digital Twin Type Definitions for WattTwin AI
 * Built according to NexaForge Industrial Intelligence specifications.
 */

export type MachineId = 'M-101' | 'M-102' | 'M-103' | 'M-104';

export type MachineType = 'conveyor' | 'processing' | 'sorting' | 'packaging';

export type MachineState = 'RUNNING' | 'IDLE' | 'STOPPED' | 'FAULT';

export type TrustState = 'TRUSTED' | 'SUSPECT' | 'UNTRUSTED';

export type ServiceStatus = 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'NOT CONFIGURED';

export type SecurityScenarioType = 'normal' | 'sensor_spoofing' | 'twin_poisoning' | 'agent_manipulation';

export type OptimizationObjective = 'min_total_energy' | 'min_energy_per_unit' | 'energy_throughput_tradeoff';

export interface Machine {
  id: MachineId;
  name: string;
  type: MachineType;
  state: MachineState;
  activePowerKw: number;       // Current simulated power (kW)
  idlePowerKw: number;         // Nominal idle baseline power (kW)
  peakPowerKw: number;         // Max rated power (kW)
  temperatureC: number;        // Motor/bearing temperature (°C)
  speedRpm: number;            // Current operating speed / cycle rate
  vibrationMmS: number;        // Vibration velocity (mm/s)
  dutyCyclePct: number;        // Percentage of time in active production
  totalEnergyKwh: number;      // Accumulated energy for current run
  plcRegister: string;         // Modbus register mapping (e.g., %MW102)
  statusMessage: string;
}

export interface Sensor {
  id: string;
  machineId: MachineId;
  name: string;
  metric: string;
  unit: string;
  currentValue: number;
  expectedValue: number;       // Digital Twin model prediction
  residual: number;            // |currentValue - expectedValue|
  minRange: number;
  maxRange: number;
  trustState: TrustState;
  lastUpdate: string;          // ISO string
  zScore: number;
  anomalyReason?: string;
}

export interface TelemetrySample {
  timestamp: string;           // Virtual clock or ISO
  timeSeconds: number;
  totalPowerKw: number;
  baselinePowerKw: number;
  conveyorPowerKw: number;
  processingPowerKw: number;
  sortingPowerKw: number;
  packagingPowerKw: number;
  cumulativeEnergyKwh: number;
  baselineEnergyKwh: number;
  unitsProduced: number;
  conformingUnits: number;
  defectiveUnits: number;
  instantThroughputUph: number;
  activeResidualKw: number;
}

export interface ExperimentConfiguration {
  id: string;
  name: string;
  description: string;
  version: string;
  createdAt: string;
  scenario: SecurityScenarioType;
  productionTarget: number;    // target units (e.g., 250)
  simulationDurationSec: number; // e.g., 3600s
  objective: OptimizationObjective;
  constraints: {
    minThroughputUph: number;  // e.g. 50 uph
    maxDefectRatePct: number;  // e.g. 4.0%
    maxTemperatureC: number;   // e.g. 85°C
    enforceSafetyInvariants: boolean;
  };
  machineParameters: {
    conveyorSpeedFactor: number;   // 0.6 - 1.2
    processingBatchSize: number;   // 5 - 20
    sortingPneumaticPressureBar: number; // 4.5 - 7.0
    packagingStandbyPowerSave: boolean;  // whether to switch to eco-idle
  };
  baselineExperimentId?: string;
  randomSeed: number;
}

export type ExperimentStatus = 'CONFIGURED' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'ABORTED';

export interface Experiment {
  id: string;
  config: ExperimentConfiguration;
  status: ExperimentStatus;
  startedAt?: string;
  completedAt?: string;
  progressPct: number;
  currentSimTimeSec: number;
  metrics: {
    totalEnergyKwh: number;
    baselineEnergyKwh: number;
    energyPerUnitKwh: number;
    baselineEnergyPerUnitKwh: number;
    energyImprovementPct: number;
    throughputUph: number;
    qualityRatePct: number;
    conformingUnits: number;
    defectiveUnits: number;
    idleEnergySharePct: number;
    constraintViolationsCount: number;
    dataTrustOverall: TrustState;
  };
}

export interface OptimizationCandidate {
  id: string;
  experimentId: string;
  title: string;
  proposedChanges: string[];
  parameters: {
    conveyorSpeed: number;
    processingIdlePolicy: 'standard' | 'aggressive_eco' | 'sleep_between_batches';
    sortingPressureBar: number;
    packagingAutoOffDelaySec: number;
  };
  predictedEnergyKwh: number;
  baselineEnergyKwh: number;
  predictedSavingsPct: number;
  predictedThroughputUph: number;
  predictedQualityPct: number;
  independentValidatorPassed: boolean;
  validatorNotes: string;
  feasibilityScore: number;    // 0 - 100
}

export interface ToolInvocation {
  id: string;
  timestamp: string;
  toolName: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  status: 'SUCCESS' | 'BLOCKED_BY_POLICY' | 'ERROR';
  durationMs: number;
  explanation: string;
}

export type AgentStatus = 'IDLE' | 'PLANNING' | 'EXECUTING' | 'WAITING FOR VALIDATION' | 'COMPLETED' | 'FAILED';

export interface AgentExecution {
  id: string;
  status: AgentStatus;
  currentTask: string;
  investigationPlan: string[];
  reasoningSummary: string;
  toolInvocations: ToolInvocation[];
  validationResults: {
    checkedAt: string;
    passed: boolean;
    safetyInvariantsVerified: boolean;
    dataIntegrityVerified: boolean;
    details: string;
  };
}

export type RecommendationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Recommendation {
  id: string;
  experimentId: string;
  candidateId: string;
  title: string;
  proposedStrategy: string;
  reason: string;
  baselineEnergyKwh: number;
  predictedOptimizedEnergyKwh: number;
  expectedImprovementPct: number;
  expectedThroughputUph: number;
  expectedQualityRatePct: number;
  constraintValidationResults: {
    throughputSatisfied: boolean;
    qualitySatisfied: boolean;
    safetyInvariantsSatisfied: boolean;
    plcWriteIsolated: boolean;
  };
  dataTrustStatus: TrustState;
  confidenceInterval: string;
  supportingEvidence: string;
  status: RecommendationStatus;
  decidedBy?: string;
  decidedAt?: string;
  rejectionReason?: string;
}

export type SecuritySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface SecurityEvent {
  id: string;
  timestamp: string;
  scenarioType: SecurityScenarioType;
  title: string;
  severity: SecuritySeverity;
  affectedTarget: string;
  injectedAnomaly: string;
  detectionMechanism: string;
  detectionResult: string;
  mitigationAction: string;
  auditEvidence: string;
  isBlocked: boolean;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: 'Operator' | 'AI Agent (MCP)' | 'Independent Validator' | 'Security Monitor' | 'Experiment Runner';
  action: string;
  associatedExperimentId: string;
  result: 'SUCCESS' | 'WARNING' | 'BLOCKED' | 'APPROVED' | 'REJECTED';
  severity: 'INFO' | 'NOTICE' | 'WARNING' | 'ALERT';
  evidenceReference: string;
  details: string;
}

export interface SystemService {
  id: string;
  name: string;
  role: string;
  status: ServiceStatus;
  latencyMs: number;
  endpoint: string;
  details: string;
}
