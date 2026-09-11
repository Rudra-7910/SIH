import React from 'react';
import { InspectionSession } from '../types';
import { FileText, CheckCircle2, AlertTriangle, XCircle, Download, Gavel, Stamp } from 'lucide-react';
import { generateInspectionDossierPDF, generateShowCauseNoticePDF } from '../utils/pdfGenerator';

interface Props {
  session: InspectionSession | null;
  onComplete: () => void;
}

type OverallStatus = 'COMPLIANT' | 'NON_COMPLIANT' | 'REVIEW_REQUIRED';

export const InspectionSummary: React.FC<Props> = ({ session, onComplete }) => {
  if (!session || session.ruleResults.length === 0) {
    return (
      <div className="p-6 text-center">
        <Stamp className="w-8 h-8 mx-auto mb-2 text-slate-600" />
        <p className="text-sm font-medium text-slate-400">Report not ready</p>
        <p className="text-xs text-slate-500 mt-1">Complete Step 1 first — upload or try a sample</p>
      </div>
    );
  }

  const issueCount = session.ruleResults.filter((r) => r.verdict === 'POTENTIAL_ISSUE').length;
  const reviewCount = session.ruleResults.filter((r) => r.verdict === 'NEEDS_REVIEW').length;

  const overallStatus: OverallStatus =
    issueCount > 0 ? 'NON_COMPLIANT' : reviewCount > 0 ? 'REVIEW_REQUIRED' : 'COMPLIANT';

  const statusConfig = {
    COMPLIANT: {
      icon: <CheckCircle2 className="w-6 h-6 text-lmed-pass" />,
      title: 'Package looks compliant',
      message: 'All required label information appears to be present.',
      className: 'status-compliant',
    },
    REVIEW_REQUIRED: {
      icon: <AlertTriangle className="w-6 h-6 text-lmed-review" />,
      title: 'Manual check needed',
      message: 'Some details were hard to read. Please verify before signing off.',
      className: 'status-review',
    },
    NON_COMPLIANT: {
      icon: <XCircle className="w-6 h-6 text-lmed-breach" />,
      title: 'Problems found on label',
      message: `${issueCount} issue${issueCount > 1 ? 's' : ''} detected. You may need to issue a notice or take further action.`,
      className: 'status-breach',
    },
  };

  const config = statusConfig[overallStatus];

  const productName =
    session.mergedFields.find((f) => f.fieldName === 'generic_name')?.value ||
    session.views[0]?.ocrResult?.lines?.[0]?.text ||
    'Product';

  return (
    <div className="p-3">
      <p className="text-xs text-slate-400 mb-3">
        Step 3 — Final report for <span className="text-slate-300 font-medium">{productName}</span>
      </p>

      <div className={`rounded-sm p-4 mb-4 border ${config.className}`}>
        <div className="flex items-start gap-3">
          {config.icon}
          <div>
            <p className="text-base font-semibold text-slate-100">{config.title}</p>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">{config.message}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Download documents</p>

        <button
          onClick={() => generateInspectionDossierPDF(session)}
          className="w-full flex items-center gap-3 p-3 rounded-sm border border-lmed-border bg-canvas-alt hover:border-lmed-blue text-left transition-colors"
        >
          <FileText className="w-5 h-5 text-lmed-blue shrink-0" />
          <div>
            <p className="text-sm font-medium text-slate-200">Inspection report (PDF)</p>
            <p className="text-xs text-slate-500">Full details of what was found</p>
          </div>
        </button>

        <button
          onClick={() => generateShowCauseNoticePDF(session)}
          className={`w-full flex items-center gap-3 p-3 rounded-sm border text-left transition-colors ${
            issueCount > 0 ? 'status-breach hover:opacity-90' : 'border-lmed-border bg-canvas-alt hover:border-lmed-blue'
          }`}
        >
          <Gavel className="w-5 h-5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-slate-200">Show cause notice (PDF)</p>
            <p className="text-xs text-slate-500">For use when violations are found</p>
          </div>
        </button>

        <button
          onClick={() => {
            const blob = new Blob([buildTextReport(session, config.title, productName)], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `inspection-${session.sessionId.slice(0, 8)}.txt`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="w-full flex items-center gap-3 p-3 rounded-sm border border-lmed-border bg-canvas-alt hover:border-lmed-blue text-left transition-colors"
        >
          <Download className="w-5 h-5 text-slate-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-slate-200">Simple text report</p>
            <p className="text-xs text-slate-500">Easy to read, copy, or share</p>
          </div>
        </button>
      </div>

      <div className="mt-4 pt-3 border-t border-lmed-border">
        {session.status !== 'completed' ? (
          <button onClick={onComplete} className="w-full statutory-btn-primary py-3 justify-center text-sm">
            <CheckCircle2 className="w-4 h-4" />
            Mark inspection as complete
          </button>
        ) : (
          <div className="flex items-center justify-center gap-2 py-2 status-compliant rounded-sm text-sm font-medium">
            <Stamp className="w-4 h-4" />
            This inspection is complete and saved
          </div>
        )}
      </div>
    </div>
  );
};

function buildTextReport(session: InspectionSession, status: string, product: string): string {
  const lines = [
    'LEGAL METROLOGY INSPECTION REPORT',
    '================================',
    '',
    `Product: ${product}`,
    `Date: ${new Date(session.createdAt).toLocaleString()}`,
    `Status: ${status}`,
    '',
    '--- Label details found ---',
  ];
  for (const f of session.mergedFields) {
    lines.push(`${f.displayName}: ${f.value}`);
  }
  lines.push('', '--- Compliance check ---');
  for (const r of session.ruleResults) {
    const mark = r.verdict === 'PASS' ? 'OK' : r.verdict === 'POTENTIAL_ISSUE' ? 'PROBLEM' : 'CHECK';
    lines.push(`[${mark}] ${r.displayName}: ${r.reason}`);
  }
  return lines.join('\n');
}
