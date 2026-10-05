# Phase 3 Context: Autonomous AI Agent Execution Loop & Local Ollama Reasoning

**Phase:** 03-autonomous-ai-agent-execution-loop-local-ollama-reasoning
**Status:** Context Gathered & Locked
**Date:** 2026-10-05
**Requirements Addressed:** `AGENT-01`, `AGENT-02`, `AGENT-03`

---

## 1. Phase Objective & Core Intent

Upgrade CompetitorIQ's AI Agent from static single-turn prompt execution into a true autonomous multi-step reasoning agent. The agent dynamically decomposes user queries into execution plans, dispatches internal tools from an internal tool registry, iteratively observes and evaluates evidence, self-corrects via query broadening when initial passes yield zero records, and produces structured epistemological briefs via local Ollama (`qwen2.5:3b`) with 100% resilient deterministic fallback.

---

## 2. Locked Implementation Decisions

### D-13: Hybrid Deterministic/LLM Planner (AGENT-01)
- The execution loop operates with a deterministic intent and query decomposition parser that selects the initial tool execution plan immediately with zero latency and zero hallucinated tool calls.
- When Ollama is available, it synthesizes intermediate step evaluations and the final grounded brief.
- If Ollama is offline or times out, the planner and synthesis seamlessly transition to deterministic fallback without throwing 500 errors.
- The execution loop follows:
  `UNDERSTAND` → `PLAN` → `DISPATCH TOOL(S)` → `EVALUATE EVIDENCE` → `SELF-CORRECT (IF NEEDED)` → `SYNTHESIZE / RESPOND`.

### D-14: Standard 5-Tool Intelligence Suite (AGENT-02)
- An internal Tool Registry is established in `agentService.js` with 5 typed, executable tools:
  1. `search_events`: Query PostgreSQL `CompetitorEvent` records filtered by competitor slug/ID, event taxonomy category (pricing, product, hiring, expansion), keywords, and date range.
  2. `get_competitor_comparison`: Compute head-to-head comparison metrics (momentum scores, event velocity, focus distribution) across 2 or more competitors.
  3. `correlate_strategic_patterns`: Run cross-competitor pattern correlation and connect-the-dots analysis on recent signals.
  4. `analyze_pricing_signals`: Aggregate pricing updates, currency tiers, and pricing changes across competitors.
  5. `recall_memory`: Query Hindsight Cloud vector memory for semantic context and strategic patterns.
- Each tool returns standardized metadata: `{ tool, executionTimeMs, status, itemCount, data }`.

### D-15: Adaptive Query Relaxation & Self-Correction (AGENT-01)
- If an initial tool execution yields zero matching events for a specific competitor query (e.g. strict keyword filter returned 0 items), the loop enters an autonomous **Self-Correction** phase:
  - Step 1: Broaden search to include competitor aliases (e.g. "GCP" → "Google Cloud", "Red Hat" → "IBM").
  - Step 2: Fall back to recent events for that competitor without keyword constraints.
  - Step 3: If still 0 events after relaxation, enforce the strict fail-closed policy (D-09) and set `insufficientEvidence: true`.
- The maximum iteration cycle is bounded (default 3, max 5) to guarantee fast response times and prevent infinite loops.

### D-16: Detailed Tool Execution Timeline in UI (AGENT-01, AGENT-03)
- `AgentActivityPanel.jsx` and `AgentWorkspace.jsx` are upgraded to display:
  - Each individual tool call with its tool name, input arguments, execution duration (ms), and item count.
  - Visual status indicators (`completed`, `active`, `self-correcting`, `degraded`, `failed`).
  - Clear badge transparency indicating reasoning engine:
    - `Ollama (qwen2.5:3b) Grounded` (purple badge when local LLM was used)
    - `Deterministic Synthesis Fallback` (amber badge when Ollama is offline/timed out)
    - `Direct Fast-Path Response` (blue badge for greetings/help)
- Zero 500 crashes under any condition: all errors, timeouts, and credit exhaustions degrade gracefully with informative UI messages.

---

## 3. Key Files & Components Affected

- `server/services/agentService.js`:
  - Formal `AgentToolRegistry` implementing the 5 intelligence tools.
  - Autonomous loop orchestrator with multi-step iteration, evidence evaluation, and adaptive query relaxation.
  - Integration with `ollamaService.js` and deterministic synthesis fallback.
- `server/services/ollamaService.js`:
  - Optimized prompting for grounded 5-box synthesis, query decomposition assistance, and context assembly.
  - Strict timeout handling (1-2s in tests, 15-60s in production).
- `src/components/agent/AgentActivityPanel.jsx`:
  - Rich tool execution timeline showing tool calls, inputs, latencies, and item counts.
- `src/components/agent/AgentWorkspace.jsx`:
  - Tool execution badges, self-correction status, and deterministic fallback indicators.
- `tests/agentLoopAndTools.test.js`:
  - New automated test suite validating the tool registry, execution loop, adaptive self-correction, timeout handling, and fallback behavior.

---

## 4. Verification Criteria for Phase 3

1. Agent execution loop invokes tools from the registry and records individual step execution metadata (`durationMs`, `itemCount`, `tool`).
2. Queries triggering the comparison or pricing tools successfully dispatch `get_competitor_comparison` or `analyze_pricing_signals`.
3. Adaptive self-correction widens search when initial targeted keywords find 0 records before determining insufficient evidence.
4. When Ollama is offline, all queries return rich 5-box responses via deterministic fallback with zero 500 errors.
5. All test suites pass under `node --test` with 0 failures, and `npm run lint` maintains 0 warnings and 0 errors.
