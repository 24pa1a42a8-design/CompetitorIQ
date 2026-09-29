# CompetitorIQ — Enterprise Competitive Intelligence Platform

CompetitorIQ is a production-grade, evidence-grounded **Competitive Intelligence System** that ingests public competitor signals, detects multi-event patterns, synthesizes strategic analyses, generates executive reports, and provides AI-powered intelligence queries backed by PostgreSQL ground truth, local Ollama LLM (`qwen2.5:3b`) grounded reasoning, and optional Hindsight Cloud vector memory.

---

## 🏛️ System Architecture

```
PUBLIC SOURCE (News, Releases, Pricing, Careers)
       ↓
SCHEDULER (Per-Source Polling, Lock Concurrency, Backoff)
       ↓
SOURCE ADAPTER (NewsPress, ProductRelease, PricingPage, CareersHiring)
       ↓
FETCH & PARSE (SSRF Domain Allowlisting, Rate Limits, Paywall Protection)
       ↓
INGESTION PIPELINE (SHA-256 Content Deduplication & Normalization)
       ↓
DATABASE PERSISTENCE (PostgreSQL + Prisma Ground Truth Schema)
       ↓
ALERT ENGINE (Deterministic Rule Matching & Threat Evaluation)
       ↓
HINDSIGHT MEMORY (RETAIN → RECALL → REFLECT with Safe Fallback)
       ↓
OLLAMA LOCAL LLM ENGINE (qwen2.5:3b Grounded Reasoning & Brief Synthesis)
       ↓
INTELLIGENCE ENGINES
 ├── CONNECT THE DOTS (Cross-Event Multi-Node Pattern Analysis)
 ├── STRATEGIC ANALYSIS (FACT / OBSERVATION / INFERENCE / IMPLICATION / UNKNOWN)
 ├── COMPETITIVE COMPARISON (Multi-Competitor Evidence Matrix)
 └── EXECUTIVE REPORTS (C-Level Intelligence Synthesis)
       ↓
COMPETITOR IQ AGENT & REACT FRONTEND WORKSPACE
```

---

## 🦙 Ollama Local LLM Integration (`qwen2.5:3b`)

CompetitorIQ uses local Ollama with `qwen2.5:3b` for grounded AI reasoning and brief synthesis.

### 1. Ollama Environment Setup
Ensure Ollama is installed and running on your system:
- **Base URL**: `http://localhost:11434`
- **Chat API**: `http://localhost:11434/api/chat`
- **Configured Model**: `qwen2.5:3b`

To verify Ollama locally:
```bash
# Pull model if not already downloaded
ollama pull qwen2.5:3b

# Run Ollama interactive session
ollama run qwen2.5:3b
```

### 2. Ollama Health & Readiness API Endpoints
- `GET /api/health/ready` — System readiness including PostgreSQL, Hindsight, and Ollama reachability.
- `GET /api/health/ollama` — Dedicated health check returning Ollama connectivity and model availability status:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "reachable": true,
    "model": "qwen2.5:3b",
    "baseUrl": "http://localhost:11434",
    "modelAvailable": true,
    "message": "Ollama reachable and model 'qwen2.5:3b' is ready."
  }
}
```

> **Automatic Graceful Fallback**: If Ollama is stopped or the model is unavailable, CompetitorIQ automatically falls back to deterministic brief synthesis. The application will never crash.

---

## 🔑 Environment Configuration

Create or configure `.env` in the root directory:

```env
# Server Port & Node Environment
PORT=5000
NODE_ENV=production
FRONTEND_URL=http://localhost:5173

# Ollama Local LLM Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:3b
OLLAMA_TIMEOUT_MS=15000

# PostgreSQL Database Connection
DATABASE_URL="postgresql://user:password@localhost:5432/competitor_iq?schema=public"

# Continuous Monitoring Scheduler
MONITORING_ENABLED=true

# Server-Side Hindsight Cloud Memory Configuration
HINDSIGHT_API_KEY="your-hindsight-api-key"
HINDSIGHT_API_URL="https://api.hindsight.vectorize.io"
HINDSIGHT_BANK_ID="competitorIQ"

# CORS Allowed Origins (Comma-separated)
ALLOWED_ORIGINS="http://localhost:5173,http://localhost:3000"
```

> **SECURITY REMINDER**: All Ollama and Hindsight API calls occur strictly on the backend server. No private configuration or API keys are exposed to the frontend.

---

## 🚀 Getting Started

### 1. Database Setup
```bash
# Run Prisma migrations & generate client
npx prisma migrate dev
```

### 2. Start Dev Servers
```bash
# Development backend server
npm run dev

# Or build production bundle
npm run build
```

---

## 🧪 Running Tests & Quality Verification

```bash
# Run full unit, integration, and E2E pipeline test suite (112 tests across 31 suites)
npm test

# Run code linter
npm run lint

# Build production bundle
npm run build
```

---

## 🧪 Manual Verification Procedure for Ollama

Follow these steps to manually test the integrated agent with local Ollama:

1. **Start Local Ollama**: Ensure Ollama is running (`ollama serve` or Windows system tray app) with `qwen2.5:3b` pulled.
2. **Start CompetitorIQ Backend & Frontend**:
   ```bash
   npm run server   # Starts backend on http://localhost:5000
   npm run dev      # Starts frontend on http://localhost:5173
   ```
3. **Check Health Status**:
   Visit `http://localhost:5000/api/health/ollama` in your browser. Verify it returns `"status": "ok"` and `"reachable": true`.
4. **Test Agent Workspace**:
   Navigate to the Agent Workspace tab on the frontend (`http://localhost:5173`). Observe the top badge showing `Ollama qwen2.5:3b (Connected)`.
5. **Execute a Query**:
   Enter `"What changed recently for Oracle?"` and click **Ask Agent**.
   - Verify the response includes the badge `Ollama (qwen2.5:3b) Grounded`.
   - Verify facts, observations, and evidence citations are displayed truthfully.
6. **Test Graceful Fallback (Ollama Stopped)**:
   Stop the Ollama service on your laptop. Run the query again.
   - Verify the response gracefully outputs deterministic synthesis with badge `Deterministic Synthesis Fallback`.
   - Verify the app does NOT crash.
7. **Test Hindsight Credit Exhaustion + Ollama Local Reasoning**:
   When Hindsight credits are exhausted, verify `Stage: DEGRADED` is displayed alongside `Ollama (qwen2.5:3b) Grounded`, showing truthful Hindsight status while confirming local AI reasoning success.

---

## 💡 Hindsight Integration

When Hindsight Cloud API key and credits are active:
- **RETAIN**: High-value normalized competitive signals are stored into the Hindsight memory bank (`competitorIQ`).
- **RECALL**: Strategic historical context is semantically recalled during agent queries and Connect-the-Dots pattern detection.
- **REFLECT**: Deep macro-trajectory reflection is performed for strategic comparison and executive report generation.


---


