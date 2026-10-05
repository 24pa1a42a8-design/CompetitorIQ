---
last_mapped_commit: a7c21f9eed23357377036a4489cb26d1b70aa1ab
last_mapped_at: 2026-10-05
---
# Technology Stack

**Analysis Date:** 2026-10-05

## Languages

**Primary:**
- JavaScript (ES Modules, ECMAScript 2023+) - Used across backend (`server/`) and frontend (`src/`)

**Secondary:**
- JSX (`.jsx`) - Frontend user interface components in `src/`
- SQL / Prisma Schema (`.prisma`) - Data model definitions in `prisma/schema.prisma`
- CSS / Tailwind (`.css`) - Styling in `src/index.css`, `src/App.css`, `src/pages/AgentHero.css`

## Runtime

**Environment:**
- Node.js `v22.20.0` (LTS runtime, tested with Node test runner `--test`)

**Package Manager:**
- npm `10.9.3`
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Express `5.2.1` (`server/app.js`, `server/server.js`) - REST API server, routing, middleware pipeline
- React `19.2.8` (`src/App.jsx`, `src/main.jsx`) - Component-based client SPA
- React Router DOM `7.18.4` (`src/App.jsx`) - Client-side routing with protected routes and layouts

**Testing:**
- Node.js built-in Test Runner (`node --test`, Node 22+) - Unit, integration, and E2E testing in `tests/`
- Node Assert (`node:assert/strict`) - Test assertion library

**Build/Dev:**
- Vite `8.3.0` (`vite.config.js`) - Client bundler and development server
- `@vitejs/plugin-react` `6.1.1` - Fast Refresh and JSX transformation
- Oxlint `1.81.0` (`.oxlintrc.json`) - High-performance Rust-based JavaScript/React linter

## Key Dependencies

**Critical:**
- `@prisma/client` `^6.4.0` / `prisma` `^6.4.0` - ORM client and database schema migrations (`prisma/schema.prisma`)
- `@vectorize-io/hindsight-client` `^0.10.1` - Hindsight Cloud semantic memory client (`server/services/agentService.js`, `server/services/connectDotsService.js`)
- Local Ollama Client (Native HTTP via `fetch` to `http://localhost:11434`) - Local LLM grounded inference (`qwen2.5:3b`) (`server/services/ollamaService.js`)
- `zod` `^4.6.5` - Schema validation for environment and payloads (`server/config/env.js`)
- `framer-motion` `^13.5.0` - UI micro-interactions and transitions
- `three` `^0.186.1`, `@react-three/fiber` `^9.8.1`, `@react-three/drei` `^10.7.9` - 3D visual intelligence sphere and pattern graphs

**Infrastructure & Security:**
- `helmet` `^8.3.0` - HTTP security response headers (`server/app.js`)
- `cors` `^2.8.6` - Cross-Origin Resource Sharing configuration (`server/app.js`)
- `express-rate-limit` `^8.7.0` - API request rate limiting (`server/middlewares/rateLimiter.js`)
- `pino` `^10.3.1` & `pino-http` `^11.0.0` - Structured JSON logging (`server/middlewares/loggerMiddleware.js`)
- `dotenv` `^18.0.4` - Environment variable resolution (`server/config/env.js`)
- `tailwindcss` `^4.3.3` & `@tailwindcss/vite` `^4.3.3` - Modern utility-first CSS engine

## Configuration

**Environment:**
- Centralized schema validation in `server/config/env.js` using Zod
- Environment file template: `.env.example`
- Critical runtime variables:
  - `PORT`: Server port (default 5000)
  - `DATABASE_URL`: PostgreSQL connection string
  - `OLLAMA_BASE_URL`: Ollama local endpoint (default `http://localhost:11434`)
  - `OLLAMA_MODEL`: Target model (default `qwen2.5:3b`)
  - `HINDSIGHT_API_KEY`: Vector memory API key (optional, graceful fallback if missing)
  - `HINDSIGHT_BANK_ID`: Memory bank ID (`competitorIQ`)
  - `FRONTEND_URL`: Client application URL for CORS

**Build:**
- `vite.config.js`: React plugin, Tailwind CSS Vite plugin, development proxy to backend port 5000
- `.oxlintrc.json`: Linter rule configuration for correctness and React hooks

## Platform Requirements

**Development:**
- Node.js >= 22.0.0
- PostgreSQL database instance (local or remote)
- Local Ollama daemon running on `http://localhost:11434` with model `qwen2.5:3b`

**Production:**
- Node.js runtime container or VPS with PostgreSQL access
- Static asset hosting for Vite build output (`dist/`) or served via Express

---

*Stack analysis: 2026-10-05*
