import { SecurityEvent, SecurityScenarioType, TrustState, Sensor } from '../types/industrial';
import { INITIAL_SECURITY_EVENTS } from './mock/mockData';
import { telemetryService } from './telemetryService';
import { digitalTwinService } from './digitalTwinService';
import { auditService } from './auditService';

export interface TrustAssessmentSummary {
  overallState: TrustState;
  confidenceScore: number; // 0 - 100%
  trustedSensorsCount: number;
  suspectSensorsCount: number;
  untrustedSensorsCount: number;
  residualAnomalyCount: number;
  outOfRangeCount: number;
  rateOfChangeAnomalies: number;
  isOptimizationAllowed: boolean;
  reasons: string[];
}

class SecurityService {
  private events: SecurityEvent[] = [...INITIAL_SECURITY_EVENTS];
  private activeAttack: SecurityScenarioType = 'normal';

  public async getSecurityEvents(): Promise<SecurityEvent[]> {
    return [...this.events];
  }

  public getActiveAttack(): SecurityScenarioType {
    return this.activeAttack;
  }

  public async evaluateTrust(sensors?: Sensor[]): Promise<TrustAssessmentSummary> {
    const list = sensors || (await telemetryService.getSensors());
    let untrusted = 0;
    let suspect = 0;
    let trusted = 0;
    let outOfRange = 0;
    let residualAnomalies = 0;
    const reasons: string[] = [];

    for (const s of list) {
      if (s.currentValue < s.minRange || s.currentValue > s.maxRange) {
        outOfRange++;
        reasons.push(`Sensor ${s.id} out of physical range [${s.minRange}, ${s.maxRange}]`);
      }
      if (s.residual > 1.2) {
        residualAnomalies++;
        reasons.push(`High residual on ${s.id}: ${s.residual} ${s.unit} (exceeds model bound)`);
      }

      if (s.trustState === 'UNTRUSTED') untrusted++;
      else if (s.trustState === 'SUSPECT') suspect++;
      else trusted++;
    }

    let overallState: TrustState = 'TRUSTED';
    let isOptimizationAllowed = true;

    if (untrusted > 0 || outOfRange > 0) {
      overallState = 'UNTRUSTED';
      isOptimizationAllowed = false;
    } else if (suspect > 0 || residualAnomalies > 0) {
      overallState = 'SUSPECT';
      isOptimizationAllowed = false; // Under rule F-10, SUSPECT suspends or limits optimization
    }

    const confidenceScore = Math.max(
      15,
      Math.min(99, Math.round((trusted / (list.length || 1)) * 100 - untrusted * 30 - suspect * 15))
    );

    return {
      overallState,
      confidenceScore,
      trustedSensorsCount: trusted,
      suspectSensorsCount: suspect,
      untrustedSensorsCount: untrusted,
      residualAnomalyCount: residualAnomalies,
      outOfRangeCount: outOfRange,
      rateOfChangeAnomalies: this.activeAttack === 'sensor_spoofing' ? 1 : 0,
      isOptimizationAllowed,
      reasons,
    };
  }

  public async executeAttackScenario(scenario: SecurityScenarioType): Promise<{ success: boolean; event: SecurityEvent }> {
    this.activeAttack = scenario;

    if (scenario === 'sensor_spoofing') {
      // Injects +5.5 kW artificial power spike into M-102
      telemetryService.updateSensorValue('SEN-PWR-102', 18.9, 13.4);
      const event: SecurityEvent = {
        id: `SEC-EVT-${Math.floor(100 + Math.random() * 900)}`,
        timestamp: new Date().toISOString(),
        scenarioType: 'sensor_spoofing',
        title: 'Sensor Spoofing: Artificial Power Offset on M-102',
        severity: 'CRITICAL',
        affectedTarget: 'SEN-PWR-102 (Modbus %MW102)',
        injectedAnomaly: 'Artificially forced power reading to 18.9 kW (Physical model expects 13.4 kW)',
        detectionMechanism: 'Model-based residual inspection (|y_meas - y_twin| = 5.5 kW > 1.2 kW threshold)',
        detectionResult: 'IMMEDIATE UNTRUSTED CLASSIFICATION. Z-score 4.8.',
        mitigationAction: 'Optimizer Interlock Engaged. Strategy generation locked out (Rule F-10).',
        auditEvidence: 'Raw Modbus capture stored; hash logged to immutable audit ledger.',
        isBlocked: true,
      };
      this.events.unshift(event);
      auditService.logEvent({
        actor: 'Security Monitor',
        action: 'Adversarial Telemetry Injected (Simulation Scenario A1)',
        associatedExperimentId: 'EXP-2026-SEC-ATTACK',
        result: 'BLOCKED',
        severity: 'ALERT',
        evidenceReference: event.id,
        details: event.detectionResult,
      });
      return { success: true, event };
    }

    if (scenario === 'twin_poisoning') {
      // Poisons digital twin parameter
      digitalTwinService.injectModelPoisoning(1.85);
      const event: SecurityEvent = {
        id: `SEC-EVT-${Math.floor(100 + Math.random() * 900)}`,
        timestamp: new Date().toISOString(),
        scenarioType: 'twin_poisoning',
        title: 'Model Poisoning: Thermal & Power Matrix Tampering',
        severity: 'HIGH',
        affectedTarget: 'Digital Twin Model Parameters (Physics Matrix)',
        injectedAnomaly: 'Model parameter drift factor forced to 1.85x, exaggerating predicted power draw.',
        detectionMechanism: 'Cryptographic Configuration Hash & Baseline Calibration Divergence.',
        detectionResult: 'CONFIG HASH MISMATCH. Model predictions deviate > 80% from known golden baseline.',
        mitigationAction: 'Isolated modified model; automated rollback to signed version v1.2.4 available.',
        auditEvidence: 'SHA-256 [0xf884a2...] failed against manifest database.',
        isBlocked: true,
      };
      this.events.unshift(event);
      auditService.logEvent({
        actor: 'Security Monitor',
        action: 'Digital Twin Poisoning Detected (Simulation Scenario A2)',
        associatedExperimentId: 'EXP-2026-SEC-ATTACK',
        result: 'BLOCKED',
        severity: 'ALERT',
        evidenceReference: event.id,
        details: event.detectionResult,
      });
      return { success: true, event };
    }

    if (scenario === 'agent_manipulation') {
      const event: SecurityEvent = {
        id: `SEC-EVT-${Math.floor(100 + Math.random() * 900)}`,
        timestamp: new Date().toISOString(),
        scenarioType: 'agent_manipulation',
        title: 'Agent Manipulation: Unauthorized Direct Modbus Write Attempt',
        severity: 'HIGH',
        affectedTarget: 'AI Agent Gateway (MCP Tool Whitelist)',
        injectedAnomaly: 'Malicious operator prompt attempted to command "plc_write_holding_register(0x200, 0x00)".',
        detectionMechanism: 'MCP Tool Whitelist & Structural Schema Guard (Read-only guarantee).',
        detectionResult: 'FORBIDDEN TOOL INVOCATION REJECTED. Method not in whitelist.',
        mitigationAction: 'Agent returned structured rejection; privilege escalation thwarted.',
        auditEvidence: 'Trace archived in agent execution journal and audit ledger.',
        isBlocked: true,
      };
      this.events.unshift(event);
      auditService.logEvent({
        actor: 'AI Agent (MCP)',
        action: 'Rejected Unauthorized Tool Call (Simulation Scenario A3)',
        associatedExperimentId: 'EXP-2026-SEC-ATTACK',
        result: 'BLOCKED',
        severity: 'ALERT',
        evidenceReference: event.id,
        details: 'Attempted to bypass safety boundary. Prohibited by Rule 2.3.',
      });
      return { success: true, event };
    }

    return this.restoreNominalOperation();
  }

  public async restoreNominalOperation(): Promise<{ success: boolean; event: SecurityEvent }> {
    this.activeAttack = 'normal';
    telemetryService.resetToNominal();
    digitalTwinService.recalibrateModel();

    const event: SecurityEvent = {
      id: `SEC-EVT-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toISOString(),
      scenarioType: 'normal',
      title: 'Security State Normalized: Defenses Cleared & System Nominal',
      severity: 'LOW',
      affectedTarget: 'Entire Industrial Production Cell',
      injectedAnomaly: 'None. Injected perturbations cleared, synthetic noise returned to nominal Gaussian variance.',
      detectionMechanism: 'Continuous Health Probing & Trust Recalibration.',
      detectionResult: 'ALL CHECKS PASSED. Data confidence 98%, model residuals within +/- 0.2 kW.',
      mitigationAction: 'Optimization interlock released. Normal experimentation restored.',
      auditEvidence: 'Restoration signature logged to audit trail.',
      isBlocked: false,
    };
    this.events.unshift(event);
    auditService.logEvent({
      actor: 'Security Monitor',
      action: 'Security Mitigation Applied & Nominal State Restored',
      associatedExperimentId: 'EXP-2026-BASE-01',
      result: 'SUCCESS',
      severity: 'INFO',
      evidenceReference: event.id,
      details: 'All sensors and digital twin parameters recalibrated.',
    });

    return { success: true, event };
  }
}

export const securityService = new SecurityService();
