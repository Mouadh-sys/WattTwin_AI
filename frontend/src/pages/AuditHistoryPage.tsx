import React, { useState, useEffect } from 'react';
import { auditService } from '../services/auditService';
import { AuditEvent } from '../types/industrial';
import {
  ScrollText,
  Search,
  Filter,
  Download,
  Shield,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
} from 'lucide-react';

export const AuditHistoryPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditEvent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActor, setSelectedActor] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');

  useEffect(() => {
    auditService.getAuditLogs().then(setLogs);
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      searchTerm === '' ||
      log.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.associatedExperimentId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesActor = selectedActor === 'all' || log.actor === selectedActor;
    const matchesSeverity = selectedSeverity === 'all' || log.severity === selectedSeverity;

    return matchesSearch && matchesActor && matchesSeverity;
  });

  const handleExport = (format: 'json' | 'csv') => {
    const data = auditService.exportReport(format);
    const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `watttwin_audit_report_${Date.now()}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSeverityBadge = (sev: AuditEvent['severity']) => {
    switch (sev) {
      case 'ALERT':
        return 'bg-rose-950 text-rose-400 border border-rose-800';
      case 'WARNING':
        return 'bg-amber-950 text-amber-400 border border-amber-800';
      case 'NOTICE':
        return 'bg-cyan-950 text-cyan-400 border border-cyan-800';
      default:
        return 'bg-slate-800 text-slate-400 border border-slate-700';
    }
  };

  const getResultBadge = (res: AuditEvent['result']) => {
    switch (res) {
      case 'APPROVED':
      case 'SUCCESS':
        return 'text-emerald-400';
      case 'BLOCKED':
      case 'REJECTED':
        return 'text-rose-400';
      default:
        return 'text-amber-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-xl border border-slate-800 bg-[#0d131f] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-cyan-400">TRACEABILITY & REGULATORY AUDIT</span>
            <span className="text-xs font-mono text-slate-400">· Immutable Event Record</span>
          </div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-cyan-400" />
            Industrial Process & Optimization Audit Log
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans">
            Complete, tamper-evident ledger tracking simulation runs, tool invocations, independent constraint verifications, security interlock engagements, and human decisions.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('json')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> JSON Export
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> CSV Export
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl border border-slate-800 bg-[#0d131f] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Event ID, Action, Experiment, or Keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#131b2e] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-hidden focus:border-cyan-500 font-sans"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">Actor:</span>
            <select
              value={selectedActor}
              onChange={(e) => setSelectedActor(e.target.value)}
              className="bg-[#131b2e] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-200"
            >
              <option value="all">All Actors</option>
              <option value="Operator">Operator (Human)</option>
              <option value="AI Agent (MCP)">AI Agent (MCP)</option>
              <option value="Independent Validator">Independent Validator</option>
              <option value="Security Monitor">Security Monitor</option>
              <option value="Experiment Runner">Experiment Runner</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">Severity:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-[#131b2e] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-200"
            >
              <option value="all">All Severities</option>
              <option value="INFO">INFO</option>
              <option value="NOTICE">NOTICE</option>
              <option value="WARNING">WARNING</option>
              <option value="ALERT">ALERT</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0d131f] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#111726] text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Event ID</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action & Details</th>
                <th className="py-3 px-4">Experiment Ref</th>
                <th className="py-3 px-4 text-center">Severity</th>
                <th className="py-3 px-4 text-center">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#131b2e]/60 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-cyan-400 whitespace-nowrap">
                    {log.id}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-200 whitespace-nowrap">
                    {log.actor}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-100">{log.action}</div>
                    <div className="text-[11px] text-slate-400 font-sans mt-0.5 max-w-xl">
                      {log.details}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-cyan-300 whitespace-nowrap">
                    {log.associatedExperimentId}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${getSeverityBadge(log.severity)}`}>
                      {log.severity}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold">
                    <span className={getResultBadge(log.result)}>{log.result}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
