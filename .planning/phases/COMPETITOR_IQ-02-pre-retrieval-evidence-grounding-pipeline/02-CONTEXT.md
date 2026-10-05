# Phase 2 Context: Pre-Retrieval Evidence & Grounding Pipeline

**Phase:** 02-pre-retrieval-evidence-grounding-pipeline
**Status:** Context Gathered & Locked
**Date:** 2026-10-05
**Requirements Addressed:** `EVID-01`, `EVID-02`, `EVID-03`

---

## 1. Phase Objective & Core Intent

Establish an unshakeable ground truth foundation where all AI generation and analytical services mandatorily query PostgreSQL factual evidence before synthesizing text, strictly separating facts from inferences and displaying verifiable citations with primary source URLs.

---

## 2. Locked Implementation Decisions

### D-09: Strict Fail-Closed Pre-Retrieval Policy (EVID-01)
- The agent execution pipeline in `agentService.js` strictly enforces pre-retrieval against PostgreSQL `CompetitorEvent` and `EventEvidence` records.
- If zero evidence records are found for a requested entity or query topic (`totalEvidenceCount === 0` on specific entity queries), the system immediately returns an explicit `insufficientEvidence: true` response.
- The system will **never hallucinate or invent** unverified competitor claims or numbers.
- The response explicitly reports data gaps and instructs the user to run public ingestion pipelines (`/ingestion/refresh` or `node server/scripts/ingestOfficialSources.js`).

### D-10: 5-Box Epistemological Claim Classification (EVID-02)
- All agent responses structure analytical claims into 5 first-class arrays:
  1. `facts`: Verifiable primary source disclosures, exact title quotes, pricing numbers, funding amounts, and hiring counts.
  2. `observations`: Empirical pattern summaries, category frequency distributions, and velocity metrics across the retrieved window.
  3. `inferences`: Logical deductions derived by connecting multiple observations (e.g. rapid feature releases signaling parity acceleration).
  4. `implications`: Commercial, operational, and competitive impacts on Microsoft's product portfolio and market share.
  5. `unknowns`: Explicit boundaries, missing evidence, undisclosed timelines, or Hindsight credit exhaustion fallback notices.
- Classification uses a **Hybrid Deterministic + LLM Engine**:
  - Deterministic rules reliably parse database signals into the 5 buckets.
  - When Ollama (`qwen2.5:3b`) is reachable, the prompt instructs the model to structure and refine these 5 buckets.
  - If Ollama is offline or times out, the deterministic engine supplies the complete 5-bucket response with 100% resilience.

### D-11: Dual Display Evidence Citations & Deep Linking (EVID-03)
- The synthesized narrative in `AgentWorkspace.jsx` includes inline citation badges (`[Source: Microsoft PR]`, `[Citation: AWS Blog]`).
- Below the narrative, an interactive **Evidence Traceability Grid** displays all corroborating signals.
- Each evidence item includes:
  - Event title and competitor badge
  - Publisher name and event date
  - Verifiable source excerpt
  - Content hash and capture timestamp
  - Direct external link button (`target="_blank" rel="noopener noreferrer"`) opening the primary source.
- Clicking any card opens `EvidenceModal` for complete inspection.

### D-12: Full 5-Box Visual Architecture in Agent Workspace
- `AgentWorkspace.jsx` renders all 5 buckets in high-contrast, visually distinct glassmorphic panels:
  - **Facts**: Emerald card with `CheckCircle2` icon
  - **Observations**: Blue card with `Layers` icon
  - **Inferences**: Amber card with `Sparkles` icon
  - **Implications**: Purple card with `TrendingUp` icon
  - **Unknowns**: Slate card with `AlertCircle` icon

---

## 3. Key Files & Components Affected

- `server/services/agentService.js`: Pre-retrieval enforcement, 5-bucket synthesis engine, and evidence citation generation.
- `server/repositories/competitorEventRepository.js`: Tenant-isolated pre-retrieval queries with evidence joins.
- `src/components/agent/AgentWorkspace.jsx`: 5-box rendering, inline citation badges, and evidence modal binding.
- `tests/evidenceGrounding.test.js`: Comprehensive automated test suite verifying pre-retrieval enforcement, epistemological classification, and zero-hallucination fail-closed behavior.

---

## 4. Verification Criteria for Phase 2

1. AI Agent queries for entities with zero records return `insufficientEvidence: true` with zero fabricated facts.
2. AI Agent responses contain non-empty `facts`, `observations`, `inferences`, `implications`, and `unknowns` arrays for populated queries.
3. Every evidence citation item contains a valid publisher, date, excerpt, and verified source URL.
4. `npm run lint` maintains 0 warnings and 0 errors.
5. All new and existing test suites pass under `node --test`.
