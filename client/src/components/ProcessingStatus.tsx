import React from 'react';
import { ProcessingStepStatus } from '../types';
import { Check, Loader2 } from 'lucide-react';

interface Props {
  steps: ProcessingStepStatus[];
}

const FRIENDLY: Record<string, string> = {
  'Image Preprocessing': 'Preparing your photo…',
  'OCR Text Detection': 'Reading text on the label…',
  'Declaration Extraction': 'Finding MRP, quantity, dates…',
  'Regulatory Check': 'Checking legal requirements…',
};

export const ProcessingStatus: React.FC<Props> = ({ steps }) => {
  if (steps.length === 0) return null;

  const current = steps.find((s) => s.status === 'processing');
  const allDone = steps.every((s) => s.status === 'complete');

  return (
    <div className="statutory-panel px-3 py-2.5 shrink-0">
      <div className="flex items-center gap-2">
        {!allDone && <Loader2 className="w-4 h-4 text-lmed-saffron animate-spin shrink-0" />}
        {allDone && <Check className="w-4 h-4 text-lmed-pass shrink-0" />}
        <div>
          <p className="text-sm font-medium text-slate-200">
            {allDone ? 'Done! See results on the right →' : (current ? FRIENDLY[current.step] || current.step : 'Working…')}
          </p>
          {!allDone && (
            <p className="text-xs text-slate-500">This usually takes a few seconds</p>
          )}
        </div>
      </div>

      <div className="flex gap-1 mt-2">
        {steps.map((step, i) => (
          <div
            key={i}
            className={`flex-1 h-1 rounded-full ${
              step.status === 'complete' ? 'bg-lmed-pass' :
              step.status === 'processing' ? 'bg-lmed-saffron animate-pulse' :
              'bg-lmed-border'
            }`}
            title={FRIENDLY[step.step] || step.step}
          />
        ))}
      </div>
    </div>
  );
};
