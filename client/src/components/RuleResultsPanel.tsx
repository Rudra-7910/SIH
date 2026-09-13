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
      <div style={{ padding: 32, textAlign: 'center' }}>
        <Gavel style={{ width: 32, height: 32, margin: '0 auto 8px', color: 'var(--gov-border-strong)' }} />
        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--gov-text-secondary)' }}>No compliance check yet</p>
        <p style={{ fontSize: 12, color: 'var(--gov-text-muted)', marginTop: 4 }}>Upload a photo to run the statutory check</p>
      </div>
    );
  }

  const sorted = [...results].sort((a, b) => {
    const order = { POTENTIAL_ISSUE: 0, NEEDS_REVIEW: 1, PASS: 2 };
    const diff = order[a.verdict] - order[b.verdict];
    if (diff !== 0) return diff;
    return { HIGH: 0, MEDIUM: 1, LOW: 2 }[a.severity] - { HIGH: 0, MEDIUM: 1, LOW: 2 }[b.severity];
  });

  const passCount      = results.filter((r) => r.verdict === 'PASS').length;
  const reviewCount    = results.filter((r) => r.verdict === 'NEEDS_REVIEW').length;
  const violationCount = results.filter((r) => r.verdict === 'POTENTIAL_ISSUE').length;

  return (
    <div>
      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid var(--gov-border)' }}>
        {[
          { label: 'Compliant', count: passCount,      bg: 'var(--gov-pass-bg)',    text: 'var(--gov-pass)',    border: 'var(--gov-pass-border)' },
          { label: 'Review',    count: reviewCount,    bg: 'var(--gov-review-bg)',  text: 'var(--gov-review)',  border: 'var(--gov-review-border)' },
          { label: 'Issues',    count: violationCount, bg: 'var(--gov-breach-bg)',  text: 'var(--gov-breach)',  border: 'var(--gov-breach-border)' },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              padding: '12px 16px',
              textAlign: 'center',
              background: s.bg,
              borderRight: i < 2 ? '1px solid var(--gov-border)' : undefined,
            }}
          >
            <p style={{ fontSize: 22, fontFamily: 'JetBrains Mono', fontWeight: 700, color: s.text }}>{s.count}</p>
            <p style={{ fontSize: 11, fontWeight: 600, color: s.text, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Penalty notice */}
      {violationCount > 0 && (
        <div style={{ padding: '10px 16px', background: 'var(--gov-breach-bg)', borderBottom: '1px solid var(--gov-breach-border)', fontSize: 12 }}>
          <strong style={{ color: 'var(--gov-breach)' }}>⚖ Statutory notice:</strong>
          <span style={{ color: 'var(--gov-breach)', marginLeft: 4 }}>
            {violationCount} issue{violationCount > 1 ? 's' : ''} may attract penalty under Section 36 LM Act, 2009 — up to ₹25,000 (first offence), ₹50,000 (repeat).
          </span>
        </div>
      )}

      {/* Rule rows */}
      <div>
        {sorted.map((r) => {
          const isViolation = r.verdict === 'POTENTIAL_ISSUE';
          const isReview    = r.verdict === 'NEEDS_REVIEW';
          const isPass      = r.verdict === 'PASS';

          return (
            <div
              key={r.ruleId}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '10px 16px',
                borderBottom: '1px solid var(--gov-border)',
                borderLeft: `3px solid ${isViolation ? 'var(--gov-breach)' : isReview ? 'var(--gov-saffron-border)' : 'var(--gov-pass)'}`,
                background: isViolation ? 'var(--gov-breach-bg)' : isReview ? 'var(--gov-review-bg)' : 'var(--gov-surface)',
              }}
            >
              {/* Icon */}
              <div style={{ marginTop: 2, flexShrink: 0 }}>
                {isViolation
                  ? <XCircle style={{ width: 16, height: 16, color: 'var(--gov-breach)' }} />
                  : isReview
                  ? <AlertTriangle style={{ width: 16, height: 16, color: 'var(--gov-saffron-border)' }} />
                  : <CheckCircle2 style={{ width: 16, height: 16, color: 'var(--gov-pass)' }} />
                }
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--gov-text-primary)' }}>{r.displayName}</p>
                <p style={{ fontSize: 12, marginTop: 2, color: 'var(--gov-text-secondary)', lineHeight: 1.5 }}>{r.reason}</p>
              </div>

              {/* Verdict chip + action */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                <span
                  className={`gov-badge ${isViolation ? 'gov-badge-breach' : isReview ? 'gov-badge-review' : 'gov-badge-pass'}`}
                >
                  {isViolation ? 'ISSUE' : isReview ? 'REVIEW' : 'PASS'}
                </span>
                {!isPass && (
                  <button
                    onClick={() => onReviewClick(r)}
                    className="flex items-center gap-1"
                    style={{
                      padding: '4px 10px',
                      fontSize: 11,
                      fontWeight: 600,
                      background: 'var(--gov-navy)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 3,
                      cursor: 'pointer',
                      fontFamily: 'IBM Plex Sans',
                    }}
                  >
                    Adjudicate <ChevronRight style={{ width: 12, height: 12 }} />
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
