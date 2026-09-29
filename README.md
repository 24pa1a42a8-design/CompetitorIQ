# CompetitorIQ
### Competitive Intelligence That Remembers, Connects the Dots, and Learns Over Time

CompetitorIQ is an AI-assisted competitive intelligence workspace designed to help teams understand what competitors are doing, why those changes matter, and how activity across time connects. Instead of treating every competitor update as an isolated event, CompetitorIQ brings competitor signals, comparisons, timelines, strategic patterns, and AI-generated analysis into one place.

Its memory layer is built around **Hindsight** and the ideas of **Retain, Recall, and Reflect**—so historical context can inform later analysis rather than disappearing after a single interaction.

> **Core idea:** Competitor activity is more useful when today's signals can be understood in the context of yesterday's decisions and tomorrow's strategy.

---

## Table of Contents

- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [Key Capabilities](#key-capabilities)
- [How Hindsight Memory Fits In](#how-hindsight-memory-fits-in)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Typical Workflow](#typical-workflow)
- [Project Structure](#project-structure)
- [Security and Data Notes](#security-and-data-notes)
- [Roadmap](#roadmap)
- [Acknowledgements](#acknowledgements)

## The Problem

Competitive research often gets scattered across websites, product pages, announcements, reports, and spreadsheets. A single update may look minor on its own, while its significance becomes clear only after comparing it with earlier changes.

Common challenges include:

- Competitor information spread across multiple places.
- Repeated manual research and comparison.
- Difficulty seeing how pricing, features, messaging, and positioning evolve.
- Losing context between one research session and the next.
- Turning raw observations into a clear, evidence-based strategic view.

## The Solution

CompetitorIQ brings competitor information and analysis into a unified workspace. It is designed to help users explore competitor profiles, compare offerings, review activity over time, identify connected signals, and prepare concise strategic summaries.

The goal is not simply to collect more information. It is to make historical context easier to retrieve and make relationships between separate competitor signals easier to investigate.

## Key Capabilities

The workspace includes views and backend modules for the following areas. Availability and output quality depend on the project's configured data sources, environment variables, and integrations.

| Capability | Purpose |
|---|---|
| **Competitor Profiles** | Review information associated with individual competitors. |
| **Competitive Comparison** | Compare competitors and examine differences across available attributes. |
| **Competitor Ecosystem** | Explore the broader competitive landscape. |
| **Activity Timeline** | Follow competitor-related events and changes over time. |
| **Monitoring and Alerts** | Organize monitoring logic and surface notable activity where configured. |
| **Connect the Dots** | Investigate relationships between separate events or observations. |
| **Strategic Analysis** | Turn collected signals into structured analysis. |
| **Executive Reports** | Present key findings in a concise, decision-support format. |
| **Hindsight Memory** | Preserve and retrieve useful context from prior activity and analysis. |
| **Dashboard** | Bring important information and entry points together. |

## How Hindsight Memory Fits In

Competitor intelligence becomes more useful when the system can work with historical context. CompetitorIQ integrates a Hindsight-oriented memory layer so that memory can support analysis across multiple interactions.

The approach is organized around three concepts:

### 1. Retain — Preserve useful context

Relevant competitor observations, research findings, and analysis can be retained in memory when the integration and data flow are configured. This creates a foundation for using earlier context in later work.

### 2. Recall — Retrieve relevant history

When investigating a competitor or a new signal, the system can retrieve relevant remembered context instead of relying only on the latest observation.

### 3. Reflect — Connect signals and derive insight

The agent can use recalled context to examine recurring themes, changes in positioning, and possible relationships between events. Findings should be treated as analysis to investigate—not as proof of causation unless supported by evidence.

**Example workflow:** A competitor changes a product feature. On its own, the update may be small. With relevant historical context, the analyst can compare it with earlier feature changes, pricing updates, or messaging shifts and investigate whether a broader pattern is emerging.

Hindsight resources:

- [Hindsight Documentation](https://hindsight.vectorize.io/)
- [Hindsight GitHub Repository](https://github.com/vectorize-io/hindsight)
- [What Is Agent Memory?](https://vectorize.io/what-is-agent-memory)

## System Architecture

CompetitorIQ is organized as a web application with a user interface and a server-side layer.

```text
CompetitorIQ
├── Web interface
│   └── Dashboard and analytical views
│       ├── Competitor profiles
│       ├── Competitive comparison
│       ├── Competitor ecosystem
│       ├── Activity timeline
│       ├── Connect the dots
│       ├── Strategic patterns and analysis
│       ├── Executive reports
│       └── Hindsight memory
└── Server
    ├── Controllers and API handlers
    ├── Data-source adapters
    ├── Ingestion and monitoring
    ├── Alert handling
    ├── Competitor analysis
    ├── Executive reporting
    ├── Hindsight integration
    ├── Middleware and logging
    └── Database and repositories
```

### High-level data flow

1. **Collect:** Configured data sources provide competitor-related information.
2. **Ingest:** Server-side ingestion components process incoming information.
3. **Organize:** Competitor and event data is made available to the relevant application modules.
4. **Analyze:** Comparison and strategic-analysis components help interpret the collected signals.
5. **Remember:** The Hindsight integration can retain useful context for future interactions.
6. **Recall and reflect:** Relevant historical context can inform follow-up investigations and summaries.
7. **Present:** The interface surfaces findings through timelines, comparisons, dashboards, and reports.

The exact flow depends on the integrations and configuration enabled in a particular deployment.

## Technology Stack

The repository structure indicates a JavaScript-based application with a React-style frontend and a Node.js server layer. The server also contains Prisma-related project files and dedicated Hindsight configuration/integration modules.

- **Frontend:** React and JSX-based views
- **Styling:** Utility-class-based styling is present in the UI
- **Backend:** Node.js server-side modules and controllers
- **Data layer:** Prisma-related files and database configuration
- **Agent memory:** Hindsight integration
- **Configuration:** Environment configuration, source configuration, and logging modules

Check the repository's `package.json` and server configuration for the exact dependency versions and supported scripts.

## Getting Started

### Prerequisites

Install the following before running the project:

- [Node.js](https://nodejs.org/) — use a version compatible with the dependencies in the repository.
- npm, which is included with Node.js.
- Git.
- Access credentials for any external services enabled by your configuration, including Hindsight if the project uses a hosted instance.

### 1. Clone the repository

```bash
git clone https://github.com/24pa1a42a-design/CompetitorIQ.git
cd CompetitorIQ
```

### 2. Install dependencies

Run this from the repository root:

```bash
npm install
```

If the `server` directory contains its own `package.json`, install its dependencies separately:

```bash
cd server
npm install
cd ..
```

### 3. Configure environment variables

Create the required local environment file(s) based on the variable names read by the project's configuration modules. See [Environment Configuration](#environment-configuration).

### 4. Start the application

Inspect the available scripts before choosing a command:

```bash
npm run
```

Then run the script defined in the root `package.json`, for example:

```bash
npm run dev
```

Only use `npm run dev` if that script exists. If the frontend and server have separate package files and scripts, start each component using its documented script in a separate terminal.

## Environment Configuration

Do not commit API keys, passwords, database credentials, access tokens, or private environment files.

The project contains configuration modules for the database, environment, Hindsight, logging, and data sources. Check those files and the relevant package scripts to identify the exact variable names required by your local setup.

A documentation-only example of the kinds of values a deployment may require is shown below. These names are illustrative, not a guarantee that the application reads these exact variables:

```env
# Use the exact variable names expected by your application.
DATABASE_URL=your_database_connection_string
HINDSIGHT_API_URL=your_hindsight_service_url
HINDSIGHT_API_KEY=your_hindsight_api_key
LLM_API_KEY=your_model_provider_api_key
```

Before running the application:

1. Match each variable to the code in the configuration files.
2. Add only the variables actually required by the enabled integrations.
3. Keep real secrets in a local `.env` file or a secret manager.
4. Ensure `.env` files are listed in `.gitignore`.
5. Never paste real keys into README files, source code, screenshots, or public issues.

## Typical Workflow

1. Open the dashboard and choose a competitor or analysis area.
2. Review the available competitor profile and comparison information.
3. Inspect the activity timeline to understand what changed and when.
4. Investigate connections between observations using the relevant analysis view.
5. Use the agent to explore a question or request a summary, where configured.
6. Use recalled historical context to compare the current signal with earlier findings.
7. Review the generated analysis and verify important claims against their underlying sources.
8. Use the executive-report view to communicate the findings.

## Project Structure

The following is a simplified map of the repository's visible modules. Individual filenames may change as development continues.

```text
CompetitorIQ/
├── public/
├── src/
│   └── views/
│       ├── ActivityTimeline.jsx
│       ├── CompetitorComparisonView.jsx
│       ├── CompetitorEcosystemView.jsx
│       ├── CompetitorProfileView.jsx
│       ├── ConnectTheDotsView.jsx
│       ├── DashboardView.jsx
│       ├── ExecutiveReportView.jsx
│       ├── HindsightMemoryView.jsx
│       └── StrategicPatternsView.jsx
├── server/
│   ├── adapters/
│   ├── alerts/
│   ├── config/
│   │   ├── database.js
│   │   ├── env.js
│   │   ├── hindsight.js
│   │   ├── logger.js
│   │   └── sourcesConfig.js
│   ├── controllers/
│   │   ├── agentController.js
│   │   ├── competitorController.js
│   │   ├── competitorComparisonController.js
│   │   ├── executiveReportController.js
│   │   ├── hindsightController.js
│   │   ├── ingestionController.js
│   │   ├── monitoringController.js
│   │   └── strategicAnalysisController.js
│   ├── hindsight/
│   ├── ingestion/
│   ├── middlewares/
│   └── repositories/
├── prisma/
├── package.json
└── README.md
```

This tree is an overview, not an exhaustive file listing. Refer to the repository for the current source of truth.

## Security and Data Notes

- Use only data sources you are authorized to access.
- Respect the terms of service, robots policies, and rate limits of external websites and APIs.
- Clearly distinguish sourced facts from model-generated interpretations.
- Preserve source links and timestamps where possible so findings can be checked.
- Treat automated analysis as decision support, not a substitute for verification.
- Keep credentials and personal or confidential data out of public commits.
- Review `.gitignore` before pushing the repository, especially for `.env`, build output, dependency folders, local databases, and logs.

## Roadmap

Potential next steps for the project include:

- Improve source coverage and data freshness.
- Strengthen entity matching and deduplication across sources.
- Add source citations and timestamps to generated findings.
- Make historical changes easier to compare visually.
- Evaluate memory retrieval quality with repeatable test scenarios.
- Add tests for ingestion, analysis, and error handling.
- Improve monitoring reliability and alert relevance.
- Document deployment, database migrations, and API contracts.

## Acknowledgements

- [Hindsight by Vectorize](https://github.com/vectorize-io/hindsight) for the agent-memory technology and concepts.
- The open-source ecosystem that supports web applications, data ingestion, and AI-assisted analysis.

---

**CompetitorIQ — Retain the signal. Recall the context. Reflect on the pattern.**
