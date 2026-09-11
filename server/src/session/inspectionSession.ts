/**
 * Inspection Session Manager — SQLite Persistent Store
 * 
 * ARCHITECTURAL UPGRADE: Backed by SQLite (Node.js native SQLite database).
 * Inspections, views, OCR extractions, and officer actions survive server restarts.
 * 
 * Each inspection session tracks:
 * - Multiple package views (front, back, left, right)
 * - Merged fields across all views
 * - Rule engine results
 * - Officer audit log
 * - System recommendations about view coverage
 */

import { v4 as uuid } from 'uuid';
import {
  InspectionSession,
  PackageView,
  ExtractedField,
  RuleCheckResult,
  OfficerAction,
  AuditLogEntry,
  ViewLabel,
  FieldName,
  InspectionStatus,
} from '../types';
import { runRuleEngine } from '../rules/ruleEngine';
import { db } from '../db/sqliteDatabase';

interface SessionRow {
  session_id: string;
  status: string;
  submitted_views: string;
  view_recommendations: string;
  merged_fields: string;
  rule_results: string;
  created_at: string;
  updated_at: string;
}

interface ViewRow {
  id: string;
  session_id: string;
  view_label: string;
  image_path: string;
  original_image_path: string;
  preprocessed_image_path: string;
  ocr_result: string;
  extracted_fields: string;
  uploaded_at: string;
}

interface AuditRow {
  id: string;
  entry_id: string;
  session_id: string;
  officer_name: string;
  action_json: string;
  timestamp: string;
}

function rowToSession(
  row: SessionRow,
  views: PackageView[] = [],
  auditLog: AuditLogEntry[] = []
): InspectionSession {
  return {
    sessionId: row.session_id,
    status: row.status as InspectionStatus,
    submittedViews: JSON.parse(row.submitted_views || '[]'),
    viewRecommendations: JSON.parse(row.view_recommendations || '[]'),
    mergedFields: JSON.parse(row.merged_fields || '[]'),
    ruleResults: JSON.parse(row.rule_results || '[]'),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    views,
    auditLog,
  };
}

function fetchViewsForSession(sessionId: string): PackageView[] {
  const stmt = db.prepare(
    'SELECT * FROM package_views WHERE session_id = ? ORDER BY uploaded_at ASC'
  );
  const rows = stmt.all(sessionId) as unknown as ViewRow[];
  return rows.map(r => ({
    viewLabel: r.view_label as ViewLabel,
    imagePath: r.image_path,
    originalImagePath: r.original_image_path,
    preprocessedImagePath: r.preprocessed_image_path,
    ocrResult: JSON.parse(r.ocr_result || '{}'),
    extractedFields: JSON.parse(r.extracted_fields || '[]'),
    uploadedAt: r.uploaded_at,
  }));
}

function fetchAuditLogForSession(sessionId: string): AuditLogEntry[] {
  const stmt = db.prepare(
    'SELECT * FROM audit_logs WHERE session_id = ? ORDER BY timestamp ASC'
  );
  const rows = stmt.all(sessionId) as unknown as AuditRow[];
  return rows.map(r => ({
    entryId: r.entry_id,
    officerName: r.officer_name,
    action: JSON.parse(r.action_json),
    timestamp: r.timestamp,
  }));
}

export function createSession(): InspectionSession {
  const sessionId = uuid();
  const now = new Date().toISOString();

  const insert = db.prepare(`
    INSERT INTO inspection_sessions (
      session_id, status, submitted_views, view_recommendations,
      merged_fields, rule_results, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insert.run(
    sessionId,
    'in_progress',
    JSON.stringify([]),
    JSON.stringify([]),
    JSON.stringify([]),
    JSON.stringify([]),
    now,
    now
  );

  return {
    sessionId,
    views: [],
    mergedFields: [],
    ruleResults: [],
    auditLog: [],
    status: 'in_progress',
    createdAt: now,
    updatedAt: now,
    submittedViews: [],
    viewRecommendations: [],
  };
}

export function getSession(sessionId: string): InspectionSession | undefined {
  const stmt = db.prepare(
    'SELECT * FROM inspection_sessions WHERE session_id = ?'
  );
  const row = stmt.get(sessionId) as unknown as SessionRow | undefined;
  if (!row) return undefined;

  const views = fetchViewsForSession(sessionId);
  const auditLog = fetchAuditLogForSession(sessionId);
  return rowToSession(row, views, auditLog);
}

/**
 * Add a new view to an inspection session, merge fields, and re-run rules.
 */
export function addViewToSession(
  sessionId: string,
  view: PackageView
): InspectionSession {
  const session = getSession(sessionId);
  if (!session) throw new Error(`Session ${sessionId} not found`);

  // Insert package_view
  const viewId = uuid();
  const insertView = db.prepare(`
    INSERT INTO package_views (
      id, session_id, view_label, image_path, original_image_path,
      preprocessed_image_path, ocr_result, extracted_fields, uploaded_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertView.run(
    viewId,
    sessionId,
    view.viewLabel,
    view.imagePath,
    view.originalImagePath,
    view.preprocessedImagePath,
    JSON.stringify(view.ocrResult),
    JSON.stringify(view.extractedFields),
    view.uploadedAt
  );

  // Update in-memory views list for computation
  session.views.push(view);
  if (!session.submittedViews.includes(view.viewLabel)) {
    session.submittedViews.push(view.viewLabel);
  }

  // Merge fields across all views
  session.mergedFields = mergeFields(session.views);

  // Re-run rule engine with merged fields
  session.ruleResults = runRuleEngine(session.mergedFields, session.submittedViews);

  // Generate view recommendations
  session.viewRecommendations = generateRecommendations(session);

  // Update status
  const hasIssues = session.ruleResults.some(
    r => r.verdict === 'NEEDS_REVIEW' || r.verdict === 'POTENTIAL_ISSUE'
  );
  session.status = hasIssues ? 'review' : 'in_progress';
  session.updatedAt = new Date().toISOString();

  // Save session updates
  const updateSession = db.prepare(`
    UPDATE inspection_sessions SET
      status = ?,
      submitted_views = ?,
      view_recommendations = ?,
      merged_fields = ?,
      rule_results = ?,
      updated_at = ?
    WHERE session_id = ?
  `);
  updateSession.run(
    session.status,
    JSON.stringify(session.submittedViews),
    JSON.stringify(session.viewRecommendations),
    JSON.stringify(session.mergedFields),
    JSON.stringify(session.ruleResults),
    session.updatedAt,
    sessionId
  );

  return session;
}

/**
 * Merge extracted fields across all views.
 * If the same field is found in multiple views, keep the one with higher confidence.
 */
function mergeFields(views: PackageView[]): ExtractedField[] {
  const fieldMap = new Map<FieldName, ExtractedField>();

  for (const view of views) {
    for (const field of view.extractedFields) {
      const existing = fieldMap.get(field.fieldName);
      if (!existing || field.confidence > existing.confidence) {
        fieldMap.set(field.fieldName, field);
      }
    }
  }

  return Array.from(fieldMap.values());
}

/**
 * Generate view coverage recommendations.
 * IMPORTANT: We never say a declaration is "missing" from one image.
 */
function generateRecommendations(session: InspectionSession): string[] {
  const recommendations: string[] = [];
  const viewCount = session.submittedViews.length;

  // Check for required fields not yet found
  const needsReviewResults = session.ruleResults.filter(
    r => r.verdict === 'NEEDS_REVIEW' && !r.extractedValue
  );

  if (needsReviewResults.length > 0 && viewCount < 3) {
    const fieldNames = needsReviewResults.map(r => r.displayName).join(', ');
    recommendations.push(
      `Additional package view recommended. The following declaration(s) were not detected in the submitted view(s): ${fieldNames}.`
    );

    // Suggest which views to add
    const missingViews: ViewLabel[] = (['front', 'back', 'left', 'right'] as ViewLabel[])
      .filter(v => !session.submittedViews.includes(v));
    if (missingViews.length > 0) {
      recommendations.push(
        `Consider capturing the ${missingViews.slice(0, 2).join(' or ')} of the package.`
      );
    }
  }

  // Don't keep asking forever — if 3+ views submitted, give final recommendation
  if (needsReviewResults.length > 0 && viewCount >= 3) {
    recommendations.push(
      'Multiple views submitted. Any remaining undetected declarations require officer verification on the physical package.'
    );
  }

  return recommendations;
}

/**
 * Record an officer action in the audit log.
 */
export function addOfficerAction(
  sessionId: string,
  action: OfficerAction,
  officerName: string = 'Demo Officer'
): InspectionSession {
  const session = getSession(sessionId);
  if (!session) throw new Error(`Session ${sessionId} not found`);

  const entryId = uuid();
  const now = new Date().toISOString();
  const entry: AuditLogEntry = {
    entryId,
    action,
    officerName,
    timestamp: now,
  };

  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (id, entry_id, session_id, officer_name, action_json, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertAudit.run(
    uuid(),
    entryId,
    sessionId,
    officerName,
    JSON.stringify(action),
    now
  );

  session.auditLog.push(entry);

  // If officer corrects a value, update the merged fields
  if (action.type === 'correct' && action.field && action.correctedValue) {
    const field = session.mergedFields.find(f => f.fieldName === action.field);
    if (field) {
      field.value = action.correctedValue;
      field.confidence = 1.0; // Officer-verified
      field.confidenceLevel = 'HIGH';
    } else {
      // Officer is adding a field that OCR didn't detect
      session.mergedFields.push({
        fieldName: action.field,
        displayName: action.field,
        value: action.correctedValue,
        confidence: 1.0,
        confidenceLevel: 'HIGH',
        boundingBoxId: 'officer-manual',
        sourceView: 'officer-review',
      });
    }

    // Re-run rules after correction
    session.ruleResults = runRuleEngine(session.mergedFields, session.submittedViews);
  }

  session.updatedAt = now;

  const updateSession = db.prepare(`
    UPDATE inspection_sessions SET
      merged_fields = ?,
      rule_results = ?,
      updated_at = ?
    WHERE session_id = ?
  `);
  updateSession.run(
    JSON.stringify(session.mergedFields),
    JSON.stringify(session.ruleResults),
    session.updatedAt,
    sessionId
  );

  return session;
}

/**
 * Mark session as completed.
 */
export function completeSession(sessionId: string): InspectionSession {
  const session = getSession(sessionId);
  if (!session) throw new Error(`Session ${sessionId} not found`);
  
  session.status = 'completed';
  session.updatedAt = new Date().toISOString();

  const updateSession = db.prepare(`
    UPDATE inspection_sessions SET
      status = ?,
      updated_at = ?
    WHERE session_id = ?
  `);
  updateSession.run(session.status, session.updatedAt, sessionId);

  return session;
}

/**
 * Get all sessions (for dashboard listing).
 */
export function getAllSessions(): InspectionSession[] {
  const stmt = db.prepare(
    'SELECT * FROM inspection_sessions ORDER BY created_at DESC'
  );
  const rows = stmt.all() as unknown as SessionRow[];
  return rows.map(r => {
    const views = fetchViewsForSession(r.session_id);
    const auditLog = fetchAuditLogForSession(r.session_id);
    return rowToSession(r, views, auditLog);
  });
}
