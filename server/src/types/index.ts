/**
 * Legal Metrology Inspection Assistant — Shared Types
 * 
 * ARCHITECTURAL DECISION: All types are defined in one place and imported
 * by both routes, services, and adapters. This ensures type consistency
 * across the entire backend pipeline.
 */

// ─── OCR Types ───────────────────────────────────────────────────────────────

export interface BoundingBox {
  id: string;
  /** X position as percentage of image width (0-100) */
  x: number;
  /** Y position as percentage of image height (0-100) */
  y: number;
  /** Width as percentage of image width */
  w: number;
  /** Height as percentage of image height */
  h: number;
}

export interface OcrTextLine {
  text: string;
  confidence: number; // 0.0 to 1.0
  boundingBox: BoundingBox;
}

export interface OcrResult {
  lines: OcrTextLine[];
  rawText: string;
  averageConfidence: number;
  processingTimeMs: number;
}

// ─── Field Extraction Types ──────────────────────────────────────────────────

export type FieldName = 'mrp' | 'net_quantity' | 'manufacturer' | 'consumer_care' | 'date_of_manufacture' | 'best_before' | 'country_of_origin' | 'generic_name';

export interface ExtractedField {
  fieldName: FieldName;
  displayName: string;
  value: string;
  confidence: number; // Inherited from OCR line confidence
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  boundingBoxId: string; // Links to the OCR bounding box that sourced this
  sourceView: string; // Which package view this was extracted from
}

// ─── Confidence Thresholds ───────────────────────────────────────────────────
/**
 * IMPORTANT: These are APPLICATION-LEVEL PROTOTYPE THRESHOLDS, NOT legal thresholds.
 * Confidence represents extraction reliability only.
 * Even HIGH confidence results must be available for officer verification.
 */
export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.90,
  MEDIUM: 0.70,
  // Anything below MEDIUM is LOW
} as const;

export function getConfidenceLevel(confidence: number): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (confidence >= CONFIDENCE_THRESHOLDS.HIGH) return 'HIGH';
  if (confidence >= CONFIDENCE_THRESHOLDS.MEDIUM) return 'MEDIUM';
  return 'LOW';
}

// ─── Rule Engine Types ───────────────────────────────────────────────────────

export interface RuleDefinition {
  ruleId: string;
  field: FieldName;
  required: boolean;
  category: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  version: string;
  effectiveFrom: string;
  isDemo: boolean; // Always true for prototype
  validationPattern?: string; // Optional regex for format validation
  validationDescription?: string;
}

export type RuleVerdict = 'PASS' | 'POTENTIAL_ISSUE' | 'NEEDS_REVIEW';

export interface RuleCheckResult {
  ruleId: string;
  field: FieldName;
  displayName: string;
  verdict: RuleVerdict;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
  extractedValue?: string;
  confidence?: number;
  confidenceLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
  boundingBoxId?: string;
}

// ─── Multi-View Types ────────────────────────────────────────────────────────

export type ViewLabel = 'front' | 'back' | 'left' | 'right';

export interface PackageView {
  viewLabel: ViewLabel;
  imagePath: string;
  originalImagePath: string;
  preprocessedImagePath: string;
  ocrResult: OcrResult;
  extractedFields: ExtractedField[];
  uploadedAt: string;
}

// ─── Inspection Session Types ────────────────────────────────────────────────

export type InspectionStatus = 'in_progress' | 'review' | 'completed';

export interface OfficerAction {
  actionId: string;
  type: 'confirm' | 'correct' | 'reject' | 'request_image' | 'remark';
  ruleId?: string;
  field?: FieldName;
  originalValue?: string;
  correctedValue?: string;
  remarks?: string;
  timestamp: string;
}

export interface AuditLogEntry {
  entryId: string;
  action: OfficerAction;
  officerName: string;
  timestamp: string;
}

export interface InspectionSession {
  sessionId: string;
  views: PackageView[];
  mergedFields: ExtractedField[];
  ruleResults: RuleCheckResult[];
  auditLog: AuditLogEntry[];
  status: InspectionStatus;
  createdAt: string;
  updatedAt: string;
  /** Tracks which views have been submitted */
  submittedViews: ViewLabel[];
  /** System recommendation messages */
  viewRecommendations: string[];
}

// ─── API Response Types ──────────────────────────────────────────────────────

export interface ProcessingStepStatus {
  step: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  detail?: string;
  durationMs?: number;
}

export interface UploadResponse {
  session: InspectionSession;
  processingSteps: ProcessingStepStatus[];
  currentView: PackageView;
}

export interface DemoScenario {
  id: string;
  name: string;
  description: string;
  category: string;
  expectedOutcome: string;
}
