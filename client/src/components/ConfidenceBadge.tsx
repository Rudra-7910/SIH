import React from 'react';

interface Props {
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  value?: number;
  showLabel?: boolean;
}

/**
 * ConfidenceBadge
 * HIGH  >= 90%  — green (statutory pass threshold)
 * MEDIUM 70-89% — amber (needs officer attention)
 * LOW   < 70%  — red (flags for review)
 */
export const ConfidenceBadge: React.FC<Props> = ({ level, value, showLabel = true }) => {
  const cls = {
    HIGH:   'gov-badge gov-badge-pass',
    MEDIUM: 'gov-badge gov-badge-review',
    LOW:    'gov-badge gov-badge-breach',
  }[level];

  return (
    <span className={cls}>
      <span style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: level === 'HIGH' ? 'var(--gov-pass)' : level === 'MEDIUM' ? 'var(--gov-saffron-border)' : 'var(--gov-breach)',
        display: 'inline-block',
        flexShrink: 0,
      }} />
      {showLabel && level}
      {value !== undefined && (
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10 }}>{(value * 100).toFixed(1)}%</span>
      )}
    </span>
  );
};
