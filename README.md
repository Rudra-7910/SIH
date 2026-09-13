# ⚖️ SIH — Legal Metrology Inspection Assistant

> **Smart India Hackathon 2026 · Problem Statement SIH 26034**
> AI-powered statutory label verification for Legal Metrology Officers under the **Packaged Commodities Rules, 2011**.

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-Prototype-orange)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Demo Scenarios](#demo-scenarios)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Disclaimer](#disclaimer)

---

## Overview

Field inspection officers photograph a packaged commodity. **SHI** automates the detection and verification of mandatory statutory declarations on product labels — reducing manual inspection time and improving compliance accuracy.

### How It Works

1. 📸 **Image Capture** — Upload a photo or use the live camera feed
2. 🔍 **OCR Processing** — Deep-learning OCR engine extracts all visible text from the label
3. 📊 **Field Extraction** — Maps detected text to 6 mandatory declarations using 40+ regex patterns
4. ⚖️ **Rule Engine** — Deterministic compliance checks against the Legal Metrology Act, 2009
5. 🚨 **Issue Flagging** — Flags violations with severity level, rule citation, and confidence score
6. 👮 **Officer Review** — Human-in-the-loop: confirm, correct, reject, or request additional views
7. 📄 **Dossier Generation** — Form-IV style PDF inspection report with complete audit trail

> **Key Principle:** AI assists detection — the authorised officer makes all final decisions. The rule engine is entirely deterministic: no LLM, no hallucinations. Every finding has a rule ID, severity, and reason.

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Multi-Engine OCR** | PaddleOCR (deep learning), Tesseract.js (offline), and Mock OCR for demos |
| **6 Mandatory Declarations** | MRP, Net Quantity, Manufacturer, Date of Manufacture, Consumer Care, Country of Origin |
| **Deterministic Rule Engine** | Statutory compliance checks with PASS / POTENTIAL_ISSUE / NEEDS_REVIEW verdicts |
| **Multi-View Tracking** | Tracks front/back/left/right package views; prompts for missing angles |
| **Interactive Bounding Boxes** | Click a declaration to highlight its location on the package image |
| **Officer Review Panel** | Confirm, correct values, reject findings, add remarks — full audit logging |
| **Confidence Scoring** | OCR results carry confidence scores; anything below 70% is auto-flagged |
| **PDF Dossier Export** | Form-IV format inspection report with audit log and violation summary |
| **Inspection History** | Browse past sessions with pass/fail badges; 1-click reopen |
| **Mobile Ready** | Responsive design; LAN-accessible for on-device mobile testing |
| **Offline Queue** | Queues inspections when offline; syncs when connection is restored |
| **Fully Offline** | No API keys, no database, no cloud services required |

---

## Tech Stack

### Frontend

| Technology | Purpose |
|-----------|---------|
| **React 18** | Component-based UI |
| **Vite 5** | Dev server & build tool |
| **TypeScript 5.6** | Type safety |
| **Tailwind CSS 3.4** | Utility-first styling |
| **Lucide React** | Icon system |
| **jsPDF + AutoTable** | Client-side PDF generation |
| **IndexedDB (idb)** | Offline inspection queue |
| **Axios** | HTTP client |

### Backend

| Technology | Purpose |
|-----------|---------|
| **Node.js + Express** | REST API server |
| **TypeScript + tsx** | Runtime & hot-reload |
| **Sharp** | Image preprocessing (greyscale, contrast, sharpening) |
| **Tesseract.js 7** | Local OCR engine |
| **Multer** | File upload handling |
| **UUID** | Session ID generation |

---

## Quick Start

**Requirements:** Node.js 18+

### One-Command Start

```bash
# Windows
start.bat

# macOS / Linux
chmod +x start.sh && ./start.sh
```

### Manual Start (Two Terminals)

```bash
# Terminal 1 — Install & start API server (port 3001)
cd server && npm install && npm run dev

# Terminal 2 — Install & start frontend (port 5173)
cd client && npm install && npm run dev
```

Then open **http://localhost:5173** in your browser.

> 💡 **Mobile Testing:** The Vite dev server binds to `0.0.0.0`, so you can access the app from any device on your LAN at `http://<your-ip>:5173`.

---

## Demo Scenarios

Four pre-built scenarios showcase different inspection outcomes — no real images needed:

| Scenario | What It Demonstrates |
|----------|---------------------|
| ✅ **Compliant Package** | All 6 mandatory declarations detected at high confidence. All rules pass. |
| ⚠️ **Low OCR Confidence** | MRP detected at 58% confidence — auto-flagged for officer review. |
| 📷 **Insufficient Coverage** | Front-only photo. System requests additional view — does NOT claim MRP is absent. |
| 🔴 **Missing Declaration** | 3 views submitted. Consumer care genuinely absent. Officer verification required. |

Select a scenario from the **Demo Scenario Selector** on the dashboard to run it instantly.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    CLIENT (React + Vite)                  │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐  ┌─────────┐ │
│  │  Image   │  │Declaration│  │   Rule    │  │ Officer │ │
│  │  Upload  │  │  Table   │  │  Results  │  │ Review  │ │
│  └────┬─────┘  └──────────┘  └───────────┘  └─────────┘ │
│       │                                                   │
│       ▼                                                   │
│  ┌──────────────────────────────────────────────────────┐ │
│  │            Inspection Dashboard (Orchestrator)        │ │
│  └──────────────────────┬───────────────────────────────┘ │
└─────────────────────────┼────────────────────────────────┘
                          │ REST API (Axios)
┌─────────────────────────┼────────────────────────────────┐
│                    SERVER (Express)                       │
│                         ▼                                 │
│  ┌─────────────────────────────────────────────────────┐ │
│  │          Image Preprocessor (Sharp)                  │ │
│  │  Resize · Greyscale · Contrast · Edge Sharpening     │ │
│  └──────────────────────┬──────────────────────────────┘ │
│                         ▼                                 │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              OCR Router (IOcrAdapter)                 │ │
│  │  PaddleOCR (DL) │ Tesseract.js │ Mock (Demo)         │ │
│  └──────────────────────┬──────────────────────────────┘ │
│                         ▼                                 │
│  ┌─────────────────────────────────────────────────────┐ │
│  │          Field Extractor (40+ Regex Patterns)        │ │
│  │  MRP · Net Qty · Mfg · Date · Care · Origin          │ │
│  └──────────────────────┬──────────────────────────────┘ │
│                         ▼                                 │
│  ┌─────────────────────────────────────────────────────┐ │
│  │       Rule Engine (Deterministic Verdicts)           │ │
│  │  PASS · POTENTIAL_ISSUE · NEEDS_REVIEW                │ │
│  └──────────────────────┬──────────────────────────────┘ │
│                         ▼                                 │
│  ┌─────────────────────────────────────────────────────┐ │
│  │    Session Store (In-Memory) + Audit Logger           │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
SHI/
├── client/                          # Frontend Application
│   ├── src/
│   │   ├── pages/
│   │   │   └── InspectionDashboard.tsx    # Main orchestrator page
│   │   ├── components/
│   │   │   ├── Header.tsx                 # App header with nav & disclaimer
│   │   │   ├── ImageUpload.tsx            # Drag-drop + camera capture
│   │   │   ├── PackageImageViewer.tsx     # Image preview with bounding boxes
│   │   │   ├── DeclarationTable.tsx       # Extracted fields table
│   │   │   ├── ConfidenceBadge.tsx        # Color-coded confidence indicator
│   │   │   ├── RuleResultsPanel.tsx       # Rule verdicts display
│   │   │   ├── OfficerReviewPanel.tsx     # Human-in-the-loop review modal
│   │   │   ├── InspectionSummary.tsx      # Final verdict & report export
│   │   │   ├── InspectionHistory.tsx      # Past sessions browser
│   │   │   ├── DemoScenarioSelector.tsx   # Quick demo scenario cards
│   │   │   ├── MultiViewTracker.tsx       # Package face tracker
│   │   │   ├── ProcessingStatus.tsx       # OCR processing indicator
│   │   │   ├── WorkflowGuide.tsx          # Step-by-step usage guide
│   │   │   └── ArchitectureModal.tsx      # System architecture viewer
│   │   ├── lib/
│   │   │   └── offlineQueue.ts            # IndexedDB offline sync
│   │   ├── utils/
│   │   │   └── pdfGenerator.ts            # Form-IV PDF builder
│   │   ├── types/index.ts                 # Shared TypeScript definitions
│   │   ├── App.tsx                        # App root
│   │   ├── main.tsx                       # Entry point
│   │   └── index.css                      # Global styles & animations
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
│
├── server/                          # Backend API
│   ├── src/
│   │   ├── server.ts                      # Express app entry point
│   │   ├── routes/
│   │   │   ├── inspection.ts              # Session CRUD & image processing
│   │   │   └── demo.ts                    # Demo scenario endpoints
│   │   ├── ocr/
│   │   │   ├── IOcrAdapter.ts             # OCR engine interface
│   │   │   ├── MockOcrAdapter.ts          # Deterministic demo OCR
│   │   │   └── TesseractOcrAdapter.ts     # Real local OCR
│   │   ├── extraction/
│   │   │   └── fieldExtractor.ts          # Regex-based field parser
│   │   ├── preprocessing/
│   │   │   └── imagePreprocessor.ts       # Sharp image pipeline
│   │   ├── rules/
│   │   │   ├── ruleEngine.ts              # Compliance rule evaluator
│   │   │   └── demo-rules.json            # Statutory rule definitions
│   │   ├── session/
│   │   │   └── inspectionSession.ts       # In-memory session store
│   │   ├── db/                            # Data persistence layer
│   │   └── types/index.ts                 # Server-side type definitions
│   ├── scripts/                           # Utility scripts
│   └── package.json
│
├── start.bat                        # One-click Windows startup
├── start.sh                         # One-click Unix startup
└── README.md
```

---

## API Reference

**Base URL:** `http://localhost:3001/api` (proxied via Vite at `http://localhost:5173/api`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/inspection/start` | Create a new inspection session |
| `POST` | `/api/inspection/:id/upload` | Upload an image for OCR processing |
| `GET` | `/api/inspection/:id` | Fetch full session state |
| `GET` | `/api/inspection` | List all stored sessions |
| `POST` | `/api/inspection/:id/review` | Submit officer review action |
| `POST` | `/api/inspection/:id/complete` | Finalize inspection session |
| `GET` | `/api/demo/scenarios` | List available demo scenarios |

### Upload Request

```bash
curl -X POST http://localhost:3001/api/inspection/{sessionId}/upload \
  -F "image=@package_photo.jpg" \
  -F "viewLabel=front" \
  -F "scenarioId=compliant"   # optional — triggers mock OCR
```

### Review Actions

| Action | Description |
|--------|-------------|
| `CONFIRM` | Officer confirms the AI-detected finding |
| `CORRECT` | Officer corrects a value detected by OCR |
| `REJECT` | Officer rejects a false positive |
| `REQUEST_IMAGE` | Officer requests an additional package view |
| `REMARKS` | Officer adds free-text remarks |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OCR_MODE` | `mock` | OCR engine: `mock` · `tesseract` · `paddle` |
| `PORT` | `3001` | Backend API port |
| `PADDLE_OCR_URL` | `http://localhost:8100` | PaddleOCR service endpoint (if using paddle mode) |

Copy `.env.example` → `.env` to customise:

```bash
cp server/.env.example server/.env
```

---

## OCR Engines

| Engine | Technology | Best For |
|--------|-----------|----------|
| **PaddleOCR** | PP-OCR deep neural network (DBNet + CRNN) via local Python | Real package photos, production use |
| **Tesseract.js** | Runs entirely in Node.js, zero Python dependency | Offline fallback, quick setup |
| **Mock OCR** | Pre-built results for 4 demo scenarios, 100% predictable | Hackathon demos, testing |

Switch engines from the **dashboard header** dropdown before uploading an image.

---

## Deployment

### Production Build

```bash
# Build full-stack (React + Express bundled into single server)
cd server
npm run build:full

# Start production server (serves frontend + API on port 3001)
npm start
```

### Docker & Railway

One-command Docker build and Railway deployment are supported. See `server/railway.json` for Railway configuration.

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Disclaimer

> ⚠️ **Prototype for SIH evaluation.** This is not a production legal enforcement system. AI assists detection — the authorised officer makes all final decisions. Demo rules are illustrative and do not constitute legal advice.

---

<p align="center">
  Built with ❤️ for <strong>Smart India Hackathon 2024</strong>
</p>
