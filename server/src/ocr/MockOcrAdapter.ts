/**
 * Mock OCR Adapter
 * 
 * PURPOSE: Provides realistic OCR results for demo scenarios without requiring
 * PaddleOCR or any Python dependencies. This ensures the demo ALWAYS works.
 * 
 * DESIGN: Returns pre-built OCR results with realistic bounding box positions,
 * text content, and confidence scores. For user-uploaded images (non-demo),
 * returns a generic "good package" result so the full pipeline still works.
 * 
 * HONESTY: This is clearly a mock. We do not claim these are real OCR results.
 * The demo UI labels this as "Mock OCR Mode" when active.
 */

import { IOcrAdapter } from './IOcrAdapter';
import { OcrResult, OcrTextLine, BoundingBox } from '../types';
import { v4 as uuid } from 'uuid';

// ─── Pre-built demo OCR results ─────────────────────────────────────────────

function makeBBox(x: number, y: number, w: number, h: number): BoundingBox {
  return { id: `bbox-${uuid().slice(0, 8)}`, x, y, w, h };
}

function makeLine(text: string, confidence: number, bbox: BoundingBox): OcrTextLine {
  return { text, confidence, boundingBox: bbox };
}

/**
 * Scenario 1: GOOD PACKAGE — All declarations clearly visible, high confidence
 */
const GOOD_PACKAGE_OCR: OcrTextLine[] = [
  makeLine('TATA PREMIUM TEA', 0.98, makeBBox(15, 5, 70, 8)),
  makeLine('Net Weight: 250 g', 0.97, makeBBox(10, 65, 35, 6)),
  makeLine('MRP ₹185.00 (Inclusive of all taxes)', 0.96, makeBBox(50, 65, 45, 7)),
  makeLine('Manufactured by: Tata Consumer Products Ltd.', 0.95, makeBBox(8, 75, 55, 5)),
  makeLine('Address: House of Tata, Kolkata 700071, West Bengal, India', 0.93, makeBBox(8, 80, 60, 5)),
  makeLine('Consumer Care: 1800-209-6060', 0.94, makeBBox(8, 86, 40, 5)),
  makeLine('Email: consumer.care@tataconsumer.com', 0.92, makeBBox(8, 91, 45, 5)),
  makeLine('Date of Mfg: 07/2026', 0.95, makeBBox(55, 75, 25, 5)),
  makeLine('Best Before: 12 months from Mfg', 0.94, makeBBox(55, 80, 30, 5)),
  makeLine('Country of Origin: India', 0.97, makeBBox(55, 86, 25, 5)),
  makeLine('FSSAI Lic: 10012021000349', 0.91, makeBBox(55, 91, 30, 5)),
];

/**
 * Scenario 2: LOW CONFIDENCE — MRP detected but with poor OCR confidence
 * Simulates a blurry or partially obscured MRP label
 */
const LOW_CONFIDENCE_OCR: OcrTextLine[] = [
  makeLine('SUNRISE JUICE', 0.96, makeBBox(20, 8, 60, 10)),
  makeLine('Net Content: 500 ml', 0.93, makeBBox(12, 62, 30, 6)),
  // MRP with deliberately low confidence (simulating blurry text)
  makeLine('MRP Rs.65.OO incl taxes', 0.58, makeBBox(48, 62, 40, 7)),
  makeLine('Mfg by: Sunrise Beverages Pvt Ltd', 0.91, makeBBox(10, 72, 50, 5)),
  makeLine('Plot 42, Industrial Area, Phase II, Gurgaon 122001', 0.88, makeBBox(10, 77, 55, 5)),
  makeLine('Customer Care: 1800-123-4567', 0.90, makeBBox(10, 84, 38, 5)),
  makeLine('Mfg Date: 06/2026', 0.72, makeBBox(55, 72, 25, 5)),
  makeLine('Best Before: 6 months', 0.70, makeBBox(55, 77, 22, 5)),
];

/**
 * Scenario 3: INSUFFICIENT COVERAGE — Front view only, no MRP visible
 * MRP is typically on the back/side of this package
 */
const FRONT_ONLY_OCR: OcrTextLine[] = [
  makeLine('ROYAL GOLD BASMATI RICE', 0.97, makeBBox(15, 10, 70, 12)),
  makeLine('Premium Quality', 0.94, makeBBox(25, 25, 50, 6)),
  makeLine('Net Weight: 1 kg', 0.96, makeBBox(30, 78, 40, 7)),
  makeLine('Product of India', 0.95, makeBBox(32, 87, 36, 5)),
  // Note: No MRP, no manufacturer, no consumer care — they're on the back
];

/**
 * Scenario 3 (additional view): Back view with MRP and other details
 */
const BACK_VIEW_OCR: OcrTextLine[] = [
  makeLine('MRP ₹120.00 (Inclusive of all taxes)', 0.95, makeBBox(12, 10, 50, 7)),
  makeLine('Packed by: Royal Foods India Pvt. Ltd.', 0.93, makeBBox(10, 22, 55, 5)),
  makeLine('Survey No. 45, Karnal, Haryana 132001', 0.91, makeBBox(10, 28, 50, 5)),
  makeLine('Consumer Helpline: 1800-111-2233', 0.92, makeBBox(10, 38, 40, 5)),
  makeLine('Email: care@royalfoods.in', 0.90, makeBBox(10, 44, 35, 5)),
  makeLine('Mfg Date: 08/2026', 0.94, makeBBox(10, 54, 25, 5)),
  makeLine('Best Before: 18 months from packaging', 0.93, makeBBox(10, 60, 40, 5)),
  makeLine('FSSAI: 10721042000218', 0.89, makeBBox(10, 70, 30, 5)),
];

/**
 * Scenario 4: GENUINELY MISSING — Multiple views submitted, declaration still not found
 * This package is actually missing consumer care info
 */
const MISSING_DECLARATION_FRONT: OcrTextLine[] = [
  makeLine('SPARKLE DETERGENT POWDER', 0.96, makeBBox(12, 8, 75, 10)),
  makeLine('Net Weight: 500 g', 0.95, makeBBox(15, 70, 30, 6)),
  makeLine('MRP ₹45.00 (Incl. of all taxes)', 0.94, makeBBox(48, 70, 42, 6)),
];

const MISSING_DECLARATION_BACK: OcrTextLine[] = [
  makeLine('Manufactured by: Sparkle Home Products', 0.93, makeBBox(10, 15, 55, 5)),
  makeLine('123 Sector 5, Noida, UP 201301', 0.90, makeBBox(10, 21, 45, 5)),
  makeLine('Mfg Date: 05/2026', 0.92, makeBBox(10, 32, 25, 5)),
  makeLine('Best Before: 24 months from Mfg', 0.91, makeBBox(10, 38, 40, 5)),
  makeLine('Country of Origin: India', 0.95, makeBBox(10, 48, 28, 5)),
  // Note: NO consumer care details anywhere — genuinely missing
];

const MISSING_DECLARATION_LEFT: OcrTextLine[] = [
  makeLine('Ingredients: Sodium Linear Alkylbenzene Sulfonate', 0.88, makeBBox(10, 15, 75, 5)),
  makeLine('Sodium Tripolyphosphate, Sodium Carbonate', 0.86, makeBBox(10, 22, 60, 5)),
  makeLine('Optical Brightener, Fragrance', 0.87, makeBBox(10, 29, 45, 5)),
  makeLine('Keep away from children', 0.92, makeBBox(10, 60, 35, 5)),
];

/** Scenario map keyed by "scenarioId:viewLabel" */
const SCENARIO_OCR_MAP: Record<string, OcrTextLine[]> = {
  'good_package:front': GOOD_PACKAGE_OCR,
  'low_confidence:front': LOW_CONFIDENCE_OCR,
  'insufficient_coverage:front': FRONT_ONLY_OCR,
  'insufficient_coverage:back': BACK_VIEW_OCR,
  'missing_declaration:front': MISSING_DECLARATION_FRONT,
  'missing_declaration:back': MISSING_DECLARATION_BACK,
  'missing_declaration:left': MISSING_DECLARATION_LEFT,
};

/**
 * For user-uploaded images (non-demo), return the good package result
 * so the pipeline demonstrates correctly
 */
const DEFAULT_OCR = GOOD_PACKAGE_OCR;

export class MockOcrAdapter implements IOcrAdapter {
  readonly adapterName = 'Mock OCR (Demo Mode)';

  private scenarioId: string | null = null;

  /** Set the active demo scenario so we return the right mock data */
  setScenario(scenarioId: string): void {
    this.scenarioId = scenarioId;
  }

  async processImage(imagePath: string, viewLabel?: string): Promise<OcrResult> {
    const startTime = Date.now();

    // Simulate processing delay (200-600ms) to feel realistic
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 400));

    // Look up the appropriate mock data
    let lines: OcrTextLine[];
    const key = this.scenarioId && viewLabel 
      ? `${this.scenarioId}:${viewLabel}` 
      : null;

    if (key && SCENARIO_OCR_MAP[key]) {
      // Deep clone to avoid mutating the template and regenerate IDs
      lines = SCENARIO_OCR_MAP[key].map(line => ({
        ...line,
        boundingBox: { ...line.boundingBox, id: `bbox-${uuid().slice(0, 8)}` }
      }));
    } else {
      // Default: return good package result for any uploaded image
      lines = DEFAULT_OCR.map(line => ({
        ...line,
        boundingBox: { ...line.boundingBox, id: `bbox-${uuid().slice(0, 8)}` }
      }));
    }

    const rawText = lines.map(l => l.text).join('\n');
    const avgConfidence = lines.length > 0
      ? lines.reduce((sum, l) => sum + l.confidence, 0) / lines.length
      : 0;

    return {
      lines,
      rawText,
      averageConfidence: Math.round(avgConfidence * 1000) / 1000,
      processingTimeMs: Date.now() - startTime,
    };
  }
}
