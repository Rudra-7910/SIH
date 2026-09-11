/**
 * Tesseract.js OCR Adapter
 * 
 * PURPOSE: Provides REAL OCR text extraction from product images using
 * Tesseract.js — a pure JavaScript OCR engine that runs in Node.js.
 * No Python, no external services, no API keys.
 * 
 * USAGE: Set OCR_MODE=tesseract in .env to activate.
 * The mock adapter remains available for demo scenarios.
 * 
 * LIMITATIONS:
 * - First run downloads ~15MB of English language data (cached after)
 * - Accuracy depends on image quality (preprocessing helps)
 * - Best for printed text; handwritten text is less reliable
 */

import { IOcrAdapter } from './IOcrAdapter';
import { OcrResult, OcrTextLine, BoundingBox } from '../types';
import { v4 as uuid } from 'uuid';
import Tesseract from 'tesseract.js';
import sharp from 'sharp';

export class TesseractOcrAdapter implements IOcrAdapter {
  readonly adapterName = 'Tesseract.js (Real OCR)';

  private worker: Tesseract.Worker | null = null;
  private initializing: Promise<void> | null = null;

  /**
   * Lazy-initialize the Tesseract worker. Reuses the worker across calls
   * for performance (avoids re-loading language data each time).
   */
  private async ensureWorker(): Promise<Tesseract.Worker> {
    if (this.worker) return this.worker;

    if (!this.initializing) {
      this.initializing = (async () => {
        console.log('[Tesseract] Initializing OCR engine (first run may download ~15MB language data)...');
        this.worker = await Tesseract.createWorker('eng', 1, {
          logger: (m: any) => {
            if (m.status === 'recognizing text') {
              // Only log progress at 25% intervals to avoid spam
              const pct = Math.round(m.progress * 100);
              if (pct % 25 === 0) {
                console.log(`[Tesseract] Recognizing... ${pct}%`);
              }
            }
          },
        });
        console.log('[Tesseract] OCR engine ready.');
      })();
    }

    await this.initializing;
    return this.worker!;
  }

  async processImage(imagePath: string, _viewLabel?: string): Promise<OcrResult> {
    const startTime = Date.now();

    // Get image dimensions for converting pixel bounding boxes to percentages
    const metadata = await sharp(imagePath).metadata();
    const imgWidth = metadata.width || 800;
    const imgHeight = metadata.height || 600;

    const worker = await this.ensureWorker();

    // Run Tesseract OCR
    const result = await worker.recognize(imagePath);

    // Convert Tesseract's word-level results into line-level results
    // Tesseract provides: paragraphs → lines → words
    const lines: OcrTextLine[] = [];

    const dataLines = (result.data as any).lines;
    if (dataLines && Array.isArray(dataLines)) {
      for (const line of dataLines) {
        const text = line.text.trim();
        if (!text || text.length < 2) continue; // Skip noise

        const bbox = line.bbox;
        const boundingBox: BoundingBox = {
          id: `bbox-${uuid().slice(0, 8)}`,
          x: (bbox.x0 / imgWidth) * 100,
          y: (bbox.y0 / imgHeight) * 100,
          w: ((bbox.x1 - bbox.x0) / imgWidth) * 100,
          h: ((bbox.y1 - bbox.y0) / imgHeight) * 100,
        };

        lines.push({
          text,
          confidence: line.confidence / 100, // Tesseract uses 0-100, we use 0-1
          boundingBox,
        });
      }
    }

    const rawText = lines.map(l => l.text).join('\n');
    const avgConfidence = lines.length > 0
      ? lines.reduce((sum, l) => sum + l.confidence, 0) / lines.length
      : 0;

    console.log(`[Tesseract] Extracted ${lines.length} text lines, avg confidence: ${(avgConfidence * 100).toFixed(1)}%, time: ${Date.now() - startTime}ms`);

    return {
      lines,
      rawText,
      averageConfidence: Math.round(avgConfidence * 1000) / 1000,
      processingTimeMs: Date.now() - startTime,
    };
  }
}
