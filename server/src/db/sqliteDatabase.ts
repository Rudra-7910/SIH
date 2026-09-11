import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'inspections.db');
export const db = new DatabaseSync(dbPath);

// Enable WAL mode for high concurrency
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS inspection_sessions (
    session_id TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    submitted_views TEXT NOT NULL,
    view_recommendations TEXT NOT NULL,
    merged_fields TEXT NOT NULL,
    rule_results TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS package_views (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    view_label TEXT NOT NULL,
    image_path TEXT NOT NULL,
    original_image_path TEXT NOT NULL,
    preprocessed_image_path TEXT NOT NULL,
    ocr_result TEXT NOT NULL,
    extracted_fields TEXT NOT NULL,
    uploaded_at TEXT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES inspection_sessions(session_id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    entry_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    officer_name TEXT NOT NULL,
    action_json TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES inspection_sessions(session_id) ON DELETE CASCADE
  );
`);
