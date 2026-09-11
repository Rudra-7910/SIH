/**
 * Frontend Types — mirrors backend types for API communication
 */

export interface BoundingBox {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface OcrTextLine {
  text: string;
  confidence: number;
  boundingBox: BoundingBox;
}

export interface OcrResult {
  lines: OcrTextLine[];
  rawText: string;
  averageConfidence: number;
  processingTimeMs: number;
}

export type FieldName = 'mrp' | 'net_quantity' | 'manufacturer' | 'consumer_care' | 'date_of_manufacture' | 'best_before' | 'country_of_origin' | 'generic_name';

export interface ExtractedField {
  fieldName: FieldName;
  displayName: string;
  value: string;
  confidence: number;
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  boundingBoxId: string;
  sourceView: string;
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
  submittedViews: ViewLabel[];
  viewRecommendations: string[];
}

export interface ProcessingStepStatus {
  step: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  detail?: string;
  durationMs?: number;
}

export interface DemoScenario {
  id: string;
  name: string;
  description: string;
  category: string;
  expectedOutcome: string;
}
