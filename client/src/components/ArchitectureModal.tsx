import React from 'react';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Architecture Modal — shows the processing pipeline diagram.
 */
export const ArchitectureModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const steps = [
    { label: 'Camera / Image Upload', icon: '📷', desc: 'Package photo capture or file upload' },
    { label: 'Image Preprocessing', icon: '🖼️', desc: 'Resize, contrast enhancement, sharpening (sharp/OpenCV)' },
    { label: 'OCR Engine', icon: '🔍', desc: 'PaddleOCR / Mock OCR — text detection with bounding boxes + confidence' },
    { label: 'Declaration Extraction', icon: '📋', desc: 'Keyword matching + regex to extract MRP, net qty, manufacturer, etc.' },
    { label: 'Rule Repository', icon: '📖', desc: 'Machine-readable JSON rule definitions (demo rules)' },
    { label: 'Rule Engine', icon: '⚙️', desc: 'Deterministic checks: PASS / POTENTIAL_ISSUE / NEEDS_REVIEW' },
    { label: 'Compliance Findings', icon: '📊', desc: 'Results with rule IDs, reasons, confidence, severity' },
    { label: 'Officer Review', icon: '👤', desc: 'Confirm / Correct / Reject / Request Image / Remarks' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">System Architecture</h2>
            <p className="text-xs text-gray-500 mt-0.5">Legal Metrology Inspection Assistant — Processing Pipeline</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pipeline */}
        <div className="p-5">
          <div className="space-y-0">
            {steps.map((step, i) => (
              <React.Fragment key={i}>
                <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="text-2xl w-10 text-center shrink-0">{step.icon}</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{step.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <div className="flex items-center ml-5 pl-[14px]">
                    <div className="w-0.5 h-4 bg-blue-300" />
                    <span className="text-blue-400 text-xs ml-2">↓</span>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Key principles */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-bold text-blue-800 mb-2">Key Principles</h4>
            <ul className="text-xs text-blue-700 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">→</span>
                <span><strong>AI assists detection; the authorized officer makes the final decision.</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">→</span>
                <span>No LLM is used for legal decisions — the rule engine is deterministic.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">→</span>
                <span>One photograph cannot prove a declaration is absent from the entire package.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">→</span>
                <span>Confidence represents extraction reliability, not legal certainty.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">→</span>
                <span>OCR adapter is modular — can swap Mock OCR for PaddleOCR without code changes.</span>
              </li>
            </ul>
          </div>

          {/* Tech stack */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Frontend</p>
              <p className="text-xs text-gray-500">React + Vite + TypeScript + Tailwind CSS</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Backend</p>
              <p className="text-xs text-gray-500">Node.js + Express + TypeScript</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs font-semibold text-gray-600 uppercase mb-1">OCR</p>
              <p className="text-xs text-gray-500">PaddleOCR (adapter) / Mock OCR (demo)</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Image Processing</p>
              <p className="text-xs text-gray-500">sharp (resize, contrast, sharpen)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
