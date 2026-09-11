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

  return (
    <div className="p-3 border-b border-lmed-border bg-lmed-elevated/30">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-slate-100">Review this finding</p>
        <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-300">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 rounded-sm bg-canvas-alt border border-lmed-border mb-3 text-sm">
        <p className="font-semibold text-slate-200">{result.displayName}</p>
        {result.extractedValue && (
          <p className="text-slate-400 mt-1">Found on label: <span className="text-slate-200">{result.extractedValue}</span></p>
        )}
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">{result.reason}</p>
      </div>

      {showCorrect && (
        <div className="mb-3">
          <label className="block text-xs text-slate-400 mb-1">Correct value</label>
          <input
            value={correctedValue}
            onChange={(e) => setCorrectedValue(e.target.value)}
            placeholder="Type the correct value…"
            className="w-full px-2 py-1.5 bg-lmed-card border border-lmed-blue rounded-sm text-sm text-slate-100"
            autoFocus
          />
        </div>
      )}

      <div className="mb-3">
        <label className="block text-xs text-slate-400 mb-1">Your notes (optional)</label>
        <input
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Add a note about your decision…"
          className="w-full px-2 py-1.5 bg-lmed-card border border-lmed-border rounded-sm text-sm text-slate-200"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => handleAction('confirm')} className="flex items-center gap-1.5 px-3 py-2 bg-lmed-pass text-white rounded-sm text-xs font-semibold hover:opacity-90">
          <CheckCircle2 className="w-4 h-4" />
          Agree — problem confirmed
        </button>
        <button
          onClick={() => (showCorrect && correctedValue ? handleAction('correct') : setShowCorrect(true))}
          className="flex items-center gap-1.5 px-3 py-2 bg-lmed-blue text-white rounded-sm text-xs font-semibold"
        >
          <Edit3 className="w-4 h-4" />
          {showCorrect ? 'Save correction' : 'Fix the value'}
        </button>
        <button onClick={() => handleAction('reject')} className="flex items-center gap-1.5 px-3 py-2 border border-lmed-border text-slate-300 rounded-sm text-xs font-medium">
          <XCircle className="w-4 h-4" />
          Disagree — not a problem
        </button>
        <button onClick={() => handleAction('request_image')} className="flex items-center gap-1.5 px-3 py-2 border border-lmed-review/50 text-lmed-review rounded-sm text-xs font-medium ml-auto">
          <Camera className="w-4 h-4" />
          Need another photo
        </button>
      </div>
    </div>
  );
};
