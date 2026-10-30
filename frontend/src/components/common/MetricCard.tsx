import React, { ReactNode } from 'react';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  baselineValue?: string | number;
  improvementPct?: number; // positive means savings or good
  invertTrendColor?: boolean; // if true, higher is worse (like energy)
  status?: 'nominal' | 'warning' | 'alert' | 'neutral';
  statusText?: string;
  icon?: ReactNode;
  sparklineData?: number[];
  annotation?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  baselineValue,
  improvementPct,
  invertTrendColor = false,
  status = 'nominal',
  statusText,
  icon,
  annotation,
}) => {
  const getStatusBorder = () => {
    switch (status) {
      case 'alert':
        return 'border-rose-500/40 bg-rose-950/10';
      case 'warning':
        return 'border-amber-500/40 bg-amber-950/10';
      case 'nominal':
        return 'border-slate-800 bg-[#111726]/80';
      default:
        return 'border-slate-800 bg-[#111726]/80';
    }
  };

  const isGoodTrend = improvementPct !== undefined && (invertTrendColor ? improvementPct <= 0 : improvementPct >= 0);

  return (
    <div
      className={`relative p-4 rounded-xl border backdrop-blur-sm transition-all duration-200 hover:border-slate-700 ${getStatusBorder()}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-slate-400 tracking-wide">{label}</span>
        {icon && <div className="text-slate-500 shrink-0">{icon}</div>}
      </div>

      <div className="flex items-baseline gap-1.5 mb-2">
        <span className="text-2xl font-bold font-mono tracking-tight text-slate-100 tabular-nums">
          {value}
        </span>
        {unit && <span className="text-xs font-mono text-slate-400">{unit}</span>}
      </div>

      {/* Comparison with reference baseline & status note */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
        {baselineValue !== undefined ? (
          <div className="text-slate-400 flex items-center gap-1.5 font-mono">
            <span>Ref: {baselineValue}</span>
            {improvementPct !== undefined && improvementPct !== 0 && (
              <span
                className={`flex items-center gap-0.5 font-semibold ${
                  isGoodTrend ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {improvementPct > 0 ? (
                  <TrendingDown className="w-3 h-3" />
                ) : (
                  <TrendingUp className="w-3 h-3" />
                )}
                {improvementPct > 0 ? `-${Math.abs(improvementPct)}%` : `+${Math.abs(improvementPct)}%`}
              </span>
            )}
          </div>
        ) : (
          <span className="text-slate-500 text-[11px]">{annotation || 'Standard benchmark'}</span>
        )}

        {statusText && (
          <span
            className={`font-mono text-[11px] ${
              status === 'alert'
                ? 'text-rose-400 font-semibold'
                : status === 'warning'
                ? 'text-amber-400 font-semibold'
                : status === 'nominal'
                ? 'text-emerald-400'
                : 'text-slate-400'
            }`}
          >
            {statusText}
          </span>
        )}
      </div>
    </div>
  );
};
