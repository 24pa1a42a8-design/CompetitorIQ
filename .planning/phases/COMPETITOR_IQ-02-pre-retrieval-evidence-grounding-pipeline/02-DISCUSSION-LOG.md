# Discussion Log: Phase 2 - Pre-Retrieval Evidence & Grounding Pipeline

**Date:** 2026-10-05
**Phase:** 02-pre-retrieval-evidence-grounding-pipeline
**Participants:** User, Antigravity AI Assistant

## Topics & Decisions Locked

### Topic 1: Pre-Retrieval Strictness & Grounding Policy (EVID-01)
- **Question:** How strictly should the Pre-Retrieval Evidence Pipeline enforce grounding when a user queries a competitor with few or zero stored events?
- **User Selection:** Strict Fail-Closed: Refuse to speculate when database evidence is absent, returning an explicit "Insufficient Evidence" verdict with data gap notices.
- **Decision (D-09):** The AI Agent will strictly reject hallucinating or speculating when zero matching database records are found for a requested entity or question. If `totalEvidenceCount === 0`, return `insufficientEvidence: true`, empty factual buckets, and explicit guidance pointing to the Data Ingestion pipeline.

### Topic 2: 5-Box Epistemological Classification Engine (EVID-02)
- **Question:** How should the 5 Epistemological Claim Buckets (FACT, OBSERVATION, INFERENCE, IMPLICATION, UNKNOWN) be generated and classified?
- **User Selection:** Hybrid Deterministic + LLM Classification: Synthesize the 5 buckets (Facts, Observations, Inferences, Implications, Unknowns) from database records with Ollama enrichment and 100% deterministic fallback when offline.
- **Decision (D-10):** All agent responses will structure knowledge into 5 distinct arrays (`facts`, `observations`, `inferences`, `implications`, `unknowns`). Primary event titles and metric diffs map to `FACTS`; category velocity and aggregate statistics map to `OBSERVATIONS`; cross-event deductive insights map to `INFERENCES`; commercial/competitive impact maps to `IMPLICATIONS`; unverified bounds and missing signals map to `UNKNOWNS`. If Ollama is active, it refines and structures these buckets; if Ollama is offline or times out, the deterministic engine generates the exact 5 buckets without breaking.

### Topic 3: Evidence Citation Presentation in UI (EVID-03)
- **Question:** How should evidence citations and primary source links be presented in the Agent Workspace?
- **User Selection:** Dual Display: Clean prose narrative with clickable citation pills linking directly to an interactive Evidence Traceability card grid below the answer.
- **Decision (D-11):** The Agent Workspace UI will feature inline citation badges (`[Source: Microsoft PR]`, `[Citation: AWS Blog]`) inside the synthesized narrative. Clicking any citation highlights or scrolls to the corresponding Evidence Card in the grid below, and clicking the Evidence Card opens the standardized `EvidenceModal` with live external source links.

### Topic 4: First-Class 5-Box UI Visualization
- **Decision (D-12):** Expand `AgentWorkspace.jsx` from 4 analytical boxes to all 5 distinct epistemological cards:
  1. Emerald Box: **Grounded Facts** (verifiable primary text)
  2. Blue Box: **Strategic Observations** (empirically detected patterns)
  3. Amber Box: **Logical Inferences** (deductive conclusions)
  4. Purple Box: **Business & Commercial Implications** (strategic impact on Microsoft & rivals)
  5. Slate Box: **Unknowns & Data Gaps** (unverified boundaries & missing disclosures)
