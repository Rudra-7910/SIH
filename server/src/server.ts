/**
 * Legal Metrology Inspection Assistant — Server
 * 
 * PROTOTYPE DEMO SERVER
 * This is a demonstration server for SIH judging, not a production system.
 * 
 * Key architectural decisions:
 * - No database: in-memory sessions (sufficient for demo)
 * - No auth: demo mode, officer identity is simulated
 * - Mock OCR default: always works without PaddleOCR dependencies
 * - Static file serving: uploads directory for processed images
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import inspectionRoutes from './routes/inspection';
import demoRoutes from './routes/demo';

// Load .env if present
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath) && typeof (process as any).loadEnvFile === 'function') {
  (process as any).loadEnvFile(envPath);
}

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve uploaded images
const uploadsDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// ─── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/inspection', inspectionRoutes);
app.use('/api/demo', demoRoutes);

// ─── Serve React frontend build (production) ─────────────────────────────────
// When deployed on Railway/VPS, serve the pre-built client from server/public/
const clientBuildDir = path.resolve(__dirname, '../public');
if (fs.existsSync(clientBuildDir)) {
  app.use(express.static(clientBuildDir));
  // SPA fallback — return index.html for any non-API route
  app.get('*', (_req, res) => {
    const indexPath = path.join(clientBuildDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Client build not found. Run: npm run build:full');
    }
  });
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Legal Metrology Inspection Assistant — API',
    mode: process.env.OCR_MODE || 'mock',
    timestamp: new Date().toISOString(),
    disclaimer: 'This is a prototype demo. AI assists detection; officer makes final decision.',
  });
});

// ─── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║   Legal Metrology Inspection Assistant — API Server         ║');
  console.log('║   PROTOTYPE DEMO (Not a production system)                  ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║   Server running on: http://localhost:${PORT}                   ║`);
  console.log(`║   OCR Mode: ${(process.env.OCR_MODE || 'mock').padEnd(47)}║`);
  console.log('║   AI assists detection; officer makes final decision.       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
});
