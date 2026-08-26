# LabelCheck

**Smart India Hackathon 2026**
Problem Statement 26034 (Ministry of Consumer Affairs)

LabelCheck is a polyglot microservices application that scans photos of packaged commodities and checks them for compliance with India's Legal Metrology (Packaged Commodities) Rules, 2011.

## Architecture

```text
+-------------------+       +-------------------+       +-------------------+
| React Frontend    | ----> | Node Backend      | ----> | Python AI Service |
| (Vite, Tailwind)  | <---- | (Express, MongoDB)| <---- | (FastAPI, EasyOCR)|
| Port 5173         |       | Port 5000         |       | Port 8000         |
+-------------------+       +-------------------+       +-------------------+
```

- **Frontend**: React application for officer dashboard and image uploading.
- **Backend**: Node.js API handling authentication, MongoDB persistence, and PDF report generation.
- **AI Service**: Python FastAPI microservice dedicated to running EasyOCR and regex-based rule extraction.

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- MongoDB running locally on port 27017

### 1. Python AI Service
```bash
cd ai-service
pip install -r requirements.txt
# Start the service
uvicorn main:app --reload --port 8000
```

### 2. Node Backend
```bash
cd server
npm install
# Optional: Seed database with dummy data
node seed.js
# Start the server (uses node index.js or server.js)
node server.js
```

### 3. React Frontend
```bash
cd client
npm install
# Start dev server
npm run dev
```

### Quick Start (Windows)
Run `start.bat` from the root directory to launch all three services concurrently in separate terminal windows.

## Known Limitations & Scope
- **Font Size Estimation**: True mm measurement from a photo requires a reference object (like a coin or card). The current font size feature provides an estimate based on pixel-to-mm ratio from a reference bounding box.
- **E-Commerce Scoping**: Live scraping of e-commerce platforms is out of scope for this MVP to avoid Terms of Service violations. Future integration could use official APIs.
- **Rule Coverage**: This MVP focuses exclusively on **retail pre-packaged FMCG goods**. Wholesale, imported, and variable packages require different rule subsets.
- **OCR Accuracy**: Depends heavily on lighting, glare, and camera quality. The system uses EasyOCR for its superior mixed Hindi-English support.
