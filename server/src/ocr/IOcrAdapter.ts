/**
 * OCR Adapter Interface
 * 
 * ARCHITECTURAL DECISION: All OCR implementations must conform to this interface.
 * This allows swapping between MockOCR (for demos) and PaddleOCR (for production)
 * without changing any other code. The adapter is selected via the OCR_MODE env var.
 */

import { OcrResult } from '../types';

export interface IOcrAdapter {
  /**
   * Process an image and return OCR results with text, bounding boxes, and confidence.
   * @param imagePath - Absolute path to the preprocessed image file
   * @returns OCR result with text lines, bounding boxes, and confidence scores
   */
  processImage(imagePath: string): Promise<OcrResult>;

  /** Human-readable name of this adapter for logging/display */
  readonly adapterName: string;
}
