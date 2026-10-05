# Phase 1: Defect Remediation & Full Frontend-Backend Binding - Context

**Gathered:** 2026-10-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Resolve open linter and runtime defects, clean up legacy uncommitted deletions from the frontend agent migration, ensure zero Oxlint errors and warnings, and bind all frontend views, dropdown filters, and modals directly to live Express API endpoints and PostgreSQL ground truth without modifying the existing visual design system or component hierarchy.
</domain>

<decisions>
## Implementation Decisions

### Oxlint & Code Quality Baseline
- **D-01:** Resolve all 180 Oxlint warnings across test files, backend services, and React components to achieve a clean 0-warning baseline — **Reversibility:** reversible — Code formatting and unused variable pruning.
- **D-02:** Fix React Compiler `setState-in-effect` warning in `src/pages/Login.jsx:27` by using lazy state initialization `useState(() => localStorage.getItem(...) || '')`.
- **D-03:** Clean up uncommitted deleted file references from the frontend agent migration (`src/agent/*`, `src/services/hindsightMemoryService.js`) to restore git working tree cleanliness.

### Multi-Tenant Isolation & Authentication Flow
- **D-04:** Wire active user organization and auth token from `AuthContext` into `apiService.js` headers (`x-organization-id`, `Authorization`), with reliable fallback to `'default-org'` for unauthenticated public routes — **Reversibility:** costly — Affects all API request headers across the application.
- **D-05:** Verify that `server/middlewares/authMiddleware.js` handles both authenticated sessions and development tenant scopes without rejecting legitimate frontend requests.

### Deep Cross-View Navigation & State Synchronization
- **D-06:** Enhance `DashboardView.jsx` and `CompetitorProfileView.jsx` so that clicking "Ask Agent" or "Query AI Agent for [Competitor]" passes both query prompt and competitor context to `AgentWorkspace` via `Dashboard.jsx` routing state.
- **D-07:** Persist date range filter (`dateFilter`) and active competitor (`selectedCompetitor`) across all views, ensuring consistent temporal scoping across Dashboard, Connect-the-Dots, Strategic Patterns, and Comparison Matrix.

### Truthful Empty & Loading States
- **D-08:** Replace any static fixture fallbacks in views with genuine PostgreSQL state indicators, clear loading spinners, and actionable "Trigger Ingestion" / "Evaluate Alerts" buttons when data is empty — **Reversibility:** reversible — Component render branch logic.

### Agent's Discretion
- Minor helper naming and internal test assertion cleanup are at the agent's discretion as long as 16 test suites pass and Oxlint reports 0 warnings.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture & Conventions
- `.planning/codebase/STACK.md` — Runtime versions, dependencies, and build commands
- `.planning/codebase/ARCHITECTURE.md` — System architecture and layer responsibilities
- `.planning/codebase/STRUCTURE.md` — File layout and component organization
- `.planning/codebase/CONVENTIONS.md` — Coding style, API response envelopes, and error handling
- `.planning/codebase/TESTING.md` — Test runner commands and mocking conventions
- `.planning/codebase/CONCERNS.md` — Known tech debt, Oxlint warnings, and fragile areas

### Requirements & Roadmap
- `.planning/PROJECT.md` — Project context and 12 priority goals
- `.planning/REQUIREMENTS.md` — Requirements INTG-01, INTG-02, INTG-03, PROD-01
- `.planning/ROADMAP.md` — Phase 1 detail, success criteria, and plans

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/services/apiService.js`: Centralized Axios/fetch wrapper with methods for all backend controllers (`getEvents`, `getAlerts`, `getCompetitors`, `getConnectDotsPatterns`, `getStrategicAnalyses`, `getCompetitiveComparison`, `getExecutiveReports`, `queryAgent`, `refreshOfficialData`).
- `src/components/common/HindsightFlowWidget.jsx`: Visual memory flow widget used across views.
- `src/components/common/MonitoringStatusWidget.jsx`: Continuous monitoring scheduler status indicator.

### Established Patterns
- Standard API response envelope: `{ success: true, data: ..., meta: { ... } }`.
- React views accept standard callback props: `onNavigate`, `onSelectCompetitor`, `onOpenEvidence`, `dateFilter`.
- Oxlint configuration in `.oxlintrc.json` enforcing strict React hook and ESLint core rules.

### Integration Points
- Frontend view mounting in `src/pages/Dashboard.jsx` (switch statement rendering `DashboardView`, `AlertsView`, `CompetitorProfileView`, etc.).
- Express route registration in `server/app.js` mounting `/api/events`, `/api/alerts`, `/api/connect-dots`, `/api/strategic-analysis`, `/api/competitive-comparison`, `/api/executive-reports`, `/api/agent`.

</code_context>

<specifics>
## Specific Ideas

- Ensure seamless live demonstration flow where navigating between any two views shows live PostgreSQL events, consistent active competitor selection, and zero visual glitches.
- Preserve the existing dark glassmorphic UI aesthetic, color palette, and micro-animations.

</specifics>

<deferred>
## Deferred Ideas

- Real-time WebSocket subscriptions for immediate push alert banners (deferred to v2 / Phase 6).
- Autonomous multi-step tool execution loop for Agent (addressed in Phase 3).
- Deep Hindsight RETAIN/RECALL/REFLECT vector indexing (addressed in Phase 4).

</deferred>

---

*Phase: 1-Defect Remediation & Full Frontend-Backend Binding*
*Context gathered: 2026-10-05*
