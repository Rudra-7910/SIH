/**
 * PaddleOCR Adapter
 * 
 * Executes local PaddleOCR via Python runner script (`scripts/paddle_ocr.py`).
 * Returns standardized OcrResult with word/line bounding boxes and confidence scores.
 */

import { IOcrAdapter } from './IOcrAdapter';
import { OcrResult } from '../types';
import path from 'path';
import fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export class PaddleOcrAdapter implements IOcrAdapter {
  readonly adapterName = 'PaddleOCR (Deep Learning)';
  private pythonPath: string;
  private scriptPath: string;

  constructor() {
    // Look for workspace virtualenv python
    const venvPython = path.resolve(__dirname, '../../../../.venv/Scripts/python.exe');
    const systemPython = 'python';
    this.pythonPath = fs.existsSync(venvPython) ? venvPython : systemPython;
    this.scriptPath = path.resolve(__dirname, '../../scripts/paddle_ocr.py');
  }

  async processImage(imagePath: string): Promise<OcrResult> {
    const startTime = Date.now();

    if (!fs.existsSync(this.scriptPath)) {
      throw new Error(`PaddleOCR script not found at ${this.scriptPath}`);
    }

    try {
      const { stdout, stderr } = await execFileAsync(
        this.pythonPath,
        [this.scriptPath, imagePath],
        {
          maxBuffer: 10 * 1024 * 1024,
          timeout: 60000,
        }
      );

      // Find JSON line in stdout
      const lines = stdout.trim().split('\n');
      const jsonLine = lines.find(l => l.trim().startsWith('{') && l.trim().endsWith('}')) || lines[lines.length - 1];
      
      const parsed = JSON.parse(jsonLine);
      if (parsed.error) {
        throw new Error(parsed.error);
      }

      return {
        lines: parsed.lines || [],
        rawText: parsed.rawText || '',
        averageConfidence: parsed.averageConfidence || 0,
        processingTimeMs: parsed.processingTimeMs || (Date.now() - startTime),
      };
    } catch (err: any) {
      console.warn('[PaddleOCR] Inference error, falling back:', err?.message || err);
      throw err;
    }
  }
}
