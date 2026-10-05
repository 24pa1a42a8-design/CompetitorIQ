# Phase 5 Context: Microsoft & Hyperscaler Ecosystem Tracking Expansion

**Phase:** 05-microsoft-hyperscaler-ecosystem-tracking-expansion
**Date:** 2026-10-05
**Status:** Decisions Locked

---

## 1. Locked Decisions

### D-20: Hybrid Live Ingestion with Verified Fallback
- **Mechanism:** Ingestion adapters (`BaseSourceAdapter`, `NewsPressAdapter`, `ProductReleaseAdapter`, `PricingPageAdapter`, `CareersHiringAdapter`) attempt live HTTP retrieval against official public endpoints (RSS, newsrooms, pricing sheets).
- **Graceful Fallback:** If public endpoints fail, return HTTP 403 (bot protection / Cloudflare), or time out (such as in offline development, CI, or network-constrained demo environments), the adapter seamlessly falls back to curated, realistic verified snapshot payloads.
- **Guarantee:** Ingestion never throws unhandled errors or 500s; always outputs valid, normalized competitor events with verifiable citations and source URLs.

### D-21: Comprehensive 5-Taxonomy Signal Classification
- **Event Taxonomies Covered:**
  1. `PRODUCT`: Product launches, feature updates, version releases, deprecations (with `ProductSignal`).
  2. `PRICING`: Price cuts, per-user seat pricing, consumption/token pricing, billing tiers (with `PricingSignal`).
  3. `PARTNERSHIP`: Strategic cloud alliances, multi-cloud hardware integrations (e.g., Oracle Database@Azure), infrastructure consortia (e.g., Microsoft GAIIP), foundation model partnerships (e.g., AWS + Anthropic).
  4. `HIRING`: Specialized talent surges, AI accelerator/silicon engineering recruitments, executive talent acquisitions (with `HiringSignal`).
  5. `LEADERSHIP`: C-suite shifts, division head reorganizations, key executive departures and appointments.
- **Extraction & Normalization:** `server/ingestion/normalizer.js` and `server/adapters/htmlParser.js` identify signals and populate both the parent `CompetitorEvent` and structured child signal tables (`ProductSignal`, `PricingSignal`, `HiringSignal`, `MessagingSignal`, `FundingSignal`).
- **Data Integrity:** SSRF checks on all target URLs (`ssrfValidator.js`), SHA-256 content hashing (`contentHash`), and database/in-memory deduplication (`deduplicator.js`).

### D-22: Full Hyperscaler & Microsoft Enterprise Registration
- **Monitored Organizations & Competitors:**
  - **Microsoft** (`microsoft`): Focal enterprise (Azure, Copilot Studio, OpenAI integration, Maia silicon).
  - **AWS** (`aws`): Amazon Web Services (Bedrock, Trainium/Inferentia, S3/EC2 pricing).
  - **Google Cloud** (`google-cloud`): Vertex AI, Gemini models, TPU Trillium, Cloud Run.
  - **Oracle** (`oracle`): Oracle Cloud Infrastructure, Autonomous Database, Database@Azure, Exadata.
  - **Salesforce** (`salesforce`): Agentforce, Atlas Reasoning Engine, Data Cloud, consumption pricing.
  - **IBM** (`ibm`): IBM watsonx, Granite 3.0 enterprise models, Red Hat hybrid cloud.
- **Seeding:** Update `server/scripts/seedMicrosoftData.js` to ensure all 6 entities and comprehensive multi-taxonomy events are upserted with zero duplicates.

### D-23: Dual-Mode Ingestion UI & Real-Time Monitoring
- **Global Control:** "Ingest All Hyperscalers" button in `IngestionView.jsx` triggering multi-source orchestration across all 6 companies.
- **Targeted Control:** Per-competitor trigger button ("Ingest AWS", "Ingest Microsoft", etc.) allowing analysts to selectively poll specific rivals.
- **Telemetry Display:** Real-time source health indicators (Last Polled, Status: Healthy/Degraded, New Events Ingested, Duplicates Filtered).

---

## 2. Requirements Addressed

- **INGEST-01:** Ingestion adapters track Microsoft and primary competitors: AWS, Google Cloud, Oracle, Salesforce, and IBM.
- **INGEST-02:** Tracked event taxonomy covers product launches, pricing updates, strategic partnerships, hiring spikes, and leadership changes.
- **INGEST-03:** All adapter fetching enforces SSRF validation, content-hash deduplication (SHA-256), and rate-limited scheduling.

---

## 3. Plan Decomposition

- **Plan 05-01:** Expand and verify source adapters, `sourcesConfig.js`, SSRF validation, and 5-taxonomy signal extraction for Microsoft and the 5 competitors (AWS, GCP, Oracle, Salesforce, IBM).
- **Plan 05-02:** Implement verified snapshot fixtures, seed all 6 hyperscalers, wire dual-mode global/per-competitor ingestion UI in `IngestionView.jsx`, and validate with end-to-end automated tests in `tests/ingestionAndHyperscalers.test.js`.
