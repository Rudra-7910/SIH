import React from 'react';
import { ProcessingStepStatus } from '../types';
import { Check, Loader2 } from 'lucide-react';

interface Props {
  steps: ProcessingStepStatus[];
}

const FRIENDLY: Record<string, string> = {
  'Image Preprocessing':   'Preprocessing photograph…',
  'OCR Text Detection':    'Running OCR on label…',
  'Declaration Extraction':'Extracting statutory declarations…',
  'Regulatory Check':      'Checking against Rule 6, PCR 2011…',
};

export const ProcessingStatus: React.FC<Props> = ({ steps }) => {
  if (steps.length === 0) return null;

  const current = steps.find((s) => s.status === 'processing');
  const allDone  = steps.every((s) => s.status === 'complete');

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 16px',
      background: allDone ? 'var(--gov-pass-bg)' : 'var(--gov-navy-bg)',
      borderBottom: `1px solid ${allDone ? 'var(--gov-pass-border)' : 'var(--gov-border)'}`,
    }}>
      {!allDone && <Loader2 style={{ width: 15, height: 15, color: 'var(--gov-navy)', flexShrink: 0 }} className="animate-spin" />}
      {allDone  && <Check   style={{ width: 15, height: 15, color: 'var(--gov-pass)',  flexShrink: 0 }} />}

      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: allDone ? 'var(--gov-pass)' : 'var(--gov-navy)' }}>
          {allDone ? 'Processing complete — see results below' : (current ? FRIENDLY[current.step] || current.step : 'Processing…')}
        </p>

        {/* Step progress dots */}
        <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
          {steps.map((step, i) => (
            <div
              key={i}
              title={FRIENDLY[step.step] || step.step}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                background:
                  step.status === 'complete'   ? 'var(--gov-pass)' :
                  step.status === 'processing' ? 'var(--gov-navy)' :
                  'var(--gov-border)',
                transition: 'background 0.3s ease',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
