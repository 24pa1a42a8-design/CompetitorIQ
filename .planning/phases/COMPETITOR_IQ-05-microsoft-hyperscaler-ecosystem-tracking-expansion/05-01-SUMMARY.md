# Summary: 05-01 Microsoft & Hyperscaler Ingestion Pipeline Expansion

## Executive Summary
Expanded competitor intelligence ingestion to track Microsoft (focal enterprise) and five key cloud/enterprise rivals (AWS, Google Cloud, Oracle, Salesforce, IBM). Integrated hybrid live-with-snapshot fallback in `baseAdapter.js` to guarantee zero fetch errors when public feeds block automated scrapers. Extended classifier and normalizer regexes for 5-taxonomy signal classification (`PRODUCT`, `PRICING`, `PARTNERSHIP`, `HIRING`, `LEADERSHIP`) and updated database seed scripts.

## Key Changes
- **Source Configuration (`server/config/sourcesConfig.js`):** Registered RSS/HTML feeds and career links for Microsoft, AWS, GCP, Oracle, Salesforce, and IBM with expanded SSRF domain whitelist.
- **Hybrid Adapter Fallback (`server/adapters/baseAdapter.js`):** Added automatic fallback to verified snapshot feeds when network requests encounter HTTP 403, timeout, or DNS issues (`fallbackUsed: true`).
- **5-Taxonomy Classification (`server/ingestion/classifier.js`, `server/ingestion/normalizer.js`):** Refined boundary matching and aliases to accurately classify partnerships, executive shifts, hiring sprees, pricing tiers, and product releases.
- **Database Seeding (`server/scripts/seedMicrosoftData.js`):** Updated seed script to register all 6 entities and populate multi-taxonomy verified historical events.

## Verification
- `node server/scripts/seedMicrosoftData.js` upserted 6 competitor profiles and multi-taxonomy events cleanly.
- `oxlint` ran with 0 warnings and 0 errors.
