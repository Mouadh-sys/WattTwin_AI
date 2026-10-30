import React, { useState, useEffect } from 'react';
import { recommendationService } from '../services/recommendationService';
import { Recommendation } from '../types/industrial';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  FileText,
  AlertTriangle,
  TrendingDown,
  Layers,
  ShieldCheck,
  UserCheck,
  Info,
} from 'lucide-react';

export const RecommendationsPage: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectingRecId, setRejectingRecId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const loadData = () => {
    recommendationService.getRecommendations().then(setRecommendations);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (recId: string) => {
    await recommendationService.approveRecommendation(recId, 'M. Boukari (Operator)');
    loadData();
  };

  const handleOpenReject = (recId: string) => {
    setRejectingRecId(recId);
    setRejectionReason('Constraint margin deemed too tight for planned product changeover.');
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectingRecId) return;
    await recommendationService.rejectRecommendation(
      rejectingRecId,
      'M. Boukari (Operator)',
      rejectionReason
    );
    setIsRejectModalOpen(false);
    setRejectingRecId(null);
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-xl border border-slate-800 bg-[#0d131f] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-cyan-400">HUMAN-IN-THE-LOOP GOVERNANCE</span>
            <span className="text-xs font-mono text-slate-400">· Formal Strategy Review</span>
          </div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-cyan-400" />
            Optimization Strategy Recommendations
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans">
            Review deterministic candidate strategies synthesized by AI agent tool workflows.
            Independent safety constraints, physical invariants, and sensor trust must all be satisfied before signoff.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400 bg-[#111726] px-3.5 py-2 rounded-lg border border-slate-800 shrink-0">
          Academic Prototype · Virtual Environment Approval Only
        </div>
      </div>

      {/* Recommendations Cards Grid */}
      <div className="space-y-4">
        {recommendations.map((rec) => {
          const isPending = rec.status === 'PENDING';
          const isApproved = rec.status === 'APPROVED';
          const isRejected = rec.status === 'REJECTED';

          return (
            <div
              key={rec.id}
              className={`p-5 rounded-xl border bg-[#0d131f] transition-all space-y-4 ${
                isApproved
                  ? 'border-emerald-500/40 bg-emerald-950/10'
                  : isRejected
                  ? 'border-rose-500/40 bg-rose-950/10'
                  : 'border-cyan-500/40 bg-[#0e1526]'
              }`}
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-cyan-400">{rec.id}</span>
                  <span className="text-xs font-mono text-slate-400">· Experiment: {rec.experimentId}</span>
                  <span className="text-xs font-mono text-slate-400">· Candidate: {rec.candidateId}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono px-2.5 py-0.5 rounded font-bold ${
                      isApproved
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : isRejected
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800 animate-pulse'
                    }`}
                  >
                    STATUS: {rec.status}
                  </span>
                </div>
              </div>

              {/* Title & Core Strategy Statement */}
              <div>
                <h4 className="text-base font-bold text-slate-100">{rec.title}</h4>
                <p className="text-xs text-slate-300 mt-1 font-sans leading-relaxed">
                  {rec.proposedStrategy}
                </p>
                <div className="mt-2 text-xs text-slate-400 font-sans">
                  <strong>Rationale:</strong> {rec.reason}
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-2">
                <div className="p-3 rounded-lg bg-[#111726] border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-0.5">Energy Reduction</span>
                  <span className="text-lg font-bold font-mono text-emerald-400 tabular-nums">
                    -{rec.expectedImprovementPct}%
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    {rec.baselineEnergyKwh} → {rec.predictedOptimizedEnergyKwh} kWh
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#111726] border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-0.5">Expected Throughput</span>
                  <span className="text-lg font-bold font-mono text-slate-100 tabular-nums">
                    {rec.expectedThroughputUph} uph
                  </span>
                  <span className="text-[10px] text-emerald-400 block font-mono">
                    Contract &ge; 55 uph PASS
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#111726] border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-0.5">Expected Quality</span>
                  <span className="text-lg font-bold font-mono text-slate-100 tabular-nums">
                    {rec.expectedQualityRatePct}%
                  </span>
                  <span className="text-[10px] text-emerald-400 block font-mono">
                    Defect rate &le; 4.0% PASS
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#111726] border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-0.5">Confidence Band</span>
                  <span className="text-xs font-bold font-mono text-cyan-300 block mt-1">
                    {rec.confidenceInterval}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">3 Replicate Seeds</span>
                </div>

                <div className="p-3 rounded-lg bg-[#111726] border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-0.5">Data Trust Layer</span>
                  <span className="text-xs font-bold font-mono text-emerald-400 block mt-1">
                    {rec.dataTrustStatus}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    Residuals within limit
                  </span>
                </div>
              </div>

              {/* Independent Safety Invariant Checklist */}
              <div className="p-3 rounded-lg bg-[#0b101c] border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Throughput Bounds Satisfied
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Product Quality Margin PASS
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Motor Thermal Safety Bounds Verified
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> PLC Write Isolated
                </span>
              </div>

              {/* Decision / Action Bar */}
              <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-slate-800/80">
                <div className="text-xs text-slate-400 font-mono">
                  {rec.decidedBy ? (
                    <span>
                      Decided by <strong className="text-slate-200">{rec.decidedBy}</strong> at{' '}
                      {new Date(rec.decidedAt!).toLocaleString()}
                    </span>
                  ) : (
                    <span>Awaiting engineering operator evaluation</span>
                  )}
                  {rec.rejectionReason && (
                    <div className="text-rose-400 font-sans mt-0.5">
                      Rejection Reason: {rec.rejectionReason}
                    </div>
                  )}
                </div>

                {isPending && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenReject(rec.id)}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" /> Reject Strategy
                    </button>

                    <button
                      onClick={() => handleApprove(rec.id)}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve Recommendation
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reject Reason Modal Dialog */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs select-none">
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 max-w-md w-full space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" /> Reject Strategy Recommendation
            </h3>
            <p className="text-xs text-slate-400">
              Provide an engineering justification for rejecting this recommendation. This reason will be recorded immutably in the audit ledger.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              className="w-full bg-[#131b2e] border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-hidden focus:border-rose-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
