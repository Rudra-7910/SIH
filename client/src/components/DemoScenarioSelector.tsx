import React from 'react';
import { DemoScenario } from '../types';
import { CheckCircle2, AlertTriangle, Camera, XCircle, FlaskConical } from 'lucide-react';

interface Props {
  scenarios: DemoScenario[];
  activeScenarioId: string | null;
  onSelect: (scenario: DemoScenario) => void;
  loading: boolean;
}

const SCENARIO_META: Record<string, {
  label: string;
  badge: string;
  badgeCls: string;
  icon: React.ReactNode;
  caseRef: string;
}> = {
  good_package: {
    label: 'Compliant',
    badge: 'COMPLIANT',
    badgeCls: 'gov-badge-pass',
    icon: <CheckCircle2 style={{ width: 15, height: 15, color: 'var(--gov-pass)' }} />,
    caseRef: 'CAS/2024/LM/0481',
  },
  missing_declaration: {
    label: 'Breach',
    badge: 'POTENTIAL BREACH',
    badgeCls: 'gov-badge-breach',
    icon: <XCircle style={{ width: 15, height: 15, color: 'var(--gov-breach)' }} />,
    caseRef: 'CAS/2024/LM/0484',
  },
  low_confidence: {
    label: 'Review',
    badge: 'REVIEW REQ.',
    badgeCls: 'gov-badge-review',
    icon: <AlertTriangle style={{ width: 15, height: 15, color: 'var(--gov-saffron-border)' }} />,
    caseRef: 'CAS/2024/LM/0482',
  },
  insufficient_coverage: {
    label: 'Incomplete',
    badge: 'ADD. VIEW REQ.',
    badgeCls: 'gov-badge-neutral',
    icon: <Camera style={{ width: 15, height: 15, color: 'var(--gov-text-muted)' }} />,
    caseRef: 'CAS/2024/LM/0483',
  },
};

export const DemoScenarioSelector: React.FC<Props> = ({
  scenarios,
  activeScenarioId,
  onSelect,
  loading,
}) => {
  return (
    <div className="gov-panel">
      <div className="gov-panel-header">
        <span className="gov-panel-title">Demo Case Dockets</span>
        <span className="gov-panel-cite">Select a scenario to inspect</span>
      </div>

      <div style={{ padding: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px 10px', borderBottom: '1px solid var(--gov-border)', marginBottom: 6 }}>
          <FlaskConical style={{ width: 14, height: 14, color: 'var(--gov-text-muted)', flexShrink: 0 }} />
          <p style={{ fontSize: 11, color: 'var(--gov-text-muted)', lineHeight: 1.4 }}>
            No upload needed — select any case file below to see how the tool works
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {scenarios.map((s) => {
            const isActive = activeScenarioId === s.id;
            const meta = SCENARIO_META[s.id] || {
              label: 'Demo',
              badge: 'DEMO',
              badgeCls: 'gov-badge-neutral',
              icon: <FlaskConical style={{ width: 15, height: 15, color: 'var(--gov-text-muted)' }} />,
              caseRef: 'CAS/2024/LM/0000',
            };

            return (
              <button
                key={s.id}
                onClick={() => onSelect(s)}
                disabled={loading}
                className={`gov-docket-row ${isActive ? 'gov-docket-row-active' : ''}`}
                style={{ opacity: loading ? 0.55 : 1, cursor: loading ? 'wait' : 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ marginTop: 2, flexShrink: 0 }}>{meta.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--gov-text-primary)' }}>{s.name}</p>
                      <span className={`gov-badge ${meta.badgeCls}`} style={{ flexShrink: 0 }}>{meta.badge}</span>
                    </div>
                    <p style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: 'var(--gov-text-muted)', marginBottom: 2 }}>{meta.caseRef}</p>
                    <p style={{ fontSize: 11, color: 'var(--gov-text-secondary)', lineHeight: 1.4 }}>{s.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {loading && (
          <p style={{ fontSize: 11, color: 'var(--gov-saffron)', textAlign: 'center', padding: '8px 0', fontStyle: 'italic' }}>
            Loading scenario…
          </p>
        )}
      </div>
    </div>
  );
};
