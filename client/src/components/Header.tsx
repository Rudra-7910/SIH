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
    <header className="relative border-b border-lmed-border bg-canvas z-20">
      <div className="tricolor-stripe" />

      <div className="max-w-desk mx-auto px-4 sm:px-5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-10 h-10 rounded-sm bg-lmed-card border border-lmed-blue shrink-0">
              <Landmark className="w-5 h-5 text-lmed-saffron" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-display font-semibold text-slate-50 tracking-tight">
                Legal Metrology Inspection Assistant
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Ministry of Consumer Affairs · Check package labels for legal compliance
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {sessionId && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-lmed-card border border-lmed-border">
                <span className="text-xs text-slate-400">Inspection ID:</span>
                <span className="text-xs font-mono font-semibold text-slate-200 tabular-nums">
                  {sessionId.slice(0, 8).toUpperCase()}
                </span>
                <button
                  onClick={copySessionId}
                  title="Copy ID"
                  className="ml-0.5 p-0.5 text-slate-500 hover:text-lmed-saffron"
                >
                  {copied ? <Check className="w-3 h-3 text-lmed-pass" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            )}

            {stats && stats.totalRules > 0 && (
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-sm bg-lmed-card border border-lmed-border text-xs">
                <span className="text-lmed-pass flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {stats.passed} OK
                </span>
                {stats.violations > 0 && (
                  <span className="text-lmed-breach flex items-center gap-1 font-medium">
                    <XCircle className="w-3.5 h-3.5" /> {stats.violations} issues
                  </span>
                )}
                {stats.reviews > 0 && (
                  <span className="text-lmed-review flex items-center gap-1 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" /> {stats.reviews} to check
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onShowArchitecture}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-sm bg-lmed-card text-slate-400 border border-lmed-border hover:border-lmed-blue hover:text-slate-200"
            >
              <Info className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">How it works</span>
              <span className="sm:hidden">Help</span>
            </button>
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-lmed-border text-xs text-slate-400">
              <span className="text-slate-300 font-medium">Inspector</span>
              <span>LM-DL-4091</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
