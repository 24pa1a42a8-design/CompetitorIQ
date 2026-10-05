# Phase 1: Defect Remediation & Full Frontend-Backend Binding - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-05
**Phase:** 1-Defect Remediation & Full Frontend-Backend Binding
**Areas discussed:** Oxlint & Code Cleanup, Dynamic Auth & Multi-Tenant Headers, Deep Cross-View Navigation, Truthful Empty & Loading States

---

## Code Quality & Oxlint Baseline

| Option | Description | Selected |
|--------|-------------|----------|
| Resolve all 180 Oxlint warnings & React compiler warnings | Clean 0-warning lint baseline across tests, backend services, and React components | ✓ |
| Retain minor warnings | Fix only critical errors | |

**User's choice:** Resolve all 180 Oxlint warnings & React compiler warnings — Clean 0-warning lint baseline.
**Notes:** User chose to completely clean up lint warnings and React compiler optimization notices.

---

## Dynamic Auth & Multi-Tenant Headers

| Option | Description | Selected |
|--------|-------------|----------|
| Dynamic Auth & Multi-Tenant Headers | Wire active user organization from AuthContext into apiService headers | ✓ |
| Static default-org header only | Keep fixed default-org header | |

**User's choice:** Dynamic Auth & Multi-Tenant Headers — Wire active user organization from AuthContext into apiService.
**Notes:** Ensures tenant isolation works end-to-end between authenticated frontend users and database repositories.

---

## Deep Cross-View Navigation

| Option | Description | Selected |
|--------|-------------|----------|
| Deep Cross-View Navigation | Pre-populate AgentWorkspace with query and competitor when clicking 'Ask Agent' from Dashboard/Profile | ✓ |
| Standard navigation | Switch tab without pre-filling query | |

**User's choice:** Deep Cross-View Navigation — Pre-populate AgentWorkspace with query and competitor when clicking 'Ask Agent' from Dashboard/Profile.
**Notes:** Ensures seamless user journey when clicking from intelligence cards to the agent workspace.

---

## Truthful Empty & Loading States

| Option | Description | Selected |
|--------|-------------|----------|
| Truthful Empty & Loading States | Show genuine PostgreSQL status and 'Trigger Ingestion' actions rather than static mock seeds | ✓ |
| Static mock seeds fallback | Fallback to hardcoded mock cards | |

**User's choice:** Truthful Empty & Loading States — Show genuine PostgreSQL status and 'Trigger Ingestion' actions rather than static mock seeds.
**Notes:** All views will truthfully reflect database state with intuitive triggers to populate data.

---

## Agent's Discretion

- Variable renaming for unused params (prefixing with `_`) and test fixture isolation.

## Deferred Ideas

- Webhook outbound push subscriptions (deferred to Phase 6 / v2).
