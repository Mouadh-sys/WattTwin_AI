import { Machine, Sensor, MachineId } from '../types/industrial';

export interface TwinEstimation {
  machineId: MachineId;
  estimatedPowerKw: number;
  expectedTemperatureC: number;
  expectedThroughputUph: number;
  confidenceScore: number;
  isCalibrated: boolean;
}

class DigitalTwinService {
  private isModelCalibrated = true;
  private modelDriftFactor = 1.0;

  public estimateMachinePower(machine: Machine, speedFactor = 1.0): number {
    if (machine.state === 'STOPPED') return 0.05; // Phantom quiescent load
    if (machine.state === 'IDLE') return machine.idlePowerKw;

    // Kinematic / electrical power physics approximation
    switch (machine.type) {
      case 'conveyor':
        // P ~ P_idle + k * speed^1.8 (cube law approximation for fluid/belt friction)
        return Number((machine.idlePowerKw + (machine.peakPowerKw - machine.idlePowerKw) * Math.pow(speedFactor, 1.8) * this.modelDriftFactor).toFixed(2));
      case 'processing':
        return Number((machine.idlePowerKw + 8.6 * this.modelDriftFactor).toFixed(2));
      case 'sorting':
        return Number((machine.idlePowerKw + 2.8 * this.modelDriftFactor).toFixed(2));
      case 'packaging':
        return Number((machine.idlePowerKw + 4.4 * this.modelDriftFactor).toFixed(2));
      default:
        return machine.activePowerKw;
    }
  }

  public calculateResiduals(sensors: Sensor[]): { maxResidual: number; meanResidual: number; discrepancies: { sensorId: string; delta: number }[] } {
    const discrepancies: { sensorId: string; delta: number }[] = [];
    let sum = 0;
    let max = 0;

    for (const sensor of sensors) {
      const delta = Math.abs(sensor.currentValue - sensor.expectedValue);
      sum += delta;
      if (delta > max) max = delta;
      if (delta > 1.0) {
        discrepancies.push({ sensorId: sensor.id, delta: Number(delta.toFixed(2)) });
      }
    }

    return {
      maxResidual: Number(max.toFixed(2)),
      meanResidual: sensors.length > 0 ? Number((sum / sensors.length).toFixed(2)) : 0,
      discrepancies,
    };
  }

  public injectModelPoisoning(drift = 1.85): void {
    this.modelDriftFactor = drift;
    this.isModelCalibrated = false;
  }

  public recalibrateModel(): void {
    this.modelDriftFactor = 1.0;
    this.isModelCalibrated = true;
  }

  public getCalibrationStatus(): { isCalibrated: boolean; driftFactor: number } {
    return {
      isCalibrated: this.isModelCalibrated,
      driftFactor: this.modelDriftFactor,
    };
  }
}

export const digitalTwinService = new DigitalTwinService();
