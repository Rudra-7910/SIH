/**
 * Demo Scenario Routes
 * 
 * Provides pre-built demo scenarios that can be loaded instantly
 * without uploading actual images. Used for SIH judge demonstrations.
 */

import { Router, Request, Response } from 'express';
import { DemoScenario } from '../types';

const router = Router();

const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'good_package',
    name: '✅ Compliant Package',
    description: 'All required declarations (MRP, net quantity, manufacturer, consumer care) are clearly visible with high OCR confidence. All demo rules pass.',
    category: 'packaged_commodity',
    expectedOutcome: 'All rules PASS',
  },
  {
    id: 'low_confidence',
    name: '⚠️ Low OCR Confidence',
    description: 'MRP is detected but with low confidence (blurry/partially obscured text). System highlights it for officer review instead of auto-passing.',
    category: 'packaged_commodity',
    expectedOutcome: 'MRP rule → NEEDS_REVIEW due to low confidence',
  },
  {
    id: 'insufficient_coverage',
    name: '📷 Insufficient Image Coverage',
    description: 'Front-side photo only — MRP and manufacturer details are on the back. System recommends additional view instead of claiming declarations are absent.',
    category: 'packaged_commodity',
    expectedOutcome: 'Missing fields → "Additional view recommended" (NOT "missing")',
  },
  {
    id: 'missing_declaration',
    name: '🔴 Genuinely Missing Declaration',
    description: 'Multiple views submitted (front + back + left) but consumer care details are genuinely absent from the package. System flags for officer verification.',
    category: 'packaged_commodity',
    expectedOutcome: 'Consumer care → POTENTIAL_ISSUE after 3+ views',
  },
];

// ─── GET /api/demo/scenarios ────────────────────────────────────────────────
router.get('/scenarios', (_req: Request, res: Response) => {
  res.json({ scenarios: DEMO_SCENARIOS });
});

// ─── GET /api/demo/scenarios/:id ────────────────────────────────────────────
router.get('/scenarios/:id', (req: Request, res: Response) => {
  const scenario = DEMO_SCENARIOS.find(s => s.id === req.params.id);
  if (!scenario) {
    res.status(404).json({ error: 'Scenario not found' });
    return;
  }
  res.json({ scenario });
});

export default router;
