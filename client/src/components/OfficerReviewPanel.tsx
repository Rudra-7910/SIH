import React, { useState } from 'react';
import { RuleCheckResult, FieldName } from '../types';
import { CheckCircle2, Edit3, X, Camera, XCircle } from 'lucide-react';

interface Props {
  result: RuleCheckResult | null;
  onAction: (type: 'confirm' | 'correct' | 'reject' | 'request_image' | 'remark', data: {
    ruleId: string;
    field: FieldName;
    originalValue?: string;
    correctedValue?: string;
    remarks?: string;
  }) => void;
  onClose: () => void;
}

export const OfficerReviewPanel: React.FC<Props> = ({ result, onAction, onClose }) => {
  const [correctedValue, setCorrectedValue] = useState('');
  const [remarks, setRemarks] = useState('');
  const [showCorrect, setShowCorrect] = useState(false);

  if (!result) return null;

  const handleAction = (type: 'confirm' | 'correct' | 'reject' | 'request_image' | 'remark') => {
    onAction(type, {
      ruleId: result.ruleId,
      field: result.field,
      originalValue: result.extractedValue,
      correctedValue: type === 'correct' ? correctedValue : undefined,
      remarks: remarks || undefined,
    });
    setCorrectedValue('');
    setRemarks('');
    setShowCorrect(false);
  };

  const isViolation = result.verdict === 'POTENTIAL_ISSUE';

  return (
    <div style={{ background: 'var(--gov-surface)', borderTop: '2px solid var(--gov-navy)', borderBottom: '1px solid var(--gov-border)' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        background: 'var(--gov-navy)',
      }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Officer Adjudication — {result.displayName}
        </p>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', padding: 2 }}
        >
          <X style={{ width: 15, height: 15 }} />
        </button>
      </div>

      <div style={{ padding: 16 }}>
        {/* Finding summary */}
        <div style={{
          padding: '10px 14px',
          background: isViolation ? 'var(--gov-breach-bg)' : 'var(--gov-review-bg)',
          border: `1px solid ${isViolation ? 'var(--gov-breach-border)' : 'var(--gov-review-border)'}`,
          borderRadius: 4,
          marginBottom: 14,
          fontSize: 13,
        }}>
          <p style={{ fontWeight: 600, color: 'var(--gov-text-primary)', marginBottom: 4 }}>{result.displayName}</p>
          {result.extractedValue && (
            <p style={{ color: 'var(--gov-text-secondary)' }}>
              Value on label:{' '}
              <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 600, color: 'var(--gov-text-primary)' }}>
                {result.extractedValue}
              </span>
            </p>
          )}
          <p style={{ fontSize: 12, color: 'var(--gov-text-secondary)', marginTop: 6, lineHeight: 1.5 }}>{result.reason}</p>
        </div>

        {/* Correct value field */}
        {showCorrect && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--gov-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              Corrected Value
            </label>
            <input
              value={correctedValue}
              onChange={(e) => setCorrectedValue(e.target.value)}
              placeholder="Enter the correct value as found on label…"
              className="gov-input"
              style={{ fontFamily: 'JetBrains Mono' }}
              autoFocus
            />
          </div>
        )}

        {/* Remarks */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--gov-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
            Officer Remarks <span style={{ color: 'var(--gov-text-muted)', fontWeight: 400, textTransform: 'none' }}>(optional — recorded in audit log)</span>
          </label>
          <input
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Add a note about your decision…"
            className="gov-input"
          />
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button
            onClick={() => handleAction('confirm')}
            className="gov-btn-primary"
            style={{ background: 'var(--gov-pass)', borderColor: '#166534' }}
          >
            <CheckCircle2 style={{ width: 14, height: 14 }} />
            Confirm Finding
          </button>

          <button
            onClick={() => showCorrect && correctedValue ? handleAction('correct') : setShowCorrect(true)}
            className="gov-btn-secondary"
            style={{ borderColor: 'var(--gov-navy)', color: 'var(--gov-navy)' }}
          >
            <Edit3 style={{ width: 14, height: 14 }} />
            {showCorrect ? 'Save Correction' : 'Correct Value'}
          </button>

          <button
            onClick={() => handleAction('reject')}
            className="gov-btn-secondary"
          >
            <XCircle style={{ width: 14, height: 14 }} />
            Dismiss — Not an Issue
          </button>

          <button
            onClick={() => handleAction('request_image')}
            className="gov-btn-warning"
            style={{ marginLeft: 'auto' }}
          >
            <Camera style={{ width: 14, height: 14 }} />
            Request Additional View
          </button>
        </div>
      </div>
    </div>
  );
};
