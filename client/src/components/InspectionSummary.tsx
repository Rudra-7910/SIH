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
      <div style={{ padding: 32, textAlign: 'center' }}>
        <Stamp style={{ width: 32, height: 32, margin: '0 auto 8px', color: 'var(--gov-border-strong)' }} />
        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--gov-text-secondary)' }}>Report not ready</p>
        <p style={{ fontSize: 12, color: 'var(--gov-text-muted)', marginTop: 4 }}>Complete a scan to generate the inspection dossier</p>
      </div>
    );
  }

  const issueCount  = session.ruleResults.filter((r) => r.verdict === 'POTENTIAL_ISSUE').length;
  const reviewCount = session.ruleResults.filter((r) => r.verdict === 'NEEDS_REVIEW').length;
  const passCount   = session.ruleResults.filter((r) => r.verdict === 'PASS').length;

  const overallStatus: OverallStatus =
    issueCount > 0 ? 'NON_COMPLIANT' : reviewCount > 0 ? 'REVIEW_REQUIRED' : 'COMPLIANT';

  const statusConfig = {
    COMPLIANT: {
      icon: <CheckCircle2 style={{ width: 20, height: 20, color: 'var(--gov-pass)', flexShrink: 0 }} />,
      title: 'COMPLIANT — All Declarations Present',
      message: 'All mandatory declarations under Rule 6, PCR 2011 appear to be present and legible.',
      cls: 'gov-verdict-compliant',
    },
    REVIEW_REQUIRED: {
      icon: <AlertTriangle style={{ width: 20, height: 20, color: 'var(--gov-saffron-border)', flexShrink: 0 }} />,
      title: 'OFFICER REVIEW REQUIRED',
      message: `${reviewCount} declaration${reviewCount > 1 ? 's' : ''} detected with low confidence or ambiguity. Officer must verify before case closure.`,
      cls: 'gov-verdict-review',
    },
    NON_COMPLIANT: {
      icon: <XCircle style={{ width: 20, height: 20, color: 'var(--gov-breach)', flexShrink: 0 }} />,
      title: 'STATUTORY BREACH DETECTED',
      message: `${issueCount} mandatory declaration${issueCount > 1 ? 's appear' : ' appears'} absent after multi-view analysis. Sec. 36 LM Act, 2009 may apply.`,
      cls: 'gov-verdict-breach',
    },
  };

  const config = statusConfig[overallStatus];

  const productName =
    session.mergedFields.find((f) => f.fieldName === 'generic_name')?.value ||
    session.views[0]?.ocrResult?.lines?.[0]?.text ||
    'Product';

  return (
    <div style={{ padding: 16 }}>
      {/* Verdict banner */}
      <div className={config.cls} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', marginBottom: 16 }}>
        {config.icon}
        <div>
          <p style={{ fontWeight: 700, fontSize: 13, letterSpacing: '0.02em' }}>{config.title}</p>
          <p style={{ fontSize: 12, marginTop: 4, lineHeight: 1.5, opacity: 0.85 }}>{config.message}</p>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { label: `${passCount} Compliant`, cls: 'gov-badge-pass' },
          { label: `${reviewCount} Review`, cls: 'gov-badge-review' },
          { label: `${issueCount} Issues`, cls: 'gov-badge-breach' },
        ].map((b, i) => (
          <span key={i} className={`gov-badge ${b.cls}`}>{b.label}</span>
        ))}
        <span className="gov-badge gov-badge-navy" style={{ marginLeft: 'auto', fontFamily: 'JetBrains Mono' }}>
          {session.sessionId.slice(0, 8).toUpperCase()}
        </span>
      </div>

      {/* Product */}
      <p style={{ fontSize: 12, color: 'var(--gov-text-muted)', marginBottom: 14 }}>
        Product: <span style={{ fontWeight: 600, color: 'var(--gov-text-primary)' }}>{productName}</span>
        <span style={{ marginLeft: 12, fontFamily: 'JetBrains Mono' }}>{new Date(session.createdAt).toLocaleDateString('en-IN')}</span>
      </p>

      {/* Documents */}
      <div style={{ borderTop: '1px solid var(--gov-border)', paddingTop: 14 }}>
        <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--gov-text-muted)', marginBottom: 10 }}>
          Inspection Documents
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            {
              icon: <FileText style={{ width: 16, height: 16, color: 'var(--gov-navy)', flexShrink: 0 }} />,
              label: 'Form-IV Inspection Dossier (PDF)',
              sub: 'Full statutory inspection memo',
              action: () => generateInspectionDossierPDF(session),
            },
            {
              icon: <Gavel style={{ width: 16, height: 16, color: issueCount > 0 ? 'var(--gov-breach)' : 'var(--gov-text-muted)', flexShrink: 0 }} />,
              label: 'Show Cause Notice — Sec. 36 (PDF)',
              sub: 'For use when violations are found',
              action: () => generateShowCauseNoticePDF(session),
            },
            {
              icon: <Download style={{ width: 16, height: 16, color: 'var(--gov-text-muted)', flexShrink: 0 }} />,
              label: 'Plain Text Report (.txt)',
              sub: 'Simple summary for records',
              action: () => {
                const blob = new Blob([buildTextReport(session, config.title, productName)], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `inspection-${session.sessionId.slice(0, 8)}.txt`;
                a.click();
                URL.revokeObjectURL(url);
              },
            },
          ].map((d, i) => (
            <button
              key={i}
              onClick={d.action}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                background: 'var(--gov-surface)',
                border: '1px solid var(--gov-border)',
                borderRadius: 4,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color 0.15s, background 0.15s',
                width: '100%',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--gov-navy)'; (e.currentTarget as HTMLElement).style.background = 'var(--gov-navy-bg)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--gov-border)'; (e.currentTarget as HTMLElement).style.background = 'var(--gov-surface)'; }}
            >
              {d.icon}
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--gov-text-primary)' }}>{d.label}</p>
                <p style={{ fontSize: 11, color: 'var(--gov-text-muted)' }}>{d.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Complete button */}
      <div style={{ marginTop: 16 }}>
        {session.status !== 'completed' ? (
          <button
            onClick={onComplete}
            className="gov-btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '10px 16px' }}
          >
            <CheckCircle2 style={{ width: 16, height: 16 }} />
            Finalise &amp; Certify Inspection
          </button>
        ) : (
          <div
            className="gov-verdict-compliant"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 16px', fontSize: 13, fontWeight: 600 }}
          >
            <Stamp style={{ width: 16, height: 16 }} />
            Inspection Certified &amp; Closed
          </div>
        )}
      </div>
    </div>
  );
};

function buildTextReport(session: InspectionSession, status: string, product: string): string {
  const lines = [
    'LEGAL METROLOGY INSPECTION REPORT',
    'Government of India — Ministry of Consumer Affairs',
    '='.repeat(52),
    '',
    `Product:    ${product}`,
    `Session ID: ${session.sessionId}`,
    `Date:       ${new Date(session.createdAt).toLocaleString('en-IN')}`,
    `Status:     ${status}`,
    '',
    '— Extracted Declarations ——————————————————————————',
  ];
  for (const f of session.mergedFields) {
    lines.push(`  ${f.displayName.padEnd(30)} ${f.value}`);
  }
  lines.push('', '— Statutory Compliance Results —————————————————————');
  for (const r of session.ruleResults) {
    const mark = r.verdict === 'PASS' ? '[PASS   ]' : r.verdict === 'POTENTIAL_ISSUE' ? '[ISSUE  ]' : '[REVIEW ]';
    lines.push(`  ${mark} ${r.displayName}: ${r.reason}`);
  }
  lines.push('', 'DISCLAIMER: AI assists detection only. Officer makes all final decisions.');
  return lines.join('\n');
}
