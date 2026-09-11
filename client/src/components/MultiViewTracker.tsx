import React from 'react';
import { ViewLabel } from '../types';
import { Check, Camera } from 'lucide-react';

interface Props {
  submittedViews: ViewLabel[];
  recommendations: string[];
}

const ALL_VIEWS: { label: ViewLabel; display: string }[] = [
  { label: 'front', display: 'Front' },
  { label: 'back', display: 'Back' },
  { label: 'left', display: 'Left' },
  { label: 'right', display: 'Right' },
];

export const MultiViewTracker: React.FC<Props> = ({ submittedViews, recommendations }) => {
  const done = submittedViews.length;
  const total = ALL_VIEWS.length;

  return (
    <div className="statutory-panel px-3 py-2.5 shrink-0">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-slate-300">
          Photos taken ({done} of {total})
        </p>
        {done === total && recommendations.length === 0 && (
          <span className="text-xs text-lmed-pass font-medium">Complete ✓</span>
        )}
      </div>

      <div className="flex gap-1.5">
        {ALL_VIEWS.map((v) => {
          const submitted = submittedViews.includes(v.label);
          return (
            <div
              key={v.label}
              className={`flex-1 flex flex-col items-center py-2 rounded-sm border text-xs ${
                submitted
                  ? 'border-lmed-pass/50 bg-lmed-pass/10 text-lmed-pass'
                  : 'border-lmed-border bg-canvas-alt text-slate-600'
              }`}
            >
              {submitted ? <Check className="w-4 h-4 mb-0.5" /> : <span className="w-4 h-4 mb-0.5 text-center">—</span>}
              {v.display}
            </div>
          );
        })}
      </div>

      {recommendations.length > 0 && (
        <div className="mt-2 p-2 rounded-sm bg-lmed-review/10 border border-lmed-review/30">
          <p className="text-xs font-medium text-lmed-review mb-1 flex items-center gap-1">
            <Camera className="w-3.5 h-3.5" />
            Please add more photos:
          </p>
          {recommendations.map((rec, i) => (
            <p key={i} className="text-xs text-slate-400 ml-5">{rec}</p>
          ))}
        </div>
      )}
    </div>
  );
};
