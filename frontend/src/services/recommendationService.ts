import { Recommendation } from '../types/industrial';
import { INITIAL_RECOMMENDATIONS } from './mock/mockData';
import { auditService } from './auditService';

class RecommendationService {
  private recommendations: Recommendation[] = [...INITIAL_RECOMMENDATIONS];

  public async getRecommendations(): Promise<Recommendation[]> {
    return [...this.recommendations];
  }

  public async approveRecommendation(recId: string, decidedBy = 'Operator (Human)'): Promise<Recommendation> {
    const idx = this.recommendations.findIndex((r) => r.id === recId);
    if (idx === -1) throw new Error(`Recommendation ${recId} not found`);

    const updated: Recommendation = {
      ...this.recommendations[idx],
      status: 'APPROVED',
      decidedBy,
      decidedAt: new Date().toISOString(),
    };
    this.recommendations[idx] = updated;

    auditService.logEvent({
      actor: 'Operator',
      action: `Approved Recommendation ${recId}`,
      associatedExperimentId: updated.experimentId,
      result: 'APPROVED',
      severity: 'NOTICE',
      evidenceReference: updated.id,
      details: `Operator confirmed deployment of strategy: "${updated.proposedStrategy}" in virtual environment.`,
    });

    return updated;
  }

  public async rejectRecommendation(recId: string, decidedBy: string, reason: string): Promise<Recommendation> {
    const idx = this.recommendations.findIndex((r) => r.id === recId);
    if (idx === -1) throw new Error(`Recommendation ${recId} not found`);

    const updated: Recommendation = {
      ...this.recommendations[idx],
      status: 'REJECTED',
      decidedBy,
      decidedAt: new Date().toISOString(),
      rejectionReason: reason,
    };
    this.recommendations[idx] = updated;

    auditService.logEvent({
      actor: 'Operator',
      action: `Rejected Recommendation ${recId}`,
      associatedExperimentId: updated.experimentId,
      result: 'REJECTED',
      severity: 'WARNING',
      evidenceReference: updated.id,
      details: `Reason: ${reason}. Recommendation shelved.`,
    });

    return updated;
  }

  public async createRecommendation(rec: Omit<Recommendation, 'id' | 'status'>): Promise<Recommendation> {
    const id = `REC-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newRec: Recommendation = {
      ...rec,
      id,
      status: 'PENDING',
    };
    this.recommendations.unshift(newRec);

    auditService.logEvent({
      actor: 'AI Agent (MCP)',
      action: `Generated New Optimization Recommendation ${id}`,
      associatedExperimentId: rec.experimentId,
      result: 'SUCCESS',
      severity: 'INFO',
      evidenceReference: id,
      details: `Estimated savings: ${rec.expectedImprovementPct}%. Awaiting human signoff.`,
    });

    return newRec;
  }
}

export const recommendationService = new RecommendationService();
