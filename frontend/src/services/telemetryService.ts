import { Machine, Sensor, TelemetrySample, MachineId } from '../types/industrial';
import { INITIAL_MACHINES, INITIAL_SENSORS, generateSyntheticTimeline } from './mock/mockData';

class TelemetryService {
  private machines: Machine[] = JSON.parse(JSON.stringify(INITIAL_MACHINES));
  private sensors: Sensor[] = JSON.parse(JSON.stringify(INITIAL_SENSORS));
  private timeline: TelemetrySample[] = generateSyntheticTimeline(28);

  public async getMachines(): Promise<Machine[]> {
    return this.machines;
  }

  public async getSensors(): Promise<Sensor[]> {
    return this.sensors;
  }

  public async getTimeline(_experimentId?: string): Promise<TelemetrySample[]> {
    return this.timeline;
  }

  public updateMachineState(id: MachineId, updates: Partial<Machine>): Machine {
    const idx = this.machines.findIndex((m) => m.id === id);
    if (idx !== -1) {
      this.machines[idx] = { ...this.machines[idx], ...updates };
      return this.machines[idx];
    }
    throw new Error(`Machine ${id} not found`);
  }

  public updateSensorValue(sensorId: string, newValue: number, customExpected?: number): Sensor {
    const idx = this.sensors.findIndex((s) => s.id === sensorId);
    if (idx !== -1) {
      const sensor = this.sensors[idx];
      const expected = customExpected !== undefined ? customExpected : sensor.expectedValue;
      const residual = Math.abs(newValue - expected);
      const zScore = Number((residual / 0.5).toFixed(2));
      
      let trustState: Sensor['trustState'] = 'TRUSTED';
      if (zScore > 3.0 || newValue > sensor.maxRange || newValue < sensor.minRange) {
        trustState = 'UNTRUSTED';
      } else if (zScore > 1.8) {
        trustState = 'SUSPECT';
      }

      this.sensors[idx] = {
        ...sensor,
        currentValue: Number(newValue.toFixed(2)),
        expectedValue: Number(expected.toFixed(2)),
        residual: Number(residual.toFixed(2)),
        zScore,
        trustState,
        lastUpdate: new Date().toISOString(),
      };
      return this.sensors[idx];
    }
    throw new Error(`Sensor ${sensorId} not found`);
  }

  public resetToNominal(): void {
    this.machines = JSON.parse(JSON.stringify(INITIAL_MACHINES));
    this.sensors = JSON.parse(JSON.stringify(INITIAL_SENSORS));
  }
}

export const telemetryService = new TelemetryService();
