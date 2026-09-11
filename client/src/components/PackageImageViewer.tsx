import React, { useState } from 'react';
import { PackageView, OcrTextLine } from '../types';
import { ZoomIn, ZoomOut, RotateCcw, Eye, EyeOff, Contrast, ImageIcon, MousePointerClick } from 'lucide-react';

interface Props {
  view: PackageView | null;
  highlightedBoxId: string | null;
  onBoxClick: (boxId: string) => void;
  demoMode?: boolean;
}

export const PackageImageViewer: React.FC<Props> = ({
  view,
  highlightedBoxId,
  onBoxClick,
  demoMode = true,
}) => {
  const [showBoxes, setShowBoxes] = useState(true);
  const [hoveredBoxId, setHoveredBoxId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [highContrast, setHighContrast] = useState(false);
  const [inverted, setInverted] = useState(false);

  if (!view) {
    return (
      <div className="statutory-panel p-4 flex-1 flex flex-col items-center justify-center min-h-[320px]">
        <ImageIcon className="w-10 h-10 text-slate-600 mb-3" />
        <p className="text-sm font-semibold text-slate-300 mb-1">No photo yet</p>
        <p className="text-xs text-slate-500 text-center max-w-xs leading-relaxed">
          Upload a package photo on the left, or try a sample case to see how scanning works.
        </p>
      </div>
    );
  }

  const lines = view.ocrResult.lines;
  const avgConf = view.ocrResult.averageConfidence;
  const imageFilter = [highContrast ? 'contrast(1.4)' : '', inverted ? 'invert(1)' : ''].filter(Boolean).join(' ') || 'none';

  const getBoxStroke = (line: OcrTextLine) =>
    line.confidence >= 0.9 ? '#047857' : line.confidence >= 0.7 ? '#B45309' : '#B91C1C';

  return (
    <div className="statutory-panel p-3 flex-1 flex flex-col min-h-0">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2 shrink-0">
        <div>
          <h3 className="text-sm font-display font-semibold text-slate-100 capitalize">
            Step 2 — {view.viewLabel} side of package
          </h3>
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
            <MousePointerClick className="w-3 h-3" />
            Tap highlighted text to see details on the right
          </p>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <div className="flex items-center bg-canvas-alt rounded-sm border border-lmed-border p-0.5">
            <button onClick={() => setZoomLevel((p) => Math.max(0.75, p - 0.25))} className="p-1.5 text-slate-400 hover:text-slate-200" title="Zoom out">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono px-1 tabular-nums text-slate-300">{Math.round(zoomLevel * 100)}%</span>
            <button onClick={() => setZoomLevel((p) => Math.min(2.5, p + 0.25))} className="p-1.5 text-slate-400 hover:text-slate-200" title="Zoom in">
              <ZoomIn className="w-4 h-4" />
            </button>
            {zoomLevel !== 1 && (
              <button onClick={() => setZoomLevel(1)} className="p-1.5 text-lmed-saffron" title="Reset">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setHighContrast((v) => !v)}
            className={`p-1.5 rounded-sm border text-xs ${highContrast ? 'border-lmed-blue bg-lmed-blue/20 text-slate-200' : 'border-lmed-border text-slate-500'}`}
            title="Make text easier to read"
          >
            <Contrast className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowBoxes(!showBoxes)}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-sm border text-xs ${showBoxes ? 'border-lmed-blue text-slate-200' : 'border-lmed-border text-slate-500'}`}
          >
            {showBoxes ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            Labels
          </button>
        </div>
      </div>

      <div className="relative flex-1 min-h-[300px] evidence-grid bg-canvas-alt rounded-sm overflow-hidden border border-lmed-border flex items-center justify-center">
        <div
          className="relative transition-transform duration-200 origin-center w-full flex items-center justify-center"
          style={{ transform: `scale(${zoomLevel})`, filter: imageFilter }}
        >
          {demoMode ? (
            <div className="w-full max-w-[640px] p-4">
              <div className="bg-lmed-card rounded-sm border border-lmed-border p-5">
                <p className="text-xs text-lmed-saffron mb-1">Sample package label</p>
                <p className="text-lg font-semibold text-slate-100">{lines[0]?.text || 'Product name'}</p>
                <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                  {lines.slice(1, 5).map((line, i) => (
                    <div key={i} className="p-2 bg-canvas-alt rounded-sm border border-lmed-border">
                      <span className="text-slate-200">{line.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <img src={view.imagePath} alt="Package" className="w-full max-h-[480px] object-contain select-none" />
          )}

          {showBoxes && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              {lines.map((line) => {
                const bb = line.boundingBox;
                const isActive = highlightedBoxId === bb.id || hoveredBoxId === bb.id;
                const stroke = getBoxStroke(line);
                return (
                  <g key={bb.id} style={{ pointerEvents: 'all' }}>
                    <rect
                      x={bb.x} y={bb.y} width={bb.w} height={bb.h}
                      fill={isActive ? `${stroke}22` : 'transparent'}
                      stroke={stroke}
                      strokeWidth={isActive ? 0.55 : 0.35}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredBoxId(bb.id)}
                      onMouseLeave={() => setHoveredBoxId(null)}
                      onClick={() => onBoxClick(bb.id)}
                    />
                    {isActive && (
                      <text x={bb.x} y={Math.max(0, bb.y - 1)} fill="#F8FAFC" fontSize={2.2} fontFamily="JetBrains Mono">
                        {line.text.slice(0, 20)} ({(line.confidence * 100).toFixed(0)}%)
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          )}
        </div>

        <div className="absolute bottom-2 left-2 right-2 bg-canvas/95 border border-lmed-border rounded-sm px-3 py-1.5 flex justify-between text-xs text-slate-400">
          <span>{lines.length} text areas found</span>
          <span>Average accuracy: <span className="text-lmed-pass font-medium tabular-nums">{(avgConf * 100).toFixed(0)}%</span></span>
        </div>
      </div>
    </div>
  );
};
