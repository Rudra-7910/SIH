import React, { useState } from 'react';
import { Landmark, Info, CheckCircle2, AlertTriangle, XCircle, Copy, Check } from 'lucide-react';

interface HeaderProps {
  onShowArchitecture: () => void;
  sessionId?: string | null;
  ocrEngine?: 'paddle' | 'tesseract';
  onEngineChange?: (engine: 'paddle' | 'tesseract') => void;
  stats?: {
    totalRules: number;
    passed: number;
    violations: number;
    reviews: number;
  };
}

export const Header: React.FC<HeaderProps> = ({
  onShowArchitecture,
  sessionId,
  ocrEngine,
  onEngineChange,
  stats,
}) => {
  const [copied, setCopied] = useState(false);

  const copySessionId = () => {
    if (sessionId) {
      navigator.clipboard.writeText(sessionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="relative z-20" style={{ borderBottom: '1px solid #D1D9E3' }}>
      {/* Constitutional tricolor stripe */}
      <div className="tricolor-stripe" />

      {/* Navy authority bar */}
      <div style={{ background: 'var(--gov-navy-dark)' }}>
        <div style={{ maxWidth: 1600, margin: '0 auto', padding: '10px 20px' }}>
          <div className="flex flex-wrap items-center justify-between gap-3">

            {/* Identity */}
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center w-9 h-9 shrink-0"
                style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.2)' }}
              >
                <Landmark className="w-5 h-5" style={{ color: '#FF9933' }} strokeWidth={1.75} />
              </div>
              <div>
                <p style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                  Govt. of India · Ministry of Consumer Affairs
                </p>
                <h1 style={{ fontSize: 15, fontWeight: 600, color: '#FFFFFF', lineHeight: 1.3 }}>
                  Legal Metrology Inspection Assistant
                </h1>
              </div>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-2 flex-wrap">

              {/* Session ID */}
              {sessionId && (
                <div
                  className="flex items-center gap-1.5"
                  style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4 }}
                >
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Session
                  </span>
                  <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono', fontWeight: 600, color: '#FFFFFF' }}>
                    {sessionId.slice(0, 8).toUpperCase()}
                  </span>
                  <button
                    onClick={copySessionId}
                    title="Copy session ID"
                    style={{ color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                  >
                    {copied ? <Check className="w-3 h-3" style={{ color: '#86EFAC' }} /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              )}

              {/* OCR engine toggle */}
              {onEngineChange && (
                <div className="flex items-center" style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.15)', overflow: 'hidden' }}>
                  {(['paddle', 'tesseract'] as const).map((eng) => (
                    <button
                      key={eng}
                      onClick={() => onEngineChange(eng)}
                      style={{
                        padding: '4px 10px',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: 'none',
                        background: ocrEngine === eng ? 'rgba(255,255,255,0.18)' : 'transparent',
                        color: ocrEngine === eng ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                        transition: 'background 0.15s',
                        fontFamily: 'IBM Plex Sans',
                      }}
                    >
                      {eng === 'paddle' ? '⚡ PaddleOCR' : 'Tesseract'}
                    </button>
                  ))}
                </div>
              )}

              {/* Stats */}
              {stats && stats.totalRules > 0 && (
                <div
                  className="hidden md:flex items-center gap-2"
                  style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, fontSize: 11 }}
                >
                  <span className="flex items-center gap-1" style={{ color: '#86EFAC', fontWeight: 600 }}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> {stats.passed}
                  </span>
                  {stats.violations > 0 && (
                    <span className="flex items-center gap-1" style={{ color: '#FCA5A5', fontWeight: 600 }}>
                      <XCircle className="w-3.5 h-3.5" /> {stats.violations}
                    </span>
                  )}
                  {stats.reviews > 0 && (
                    <span className="flex items-center gap-1" style={{ color: '#FCD34D', fontWeight: 600 }}>
                      <AlertTriangle className="w-3.5 h-3.5" /> {stats.reviews}
                    </span>
                  )}
                </div>
              )}

              {/* How it works */}
              <button
                onClick={onShowArchitecture}
                className="flex items-center gap-1.5"
                style={{
                  padding: '5px 12px',
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.7)',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  borderRadius: 4,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                  fontFamily: 'IBM Plex Sans',
                  fontWeight: 500,
                }}
              >
                <Info className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">How it works</span>
              </button>

              {/* Officer identity */}
              <div
                className="hidden sm:flex items-center gap-1.5"
                style={{ paddingLeft: 10, borderLeft: '1px solid rgba(255,255,255,0.2)', fontSize: 11 }}
              >
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Officer</span>
                <span style={{ color: '#FFFFFF', fontFamily: 'JetBrains Mono', fontWeight: 500 }}>LM-DL-4091</span>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#86EFAC', display: 'inline-block' }} />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Disclaimer strip */}
      <div style={{ background: '#FEF3C7', borderBottom: '1px solid #D97706', padding: '4px 20px' }}>
        <p style={{ fontSize: 10, color: '#92400E', textAlign: 'center', fontStyle: 'italic' }}>
          ⚖ Prototype · AI assists detection only — the authorised officer makes all final decisions · Not a substitute for physical inspection
        </p>
      </div>
    </header>
  );
};
