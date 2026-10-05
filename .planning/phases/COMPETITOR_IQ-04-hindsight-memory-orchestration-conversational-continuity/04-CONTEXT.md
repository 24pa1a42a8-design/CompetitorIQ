# Phase 4 Context: Hindsight Memory Orchestration & Conversational Continuity

**Phase:** 04-hindsight-memory-orchestration-conversational-continuity
**Status:** Context Gathered & Locked
**Date:** 2026-10-05
**Requirements Addressed:** `MEM-01`, `MEM-02`, `CONV-01`, `CONV-02`

---

## 1. Phase Objective & Core Intent

Unify Vectorize Hindsight Cloud memory across the complete intelligence lifecycle (RETAIN during signal ingestion, RECALL during query answering, and REFLECT during macro-trend pattern analysis) while ensuring seamless degraded fallback to PostgreSQL when credits are exhausted. In parallel, transform the agent interface into a persistent multi-turn conversational experience where user dialogue is recorded in PostgreSQL (`AgentConversation` and `AgentMessage`), context-aware follow-up queries carry forward active competitors and previous evidence, and local Ollama (`qwen2.5:3b`) reasons over recent conversation history.

---

## 2. Locked Implementation Decisions

### D-17: Chronological Multi-Turn Conversation Thread in UI (CONV-01)
- The `AgentWorkspace` UI presents conversations as a chronological interactive message thread:
  - User queries appear as distinct user chat bubbles on the right.
  - Agent responses appear on the left with execution milestones and tool badges.
  - The **latest** agent turn is fully expanded into the complete 5-box epistemological brief (`Executive Brief`, `Facts`, `Observations`, `Inferences`, `Implications`, `Unknowns`) and the Evidence Traceability Grid.
  - Previous turns remain visible and interactive in the scrollable thread as clean summarized cards (showing query, brief excerpt, and a quick "Expand Brief" toggle).
  - Users can start a "New Session" or switch between past conversations via the existing conversation bar.

### D-18: Multi-Turn Context Grounding & Pronoun Resolution for Ollama (CONV-02)
- When a follow-up query is received in an active conversation session:
  - **Entity/Competitor Continuity**: If the new query contains pronouns ("they", "their", "it", "this competitor") or does not mention any competitor explicitly, the agent inherits the active competitor from the previous turn.
  - **Context Window Injection**: The last 3 dialogue turns (user questions + assistant 1-sentence executive brief summaries) are injected directly into Ollama's prompt under a `[Conversation History]` header.
  - **Prior Evidence Continuity**: Evidence items cited in the previous turn are included in the grounding pool if relevant to the follow-up question.
  - Keeps token consumption lean (~1200-1500 tokens) while providing full multi-turn conversational fluency.

### D-19: Intelligent Memory Orchestration (RETAIN / RECALL / REFLECT) & Resilient Fallback (MEM-01, MEM-02)
- **RETAIN**:
  - Ingestion pipeline (`ingestionService.js`) automatically indexes high-value normalized signals into Hindsight Cloud (`hindsightService.retain`).
  - Records operation lifecycle in `MemoryOperation` with duration, status, and bank ID.
- **RECALL vs REFLECT Intent Routing**:
  - Entity-specific or event-focused queries (e.g. "What has AWS launched?", "Show pricing changes for Oracle") route to Hindsight `RECALL` (`hindsightService.recallEvents` / `recall`).
  - Macro-trend, multi-competitor, or strategic trajectory queries (e.g. "Analyze 90-day trajectory", "Macro patterns across cloud providers", "Strategic reflection") route to Hindsight `REFLECT` (`hindsightService.reflect`).
- **Resilient Fallback & Transparency**:
  - If Hindsight API credentials are unconfigured or return `402 Insufficient Credits` / `503 Unavailable`, the system never crashes or errors.
  - Transparently sets `status: 'DEGRADED'` in `MemoryOperation`, displays an amber `HINDSIGHT FALLBACK` pill in `HindsightFlowWidget` and `AgentWorkspace`, and continues grounding using PostgreSQL relational data.

---

## 3. Key Files & Components Affected

- `server/services/agentService.js`:
  - Context-aware follow-up query resolution: pronoun resolution, inherited competitor context, and passing conversation history to Ollama.
  - Dynamic memory stage routing (RECALL vs REFLECT) based on query semantics.
- `server/services/ollamaService.js`:
  - System prompt expansion to accept `conversationHistory` and synthesize contextually aware follow-up responses.
- `server/services/ingestionService.js`:
  - Ensure all ingestion adapters trigger `RETAIN` and track in `memoryOperationRepository`.
- `server/routes/hindsightRoutes.js` & `server/controllers/hindsightController.js`:
  - Verify Hindsight REST endpoints (`/api/hindsight/retain`, `/api/hindsight/recall`, `/api/hindsight/reflect`, `/api/hindsight/stats`, `/api/hindsight/operations`).
- `src/components/agent/AgentWorkspace.jsx`:
  - Multi-turn chronological conversation thread rendering.
  - Expand/collapse historical response briefs.
  - Memory stage badge and fallback transparency.
- `src/components/common/HindsightFlowWidget.jsx`:
  - Live binding to memory operations and active stage.
- `tests/memoryAndConversations.test.js`:
  - Automated test suite validating RETAIN on ingestion, RECALL and REFLECT routing, degraded fallback handling, and multi-turn conversational continuity.

---

## 4. Verification Criteria for Phase 4

1. Signals ingested through `ingestionService.js` create corresponding `RETAIN` records in `MemoryOperation`.
2. Event queries trigger `RECALL` memory operations, while macro-trend queries trigger `REFLECT` memory operations.
3. When Hindsight returns credit exhaustion or times out, the system marks the operation as degraded and falls back to relational database search without 500 errors.
4. Multi-turn dialogue in `AgentWorkspace` persists in `AgentConversation` and `AgentMessage`. Follow-up queries (e.g., "What about their pricing?") correctly resolve the prior competitor context and display both turns in the conversation thread.
5. All automated tests in `tests/memoryAndConversations.test.js` pass with 0 failures under `node --test`, and `npm run lint` maintains 0 warnings and 0 errors across all files.
