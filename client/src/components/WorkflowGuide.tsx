import React from 'react';
import { Check } from 'lucide-react';

export type WorkflowStep = 1 | 2 | 3;

interface Props {
  currentStep: WorkflowStep;
  hasResults?: boolean;
}

const STEPS = [
  { step: 1 as const, title: 'Add a photo', hint: 'Pick a sample or upload from your device' },
  { step: 2 as const, title: 'Review the scan', hint: 'See what text was found on the package' },
  { step: 3 as const, title: 'Check compliance', hint: 'Read the results and download the report' },
];

export const WorkflowGuide: React.FC<Props> = ({ currentStep, hasResults }) => {
  return (
    <div className="statutory-panel p-3 shrink-0">
      <p className="text-sm font-display font-semibold text-slate-100 mb-0.5">
        How to use this tool
      </p>
      <p className="text-xs text-slate-400 mb-3">
        Inspect a product label in three simple steps — no training required.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {STEPS.map(({ step, title, hint }) => {
          const isDone = step < currentStep || (step === 3 && hasResults && currentStep >= 3);
          const isActive = step === currentStep;

          return (
            <div
              key={step}
              className={`flex gap-2.5 p-2.5 rounded-sm border transition-colors ${
                isActive
                  ? 'border-lmed-saffron bg-lmed-saffron/5'
                  : isDone
                  ? 'border-lmed-pass/40 bg-lmed-pass/5'
                  : 'border-lmed-border bg-canvas-alt/50'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-sm flex items-center justify-center shrink-0 text-sm font-bold ${
                  isDone
                    ? 'bg-lmed-pass/20 text-lmed-pass'
                    : isActive
                    ? 'bg-lmed-saffron/20 text-lmed-saffron'
                    : 'bg-lmed-elevated text-slate-500'
                }`}
              >
                {isDone ? <Check className="w-4 h-4" /> : step}
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-semibold ${isActive ? 'text-slate-100' : 'text-slate-300'}`}>
                  {title}
                </p>
                <p className="text-[11px] text-slate-500 leading-snug mt-0.5">{hint}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
