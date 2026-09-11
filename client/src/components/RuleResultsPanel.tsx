import React from 'react';
import { RuleCheckResult } from '../types';
import { CheckCircle2, AlertTriangle, XCircle, ChevronRight, Gavel } from 'lucide-react';

interface Props {
  results: RuleCheckResult[];
  onReviewClick: (result: RuleCheckResult) => void;
}

export const RuleResultsPanel: React.FC<Props> = ({ results, onReviewClick }) => {
  if (results.length === 0) {
    return (
      <div className="p-6 text-center">
        <Gavel className="w-8 h-8 mx-auto mb-2 text-slate-600" />
        <p className="text-sm font-medium text-slate-400">No results yet</p>
        <p className="text-xs text-slate-500 mt-1">Upload a photo to run the compliance check</p>
      </div>
    );
  }

  const sorted = [...results].sort((a, b) => {
    const order = { POTENTIAL_ISSUE: 0, NEEDS_REVIEW: 1, PASS: 2 };
    const diff = order[a.verdict] - order[b.verdict];
    if (diff !== 0) return diff;
    return { HIGH: 0, MEDIUM: 1, LOW: 2 }[a.severity] - { HIGH: 0, MEDIUM: 1, LOW: 2 }[b.severity];
  });

  const passCount = results.filter((r) => r.verdict === 'PASS').length;
  const reviewCount = results.filter((r) => r.verdict === 'NEEDS_REVIEW').length;
  const violationCount = results.filter((r) => r.verdict === 'POTENTIAL_ISSUE').length;

  return (
    <div className="p-3">
      <p className="text-xs text-slate-400 mb-3 leading-relaxed">
        The system checked whether required label information is present and correct under Legal Metrology rules.
      </p>

      {/* Simple summary */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="p-2 rounded-sm bg-lmed-pass/10 border border-lmed-pass/30 text-center">
          <p className="text-lg font-bold text-lmed-pass tabular-nums">{passCount}</p>
          <p className="text-[10px] text-slate-400">Passed</p>
        </div>
        <div className="p-2 rounded-sm bg-lmed-review/10 border border-lmed-review/30 text-center">
          <p className="text-lg font-bold text-lmed-review tabular-nums">{reviewCount}</p>
          <p className="text-[10px] text-slate-400">Needs check</p>
        </div>
        <div className="p-2 rounded-sm bg-lmed-breach/10 border border-lmed-breach/30 text-center">
          <p className="text-lg font-bold text-lmed-breach tabular-nums">{violationCount}</p>
          <p className="text-[10px] text-slate-400">Problems</p>
        </div>
      </div>

      {violationCount > 0 && (
        <div className="mb-3 p-2.5 rounded-sm status-breach text-xs">
          <strong>{violationCount} problem{violationCount > 1 ? 's' : ''} found.</strong>
          {' '}These may require action under Section 36 (fine up to ₹25,000 for first offence).
        </div>
      )}

      <div className="space-y-2">
        {sorted.map((r) => {
          const isViolation = r.verdict === 'POTENTIAL_ISSUE';
          const isReview = r.verdict === 'NEEDS_REVIEW';
          const isPass = r.verdict === 'PASS';

          return (
            <div
              key={r.ruleId}
              className={`p-3 rounded-sm border ${
                isViolation ? 'status-breach' : isReview ? 'status-review' : 'border-lmed-border bg-canvas-alt'
              }`}
            >
              <div className="flex items-start gap-2">
                <div className="mt-0.5 shrink-0">
                  {isViolation ? <XCircle className="w-4 h-4 text-lmed-breach" /> :
                   isReview ? <AlertTriangle className="w-4 h-4 text-lmed-review" /> :
                   <CheckCircle2 className="w-4 h-4 text-lmed-pass" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-100">{r.displayName}</p>
                  <p className={`text-xs font-medium mt-0.5 ${isPass ? 'text-lmed-pass' : isViolation ? 'text-lmed-breach' : 'text-lmed-review'}`}>
                    {isPass ? '✓ Looks good' : isViolation ? '✗ Problem found' : '? Please verify manually'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{r.reason}</p>
                </div>
                {!isPass && (
                  <button
                    onClick={() => onReviewClick(r)}
                    className="shrink-0 flex items-center gap-0.5 px-2.5 py-1.5 bg-lmed-blue text-white rounded-sm text-xs font-medium hover:bg-lmed-navy"
                  >
                    Review
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
