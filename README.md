# Legal Metrology Inspection Assistant

> **Prototype — Smart India Hackathon 2024 · Problem Statement SIH 26034**
> AI-assisted statutory label verification for Legal Metrology Officers under the Packaged Commodities Rules, 2011.

---

## What It Does

Field inspection officers photograph a packaged commodity. The system:

1. **Runs OCR** to detect all text on the label (PaddleOCR deep learning engine or Tesseract.js)
2. **Extracts mandatory declarations** — MRP, Net Quantity, Manufacturer, Date of Manufacture, Consumer Care, Country of Origin — mapped to their statutory rule reference (Rule 6, PCR 2011)
3. **Checks each declaration** against a deterministic rule engine based on the Legal Metrology Act, 2009
4. **Flags issues** for officer review with severity, rule citation, and confidence score
5. **Generates inspection dossiers** — Form-IV style PDF report and show-cause notice

The officer makes every final decision. AI assists detection, not adjudication.

---

## Quick Start

**Requirements:** Node.js 18+

```bash
# 1. Install dependencies
cd server && npm install
cd ../client && npm install

# 2. Start (Windows)
cd ..
start.bat

# 3. Open
# http://localhost:5173
```

**Manual start (two terminals):**

```bash
# Terminal 1 — API server (port 3001)
cd server && npm run dev

# Terminal 2 — Frontend (port 5173)
cd client && npm run dev
```

No API keys, no database, no cloud services required. Runs fully offline.

---

## OCR Engines

| Engine | How it works | When to use |
|--------|-------------|-------------|
| **PaddleOCR** (default) | PP-OCR deep neural network (DBNet + CRNN). Runs via local Python script. Better on real package photos. | Live camera / real image upload |
| **Tesseract.js** | Runs entirely in Node.js, zero Python dependency. | Fallback, offline demo |
| **Mock OCR** | Returns pre-built results for 4 demo scenarios. 100% predictable. | Hackathon judging demo |

Switch engines from the dashboard header before uploading.

---

## Demo Scenarios

| Scenario | What it demonstrates |
|----------|---------------------|
| ✅ Compliant Package | All 6 mandatory declarations detected at high confidence. All rules pass. |
| ⚠️ Low OCR Confidence | MRP detected at 58% confidence — auto-flagged for officer review. |
| 📷 Insufficient Coverage | Front-only photo. System requests additional view, does NOT claim MRP is absent. |
| 🔴 Missing Declaration | 3 views submitted. Consumer care genuinely absent. Officer verification required. |

---

## Architecture

```
Image Upload / Camera
        ↓
Image Preprocessing (sharp — resize, contrast normalisation, edge sharpening)
        ↓
OCR Engine  (PaddleOCR DL  /  Tesseract.js  /  Mock for demo)
        ↓
Field Extractor  (keyword matching + 40+ regex patterns per declaration type)
        ↓
Rule Engine  (deterministic — PASS / NEEDS_REVIEW / POTENTIAL_ISSUE)
        ↓
Officer Review  (confirm / correct / reject / request view / remark)
        ↓
Inspection Dossier PDF  (Form-IV format + audit log)
```

**Key principle:** The rule engine is entirely deterministic — no LLM, no hallucinations. Every finding has a rule ID, severity, and reason. OCR results carry confidence scores; anything below 70% is automatically flagged.

---

## Project Structure

```
SHI/
├── client/                    # React 18 + Vite + TypeScript + Tailwind
│   └── src/
│       ├── components/        # UI components
│       ├── pages/             # InspectionDashboard (main page)
│       └── types/index.ts     # Shared types
├── server/                    # Node.js + Express + TypeScript
│   └── src/
│       ├── ocr/               # OCR adapters (Mock / Tesseract / PaddleOCR)
│       ├── extraction/        # Field extractor (regex + keyword matching)
│       ├── rules/             # Rule engine + demo-rules.json
│       ├── routes/            # API routes
│       └── server.ts          # Entry point
├── start.bat                  # One-click Windows startup
└── start.sh                   # One-click Unix startup
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OCR_MODE` | `mock` | `mock` · `tesseract` · `paddle` |
| `PORT` | `3001` | Backend API port |
| `PADDLE_OCR_URL` | `http://localhost:8100` | PaddleOCR service endpoint |

Copy `.env.example` to `.env` to customise.

---

## Deployment

```bash
# Build full-stack (React + Express, single server)
cd server
npm run build:full

# Start production server
npm start
# Serves frontend + API on port 3001
```

One-command Docker build and Railway deployment are also supported. See the deployment section in project docs.

---

> **Disclaimer:** Prototype for SIH evaluation. Not a production legal enforcement system. AI assists detection — the authorised officer makes all final decisions. Demo rules are illustrative and do not constitute legal advice.
