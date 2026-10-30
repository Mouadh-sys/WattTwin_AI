import { AuditEvent } from '../types/industrial';
import { INITIAL_AUDIT_EVENTS } from './mock/mockData';

class AuditService {
  private auditLogs: AuditEvent[] = [...INITIAL_AUDIT_EVENTS];

  public async getAuditLogs(): Promise<AuditEvent[]> {
    return [...this.auditLogs];
  }

  public logEvent(eventData: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent {
    const id = `AUD-${Math.floor(1000 + Math.random() * 9000)}`;
    const timestamp = new Date().toISOString();
    const newEvent: AuditEvent = {
      id,
      timestamp,
      ...eventData,
    };
    this.auditLogs.unshift(newEvent);
    return newEvent;
  }

  public exportReport(format: 'json' | 'csv'): string {
    if (format === 'json') {
      return JSON.stringify(this.auditLogs, null, 2);
    }
    const headers = ['ID', 'Timestamp', 'Actor', 'Action', 'AssociatedExperiment', 'Result', 'Severity', 'EvidenceRef', 'Details'];
    const rows = this.auditLogs.map((e) => [
      e.id,
      e.timestamp,
      `"${e.actor}"`,
      `"${e.action}"`,
      e.associatedExperimentId,
      e.result,
      e.severity,
      e.evidenceReference,
      `"${e.details.replace(/"/g, '""')}"`,
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}

export const auditService = new AuditService();
