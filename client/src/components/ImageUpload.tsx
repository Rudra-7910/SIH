import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Upload, Camera, X, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { ViewLabel } from '../types';

interface Props {
  onUpload: (file: File, viewLabel: ViewLabel, ocrEngine: 'paddle' | 'tesseract') => void;
  disabled: boolean;
  selectedEngine?: 'paddle' | 'tesseract';
}

const SIDES: { value: ViewLabel; label: string; emoji: string }[] = [
  { value: 'front', label: 'Front', emoji: '▣' },
  { value: 'back', label: 'Back', emoji: '▣' },
  { value: 'left', label: 'Left side', emoji: '◧' },
  { value: 'right', label: 'Right side', emoji: '◨' },
];

const MAX_SIZE_MB = 15;

export const ImageUpload: React.FC<Props> = ({ onUpload, disabled, selectedEngine = 'paddle' }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [viewLabel, setViewLabel] = useState<ViewLabel>('front');
  const [ocrEngine, setOcrEngine] = useState<'paddle' | 'tesseract'>(selectedEngine);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setOcrEngine(selectedEngine);
  }, [selectedEngine]);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setCameraError('Please choose an image file (JPG, PNG, or WEBP).');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setCameraError(`File is too large. Maximum size is ${MAX_SIZE_MB} MB.`);
      return;
    }
    setCameraError(null);
    onUpload(file, viewLabel, ocrEngine);
  };

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      cameraInputRef.current?.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      setCameraActive(true);
      requestAnimationFrame(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      });
    } catch {
      cameraInputRef.current?.click();
    }
  }, []);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1920;
    canvas.height = video.videoHeight || 1080;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        stopCamera();
        onUpload(new File([blob], `photo-${viewLabel}.png`, { type: 'image/png' }), viewLabel, ocrEngine);
      }
    }, 'image/png');
  }, [viewLabel, ocrEngine, onUpload, stopCamera]);

  useEffect(() => () => { streamRef.current?.getTracks().forEach((t) => t.stop()); }, []);

  return (
    <div className="statutory-panel p-3">
      <div className="mb-3">
        <h3 className="text-sm font-display font-semibold text-slate-100 mb-1">
          Step 1 — Upload a real photo
        </h3>
        <p className="text-xs text-slate-400">
          Take or upload a clear photo of the product label. Good lighting helps.
        </p>
      </div>

      {/* Side picker — big tap targets */}
      <div className="mb-3">
        <p className="text-xs font-medium text-slate-300 mb-2">Which side of the package?</p>
        <div className="grid grid-cols-2 gap-1.5">
          {SIDES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setViewLabel(s.value)}
              className={`py-2 px-3 rounded-sm text-sm font-medium border transition-colors ${
                viewLabel === s.value
                  ? 'border-lmed-saffron bg-lmed-saffron/10 text-slate-100'
                  : 'border-lmed-border bg-canvas-alt text-slate-400 hover:text-slate-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {cameraActive && (
        <div className="relative mb-3 rounded-sm overflow-hidden bg-black border border-lmed-border">
          <video ref={videoRef} autoPlay playsInline muted className="w-full max-h-[260px] object-contain" />
          <button
            onClick={stopCamera}
            className="absolute top-2 right-2 p-1.5 bg-black/70 rounded-sm text-white"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-3 left-0 right-0 flex justify-center">
            <button onClick={capturePhoto} disabled={disabled} className="statutory-btn-primary py-2.5 px-5">
              <Camera className="w-4 h-4" />
              Take photo
            </button>
          </div>
        </div>
      )}

      {cameraError && (
        <div className="mb-3 p-2.5 rounded-sm status-breach flex items-start gap-2 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{cameraError}</span>
          <button onClick={() => setCameraError(null)} className="ml-auto opacity-70">✕</button>
        </div>
      )}

      {!cameraActive && (
        <div className="space-y-2">
          <button
            onClick={() => !disabled && fileInputRef.current?.click()}
            disabled={disabled}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
            }}
            className={`w-full flex flex-col items-center gap-2 py-5 px-4 rounded-sm border-2 border-dashed transition-colors ${
              isDragging
                ? 'border-lmed-saffron bg-lmed-saffron/5'
                : disabled
                ? 'border-lmed-border opacity-50 cursor-not-allowed'
                : 'border-lmed-border hover:border-lmed-blue cursor-pointer bg-canvas-alt'
            }`}
          >
            <Upload className={`w-8 h-8 ${isDragging ? 'text-lmed-saffron' : 'text-slate-400'}`} />
            <span className="text-sm font-semibold text-slate-200">
              {disabled ? 'Processing…' : 'Tap to choose a photo'}
            </span>
            <span className="text-xs text-slate-500">or drag & drop here · JPG, PNG, WEBP</span>
          </button>

          <button
            onClick={startCamera}
            disabled={disabled}
            className="w-full flex items-center justify-center gap-2 py-3 statutory-btn-secondary text-sm disabled:opacity-50"
          >
            <Camera className="w-5 h-5" />
            Use camera instead
          </button>
        </div>
      )}

      {/* Advanced — hidden by default */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="mt-3 flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-400"
      >
        {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        Advanced settings
      </button>
      {showAdvanced && (
        <div className="mt-2 p-2 rounded-sm bg-canvas-alt border border-lmed-border">
          <label className="block text-[11px] text-slate-500 mb-1">Text recognition engine</label>
          <select
            value={ocrEngine}
            onChange={(e) => setOcrEngine(e.target.value as 'paddle' | 'tesseract')}
            className="w-full px-2 py-1.5 bg-lmed-card border border-lmed-border rounded-sm text-xs text-slate-200"
          >
            <option value="paddle">PaddleOCR (recommended)</option>
            <option value="tesseract">Tesseract (fallback)</option>
          </select>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} className="hidden" />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} className="hidden" />
    </div>
  );
};
