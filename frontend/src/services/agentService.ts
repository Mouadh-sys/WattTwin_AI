import { AgentExecution, ToolInvocation, AgentStatus } from '../types/industrial';
import { INITIAL_AGENT_EXECUTION } from './mock/mockData';
import { securityService } from './securityService';
import { auditService } from './auditService';

export interface AgentQueryResult {
  answer: string;
  toolInvocations: ToolInvocation[];
  reasoning: string;
  proposedAction?: string;
  isActionAuthorized: boolean;
}

class AgentService {
  private currentExecution: AgentExecution = JSON.parse(JSON.stringify(INITIAL_AGENT_EXECUTION));

  public async getExecution(): Promise<AgentExecution> {
    return this.currentExecution;
  }

  public async runAutonomousInvestigation(
    experimentId: string,
    onProgress?: (status: AgentStatus, message: string) => void
  ): Promise<AgentExecution> {
    // Check if security trust allows optimization
    const trust = await securityService.evaluateTrust();
    if (!trust.isOptimizationAllowed) {
      this.currentExecution = {
        id: `AG-EXEC-${Date.now().toString().slice(-4)}`,
        status: 'FAILED',
        currentTask: `Investigation of ${experimentId}`,
        investigationPlan: [
          '1. Evaluate sensor trust layer before tool invocation',
          '2. ABORT: Compromised telemetry detected',
        ],
        reasoningSummary: `Investigation halted by rule F-10: Telemetry state is ${trust.overallState}. Optimization and diagnostic tools are locked until sensor integrity is restored.`,
        toolInvocations: [
          {
            id: `TOOL-BLOCKED-${Date.now()}`,
            timestamp: new Date().toISOString(),
            toolName: 'evaluate_data_trust',
            inputs: { experimentId },
            outputs: { overallTrust: trust.overallState, reasons: trust.reasons },
            status: 'BLOCKED_BY_POLICY',
            durationMs: 15,
            explanation: 'Trust check failed. Execution halted to protect physical system safety invariants.',
          },
        ],
        validationResults: {
          checkedAt: new Date().toISOString(),
          passed: false,
          safetyInvariantsVerified: false,
          dataIntegrityVerified: false,
          details: 'BLOCKED: Data trust below threshold. Independent Validator prohibits candidate synthesis.',
        },
      };

      auditService.logEvent({
        actor: 'Independent Validator',
        action: 'Blocked AI Agent Tool Invocation Due to Untrusted Telemetry',
        associatedExperimentId: experimentId,
        result: 'BLOCKED',
        severity: 'ALERT',
        evidenceReference: this.currentExecution.id,
        details: 'Rule F-10 enforced: Untrusted sensor data prohibits optimization runs.',
      });

      if (onProgress) onProgress('FAILED', 'Investigation aborted: Sensor data untrusted.');
      return this.currentExecution;
    }

    // Normal safe execution steps
    this.currentExecution.status = 'PLANNING';
    if (onProgress) onProgress('PLANNING', 'Synthesizing investigation plan and checking tool privileges...');

    await new Promise((r) => setTimeout(r, 600));

    this.currentExecution.status = 'EXECUTING';
    if (onProgress) onProgress('EXECUTING', 'Invoking get_telemetry_summary & inspect_residuals...');

    const invocations: ToolInvocation[] = [
      {
        id: `TOOL-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString(),
        toolName: 'get_telemetry_summary',
        inputs: { experimentId, metricWindowSec: 3600 },
        outputs: { totalEnergyKwh: 119.5, baselineEnergyKwh: 119.5, idleEnergyPct: 37.8 },
        status: 'SUCCESS',
        durationMs: 38,
        explanation: 'Queried holding registers and time-series aggregates for Line 1.',
      },
      {
        id: `TOOL-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString(),
        toolName: 'evaluate_data_trust',
        inputs: { sensors: ['SEN-PWR-101', 'SEN-PWR-102', 'SEN-PWR-103', 'SEN-PWR-104'] },
        outputs: { status: 'TRUSTED', maxResidualKw: 0.12, confidenceScore: 98 },
        status: 'SUCCESS',
        durationMs: 29,
        explanation: 'Verified sensor freshness and physical bounds.',
      },
      {
        id: `TOOL-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString(),
        toolName: 'inspect_residuals',
        inputs: { modelVersion: 'v1.2.4', tolerance: 0.8 },
        outputs: { maxResidualKw: 0.18, meanResidualKw: 0.06, driftDetected: false },
        status: 'SUCCESS',
        durationMs: 44,
        explanation: 'Evaluated observed telemetry vs Digital Twin physics estimation.',
      },
      {
        id: `TOOL-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString(),
        toolName: 'propose_strategy',
        inputs: { objective: 'min_energy_per_unit', minThroughputUph: 55, maxDefectsPct: 4 },
        outputs: {
          candidateId: 'CAND-02',
          savingsPct: 18.99,
          conveyorSpeedFactor: 0.88,
          pneumaticPressureBar: 5.2,
          packagingStandbySave: true,
        },
        status: 'SUCCESS',
        durationMs: 112,
        explanation: 'OR-Tools deterministic solver computed Pareto-optimal machine schedule.',
      },
      {
        id: `TOOL-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString(),
        toolName: 'run_candidate_simulation',
        inputs: { candidateId: 'CAND-02', durationSec: 3600, randomSeed: 42 },
        outputs: { simulatedEnergyKwh: 96.8, throughputUph: 61.2, qualityRatePct: 98.0, violationsCount: 0 },
        status: 'SUCCESS',
        durationMs: 250,
        explanation: 'Simulated candidate in isolated virtual environment. Invariants satisfied.',
      },
      {
        id: `TOOL-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString(),
        toolName: 'generate_recommendation',
        inputs: { candidateId: 'CAND-02', justificationRequired: true },
        outputs: { recommendationId: 'REC-2026-001', requiresHumanSignoff: true },
        status: 'SUCCESS',
        durationMs: 50,
        explanation: 'Drafted traceable recommendation with 95% CI evidence for operator signoff.',
      },
    ];

    this.currentExecution = {
      id: `AG-EXEC-${Date.now().toString().slice(-4)}`,
      status: 'WAITING FOR VALIDATION',
      currentTask: `Optimization Analysis for Experiment ${experimentId}`,
      investigationPlan: [
        '1. Inspect baseline consumption breakdown and idle energy sinks',
        '2. Verify telemetry trust and ensure zero residual anomaly flags',
        '3. Query deterministic optimizer for bounded operating setpoints',
        '4. Evaluate simulated candidate across full 3600s cycle in sandbox',
        '5. Pass candidate through Independent Validator for safety constraint audit',
        '6. Generate audit-ready engineering recommendation for human signoff',
      ],
      reasoningSummary: 'Identified that Packaging station M-104 maintains heating coils at full power (1.75 kW) during buffer replenishment starvation periods. Lowering pneumatic delivery from 6.5 bar to 5.2 bar and matching conveyor speed to CNC milling takt time yields an estimated 22.7 kWh (18.99%) energy reduction with zero throughput penalty.',
      toolInvocations: invocations,
      validationResults: {
        checkedAt: new Date().toISOString(),
        passed: true,
        safetyInvariantsVerified: true,
        dataIntegrityVerified: true,
        details: 'Independent Validator verified: Throughput 61.2 >= 55 uph, Quality 98.0% >= 96%, Max Temp 68.7°C <= 80°C. Safety invariants PASS.',
      },
    };

    this.currentExecution.status = 'COMPLETED';
    if (onProgress) onProgress('COMPLETED', 'Investigation complete. Recommendation ready for review.');

    auditService.logEvent({
      actor: 'AI Agent (MCP)',
      action: 'Completed Automated Line Energy Investigation',
      associatedExperimentId: experimentId,
      result: 'SUCCESS',
      severity: 'INFO',
      evidenceReference: this.currentExecution.id,
      details: 'Evaluated 6 approved tools. Synthesized recommendation REC-2026-001.',
    });

    return this.currentExecution;
  }

  public async queryAgent(prompt: string, experimentId = 'EXP-2026-BASE-01'): Promise<AgentQueryResult> {
    const lower = prompt.toLowerCase();

    // Query 1: Why is energy consumption higher than baseline?
    if (lower.includes('higher') || lower.includes('baseline') || lower.includes('why')) {
      return {
        answer: 'Based on telemetry analysis of Line 1, higher energy consumption in the baseline (119.5 kWh total, 0.498 kWh/unit) stems from two root causes: (1) Machine M-104 (Packaging) maintains continuous 1.75 kW idle heating during buffer starvation, consuming 37.8% of all idle power; and (2) M-101 conveyor operates at 100% rated frequency even when upstream queue buffers are full.',
        reasoning: 'Analyzed breakdown by machine: M-102 milling is the largest active consumer (64.2 kWh), but M-104 and M-101 exhibit the highest unmanaged idle fractions.',
        toolInvocations: [
          {
            id: `TOOL-${Math.floor(1000 + Math.random() * 9000)}`,
            timestamp: new Date().toISOString(),
            toolName: 'get_telemetry_summary',
            inputs: { experimentId, metric: 'idle_vs_active_ratio' },
            outputs: { m101_idle: 0.95, m102_idle: 4.8, m103_idle: 1.3, m104_idle: 1.75 },
            status: 'SUCCESS',
            durationMs: 32,
            explanation: 'Retrieved machine idle power ratings and active duty percentages.',
          },
        ],
        proposedAction: 'Run candidate optimization with Packaging Eco-Idle and VFD deceleration factor 0.88.',
        isActionAuthorized: true,
      };
    }

    // Query 2: Which machine contributes most to idle energy?
    if (lower.includes('contributes') || lower.includes('idle') || lower.includes('most')) {
      return {
        answer: 'Machine M-102 (Precision Milling) has the highest raw idle power at 4.8 kW, but operates at a high 62.1% duty cycle. In terms of avoidable non-productive energy loss, Machine M-104 (Packaging Cell) is the most inefficient: its duty cycle is only 41.5%, yet its standby heaters draw 1.75 kW continuously, wasting approximately 12.3 kWh per shift.',
        reasoning: 'Integrated idle power over idle duration: M-104 total idle energy = 1.75 kW * 2106 seconds = 1.02 kWh/hour of pure loss.',
        toolInvocations: [
          {
            id: `TOOL-${Math.floor(1000 + Math.random() * 9000)}`,
            timestamp: new Date().toISOString(),
            toolName: 'get_telemetry_summary',
            inputs: { breakdown: 'duty_cycle_integrated' },
            outputs: { m104_idle_hours: 0.585, m104_avoidable_kwh: 12.3 },
            status: 'SUCCESS',
            durationMs: 28,
            explanation: 'Computed idle integral per machine state.',
          },
        ],
        proposedAction: 'Propose automated 20-second eco-sleep policy for M-104.',
        isActionAuthorized: true,
      };
    }

    // Query 3: Find a strategy that reduces energy without reducing throughput
    if (lower.includes('strategy') || lower.includes('reduces energy') || lower.includes('throughput')) {
      return {
        answer: 'Deterministic candidate CAND-02 achieves an 18.99% energy reduction (saving 22.7 kWh) while actually increasing throughput slightly from 60.0 to 61.2 uph. It achieves this by synchronizing conveyor speed to CNC milling takt time (eliminating part queue bunching) and dropping pneumatic line pressure from 6.5 to 5.2 bar.',
        reasoning: 'Solver bounded search: Constraints enforced: minThroughput >= 55 uph, maxDefects <= 4.0%. Candidate CAND-02 satisfies all safety invariants.',
        toolInvocations: [
          {
            id: `TOOL-${Math.floor(1000 + Math.random() * 9000)}`,
            timestamp: new Date().toISOString(),
            toolName: 'propose_strategy',
            inputs: { minThroughputUph: 55, targetSavingsPct: 15 },
            outputs: { candidateId: 'CAND-02', simulatedEnergyKwh: 96.8, predictedThroughput: 61.2 },
            status: 'SUCCESS',
            durationMs: 88,
            explanation: 'OR-Tools formulation found Pareto-optimal operating frontier.',
          },
        ],
        proposedAction: 'Generate Recommendation REC-2026-001 for human operator approval.',
        isActionAuthorized: true,
      };
    }

    // Query 4: Explain why last candidate was rejected
    if (lower.includes('rejected') || lower.includes('candidate') || lower.includes('why')) {
      return {
        answer: 'Candidate CAND-03-INVALID was rejected by the Independent Validator because it violated throughput safety constraints. The strategy reduced conveyor speed by 40% and pneumatic pressure to 3.8 bar, resulting in a simulated throughput of only 47.8 uph (minimum required threshold is 55.0 uph) and an unacceptably high defect rate of 8.8%.',
        reasoning: 'Independent Validator rule check failed. Agent cannot override validator decisions or safety invariants.',
        toolInvocations: [
          {
            id: `TOOL-${Math.floor(1000 + Math.random() * 9000)}`,
            timestamp: new Date().toISOString(),
            toolName: 'inspect_residuals',
            inputs: { candidateId: 'CAND-03-INVALID' },
            outputs: { validatorResult: 'FAILED', reason: 'Throughput below contract minimum (47.8 < 55 uph)' },
            status: 'SUCCESS',
            durationMs: 35,
            explanation: 'Queried independent validator log record.',
          },
        ],
        proposedAction: 'Retain CAND-02 as the active recommended candidate.',
        isActionAuthorized: true,
      };
    }

    // Default intelligent engineering response
    return {
      answer: `Analyzing Line 1 telemetry against digital twin model for query: "${prompt}". Operating parameters are currently stable. Conveyor power is 2.85 kW, CNC milling is 13.4 kW, sorting is 4.1 kW, and packaging is 1.75 kW. All 9 sensors report TRUSTED status. Would you like me to initiate a new diagnostic optimization sweep?`,
      reasoning: 'Evaluated current machine states against digital twin power models. No immediate anomaly detected.',
      toolInvocations: [
        {
          id: `TOOL-${Math.floor(1000 + Math.random() * 9000)}`,
          timestamp: new Date().toISOString(),
          toolName: 'get_telemetry_summary',
          inputs: { experimentId },
          outputs: { currentStatus: 'NOMINAL', activeMachines: 4 },
          status: 'SUCCESS',
          durationMs: 25,
          explanation: 'General telemetry query to support user inquiry.',
        },
      ],
      proposedAction: 'Propose automated optimization sweep.',
      isActionAuthorized: true,
    };
  }
}

export const agentService = new AgentService();
