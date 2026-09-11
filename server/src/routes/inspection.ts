/**
 * Inspection API Routes
 * 
 * These routes handle the core inspection workflow:
 * 1. Create a new inspection session
 * 2. Upload images (with preprocessing → OCR → extraction → rules)
 * 3. Get session state
 * 4. Officer review actions
 * 5. Complete/finalize inspection
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
import { preprocessImage } from '../preprocessing/imagePreprocessor';
import { MockOcrAdapter } from '../ocr/MockOcrAdapter';
import { TesseractOcrAdapter } from '../ocr/TesseractOcrAdapter';
import { PaddleOcrAdapter } from '../ocr/PaddleOcrAdapter';
import { IOcrAdapter } from '../ocr/IOcrAdapter';
import { extractFields, extractFieldsWithLLMFallback } from '../extraction/fieldExtractor';
import {
  createSession,
  getSession,
  addViewToSession,
  addOfficerAction,
  completeSession,
  getAllSessions,
} from '../session/inspectionSession';
import { ViewLabel, PackageView, OfficerAction, ProcessingStepStatus, OcrResult } from '../types';

const router = Router();

// ─── OCR Adapter Selection ──────────────────────────────────────────────────
/**
 * ARCHITECTURAL DECISION: Three OCR adapters coexist.
 * - MockOcrAdapter: used for demo scenarios (reliable, controlled data)
 * - PaddleOcrAdapter: used when requested or when OCR_MODE=paddle
 * - TesseractOcrAdapter: used for standard browser uploads
 */
const mockOcrAdapter = new MockOcrAdapter();
const tesseractOcrAdapter = new TesseractOcrAdapter();
const paddleOcrAdapter = new PaddleOcrAdapter();
console.log(`[OCR] Mock adapter ready: ${mockOcrAdapter.adapterName}`);
console.log(`[OCR] Real adapter ready: ${tesseractOcrAdapter.adapterName}`);
console.log(`[OCR] Paddle adapter ready: ${paddleOcrAdapter.adapterName}`);

// ─── Multer Config ──────────────────────────────────────────────────────────
const uploadsDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `inspection-${Date.now()}-${uuid().slice(0, 8)}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'));
      return;
    }
    cb(null, true);
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// ─── POST /api/inspection/start ─────────────────────────────────────────────
router.post('/start', (_req: Request, res: Response) => {
  const session = createSession();
  res.status(201).json({ session });
});

// ─── POST /api/inspection/:id/upload ────────────────────────────────────────
router.post('/:id/upload', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.id;
    const session = getSession(sessionId);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No image uploaded' });
      return;
    }

    const viewLabel = (req.body.viewLabel || 'front') as ViewLabel;
    const scenarioId = req.body.scenarioId; // For demo scenario loading

    // Select OCR adapter: demo scenarios use mock (reliable), real uploads use Tesseract
    const engineParam = req.body.engine || req.body.ocrEngine;
    const preferPaddle = engineParam ? engineParam === 'paddle' : (process.env.OCR_MODE !== 'tesseract');
    let activeAdapter: string;
    let ocrResult: OcrResult;

    const steps: ProcessingStepStatus[] = [];
    const imagePath = req.file.path;

    // Step 1: Preprocessing
    steps.push({ step: 'Image Preprocessing', status: 'processing' });
    const preprocessResult = await preprocessImage(imagePath, uploadsDir);
    steps[0] = {
      step: 'Image Preprocessing',
      status: 'complete',
      detail: preprocessResult.metadata.steps.join(' → '),
      durationMs: preprocessResult.metadata.processingTimeMs,
    };

    // Step 2: OCR — select engine (Mock for demo, PaddleOCR if requested/configured, or Tesseract)
    if (scenarioId) {
      activeAdapter = 'Mock OCR (Demo)';
      mockOcrAdapter.setScenario(scenarioId);
      steps.push({ step: 'OCR Text Detection', status: 'processing', detail: `Engine: ${activeAdapter}` });
      ocrResult = await mockOcrAdapter.processImage(preprocessResult.preprocessedPath, viewLabel);
    } else if (preferPaddle) {
      try {
        activeAdapter = 'PaddleOCR (Deep Learning)';
        steps.push({ step: 'OCR Text Detection', status: 'processing', detail: `Engine: ${activeAdapter}` });
        ocrResult = await paddleOcrAdapter.processImage(preprocessResult.preprocessedPath);

        // ── Multi-pass OCR: if PaddleOCR confidence is low, also run Tesseract
        // and merge unique text lines to improve extraction coverage ──────────
        const LOW_CONFIDENCE_THRESHOLD = 0.65;
        if (ocrResult.averageConfidence < LOW_CONFIDENCE_THRESHOLD) {
          console.log(`[Multi-Pass OCR] PaddleOCR confidence ${(ocrResult.averageConfidence * 100).toFixed(1)}% < ${LOW_CONFIDENCE_THRESHOLD * 100}% — running Tesseract second pass`);
          try {
            const tesseractResult = await tesseractOcrAdapter.processImage(preprocessResult.preprocessedPath, viewLabel);
            // Merge lines from Tesseract that are not already in PaddleOCR results
            // (deduplicate by checking if text is already substantially covered)
            const existingTexts = new Set(
              ocrResult.lines.map(l => l.text.toLowerCase().trim().slice(0, 20))
            );
            const newLines = tesseractResult.lines.filter(tLine => {
              const key = tLine.text.toLowerCase().trim().slice(0, 20);
              return key.length > 2 && !existingTexts.has(key);
            });
            if (newLines.length > 0) {
              ocrResult = {
                ...ocrResult,
                lines: [...ocrResult.lines, ...newLines],
                rawText: ocrResult.rawText + '\n' + tesseractResult.rawText,
                averageConfidence: (ocrResult.averageConfidence + tesseractResult.averageConfidence) / 2,
              };
              activeAdapter = 'PaddleOCR + Tesseract (Multi-Pass)';
              console.log(`[Multi-Pass OCR] Merged ${newLines.length} additional lines from Tesseract`);
            }
          } catch (tessErr) {
            console.warn('[Multi-Pass OCR] Tesseract second pass failed:', tessErr);
          }
        }
      } catch (err: any) {
        console.warn('[PaddleOCR] Inference failed, falling back to Tesseract:', err?.message || err);
        activeAdapter = 'Tesseract.js (Fallback)';
        ocrResult = await tesseractOcrAdapter.processImage(preprocessResult.preprocessedPath, viewLabel);
      }
    } else {
      activeAdapter = 'Tesseract.js (Real OCR)';
      steps.push({ step: 'OCR Text Detection', status: 'processing', detail: `Engine: ${activeAdapter}` });
      ocrResult = await tesseractOcrAdapter.processImage(preprocessResult.preprocessedPath, viewLabel);
    }

    steps[1] = {
      step: 'OCR Text Detection',
      status: 'complete',
      detail: `[${activeAdapter}] Detected ${ocrResult.lines.length} text regions, avg confidence: ${(ocrResult.averageConfidence * 100).toFixed(1)}%`,
      durationMs: ocrResult.processingTimeMs,
    };

    // Step 3: Field Extraction (Heuristic + optional LLM Fallback)
    steps.push({ step: 'Declaration Extraction', status: 'processing' });
    const startExtraction = Date.now();
    const extractedFields = await extractFieldsWithLLMFallback(ocrResult, viewLabel);
    steps[2] = {
      step: 'Declaration Extraction',
      status: 'complete',
      detail: `Extracted ${extractedFields.length} declaration fields`,
      durationMs: Date.now() - startExtraction,
    };

    // Step 4: Build the view and add to session (triggers rule engine)
    steps.push({ step: 'Regulatory Check', status: 'processing' });
    const startRules = Date.now();

    const view: PackageView = {
      viewLabel,
      imagePath: `/uploads/${path.basename(imagePath)}`,
      originalImagePath: `/uploads/${path.basename(imagePath)}`,
      preprocessedImagePath: `/uploads/${path.basename(preprocessResult.preprocessedPath)}`,
      ocrResult,
      extractedFields,
      uploadedAt: new Date().toISOString(),
    };

    const updatedSession = addViewToSession(sessionId, view);
    steps[3] = {
      step: 'Regulatory Check',
      status: 'complete',
      detail: `Checked ${updatedSession.ruleResults.length} rules`,
      durationMs: Date.now() - startRules,
    };

    steps.push({ step: 'Complete', status: 'complete' });

    res.json({
      session: updatedSession,
      processingSteps: steps,
      currentView: view,
    });
  } catch (error) {
    console.error('[Upload Error]', error);
    res.status(500).json({ error: 'Processing failed', detail: String(error) });
  }
});

// ─── GET /api/inspection/:id ────────────────────────────────────────────────
router.get('/:id', (req: Request, res: Response) => {
  const session = getSession(req.params.id);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  res.json({ session });
});

// ─── POST /api/inspection/:id/review ────────────────────────────────────────
router.post('/:id/review', (req: Request, res: Response) => {
  try {
    const session = getSession(req.params.id);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    const action: OfficerAction = {
      actionId: uuid(),
      type: req.body.type,
      ruleId: req.body.ruleId,
      field: req.body.field,
      originalValue: req.body.originalValue,
      correctedValue: req.body.correctedValue,
      remarks: req.body.remarks,
      timestamp: new Date().toISOString(),
    };

    const updatedSession = addOfficerAction(
      req.params.id,
      action,
      req.body.officerName || 'Demo Officer'
    );

    res.json({ session: updatedSession, action });
  } catch (error) {
    console.error('[Review Error]', error);
    res.status(500).json({ error: 'Review action failed', detail: String(error) });
  }
});

// ─── POST /api/inspection/:id/complete ──────────────────────────────────────
router.post('/:id/complete', (req: Request, res: Response) => {
  try {
    const session = completeSession(req.params.id);
    res.json({ session });
  } catch (error) {
    res.status(500).json({ error: 'Could not complete session', detail: String(error) });
  }
});

// ─── GET /api/inspection (list all) ─────────────────────────────────────────
router.get('/', (_req: Request, res: Response) => {
  const sessions = getAllSessions();
  res.json({ sessions });
});

export default router;
