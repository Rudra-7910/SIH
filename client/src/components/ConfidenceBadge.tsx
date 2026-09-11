import React from 'react';

interface Props {
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  value?: number;
  showLabel?: boolean;
}

/**
 * Confidence Badge
 * 
 * IMPORTANT: These are APPLICATION-LEVEL PROTOTYPE THRESHOLDS, NOT legal thresholds.
 * - >= 0.90: HIGH (green)
 * - 0.70–0.89: MEDIUM (amber)
 * - < 0.70: LOW (red)
 * Confidence represents extraction reliability only.
 */
export const ConfidenceBadge: React.FC<Props> = ({ level, value, showLabel = true }) => {
  const styles = {
    HIGH: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
    LOW: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${styles[level]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        level === 'HIGH' ? 'bg-emerald-500' : level === 'MEDIUM' ? 'bg-amber-500' : 'bg-red-500'
      }`} />
      {showLabel && level}
      {value !== undefined && <span className="font-mono">{(value * 100).toFixed(1)}%</span>}
    </span>
  );
};
