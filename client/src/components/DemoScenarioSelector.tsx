import React from 'react';
import { DemoScenario } from '../types';
import { CheckCircle2, AlertTriangle, Camera, XCircle, Sparkles } from 'lucide-react';

interface Props {
  scenarios: DemoScenario[];
  activeScenarioId: string | null;
  onSelect: (scenario: DemoScenario) => void;
  loading: boolean;
}

const SIMPLE_STATUS: Record<string, { label: string; hint: string; severity: 'ok' | 'bad' | 'warn' | 'info'; icon: React.ReactNode }> = {
  good_package: {
    label: 'All good',
    hint: 'Everything on the label is correct',
    severity: 'ok',
    icon: <CheckCircle2 className="w-4 h-4 text-lmed-pass" />,
  },
  missing_declaration: {
    label: 'Missing info',
    hint: 'Important details like MRP are missing',
    severity: 'bad',
    icon: <XCircle className="w-4 h-4 text-lmed-breach" />,
  },
  low_confidence: {
    label: 'Hard to read',
    hint: 'Photo quality is poor — needs manual check',
    severity: 'warn',
    icon: <AlertTriangle className="w-4 h-4 text-lmed-review" />,
  },
  insufficient_coverage: {
    label: 'More photos needed',
    hint: 'Take photos of other sides of the package',
    severity: 'info',
    icon: <Camera className="w-4 h-4 text-slate-400" />,
  },
};

const badgeClass = {
  ok: 'status-compliant',
  bad: 'status-breach',
  warn: 'status-review',
  info: 'statutory-badge text-slate-400',
};

export const DemoScenarioSelector: React.FC<Props> = ({
  scenarios,
  activeScenarioId,
  onSelect,
  loading,
}) => {
  return (
    <div className="statutory-panel p-3">
      <div className="mb-2">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-lmed-saffron" />
          <h3 className="text-sm font-display font-semibold text-slate-100">
            Step 1 — Try a sample
          </h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          New here? Tap any example below to see how the tool works. No real upload needed.
        </p>
      </div>

      <div className="space-y-2">
        {scenarios.map((s) => {
          const isActive = activeScenarioId === s.id;
          const status = SIMPLE_STATUS[s.id] || {
            label: 'Example',
            hint: s.description,
            severity: 'info' as const,
            icon: <Sparkles className="w-4 h-4 text-slate-400" />,
          };

          return (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              disabled={loading}
              className={`w-full text-left p-3 rounded-sm border transition-all ${
                isActive
                  ? 'border-lmed-blue bg-lmed-blue/10 ring-1 ring-lmed-blue/30'
                  : 'border-lmed-border bg-canvas-alt hover:border-slate-500 hover:bg-lmed-elevated/40'
              } ${loading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">{status.icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-slate-100">{s.name}</p>
                    <span className={`statutory-badge shrink-0 text-[10px] ${badgeClass[status.severity]}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-snug">
                    {s.description || status.hint}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {loading && (
        <p className="text-xs text-lmed-saffron mt-2 text-center animate-pulse">
          Loading sample… please wait
        </p>
      )}
    </div>
  );
};
