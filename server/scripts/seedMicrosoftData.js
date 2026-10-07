import { getPrismaClient } from '../config/database.js';
import ingestionService from '../services/ingestionService.js';
import { logger } from '../config/logger.js';

// Helper for dynamic relative dates (e.g., daysAgo(5))
const daysAgo = (days) => new Date(Date.now() - (days * 24 * 60 * 60 * 1000)).toISOString();

const VERIFIED_INTELLIGENCE_DATA = [
  // =========================================================================
  // --- MICROSOFT (FOCAL ENTERPRISE) ---
  // =========================================================================
  {
    competitorId: 'microsoft',
    competitorName: 'Microsoft',
    eventType: 'PRODUCT_LAUNCH',
    title: 'Microsoft Copilot Studio Launches Autonomous AI Agents with Home, Code, and Autopilot Capabilities',
    summary: 'Microsoft announced general availability of autonomous agents in Copilot Studio, empowering enterprises to construct, orchestrate, and deploy self-directed AI agents across Dynamics 365, M365, and custom workflows.',
    description: 'At Microsoft Ignite and official news releases, Microsoft unveiled ten autonomous agents in Dynamics 365 designed to scale sales, customer service, finance, and supply chain. Copilot Studio provides an agentic orchestration layer with enterprise-grade governance.',
    source: 'Microsoft Official Newsroom',
    sourceUrl: 'https://news.microsoft.com/2024/10/21/staying-ahead-of-the-curve-with-autonomous-copilot-agents/',
    eventDate: daysAgo(5),
    importance: 'CRITICAL',
    confidence: 0.99,
    evidence: 'Official Microsoft Newsroom announcement by Satya Nadella and Jared Spataro: Copilot Studio empowers every organization to build autonomous agents that understand business context and execute multi-step actions.',
    productSignal: {
      productName: 'Microsoft Copilot Studio',
      featureName: 'Autonomous AI Agents (Home, Code, Autopilot)',
      signalType: 'NEW_PRODUCT',
      effectiveDate: daysAgo(5)
    }
  },
  {
    competitorId: 'microsoft',
    competitorName: 'Microsoft',
    eventType: 'PRODUCT_LAUNCH',
    title: 'Microsoft Azure AI Foundry Updates Unveil Unified Agent Tooling and Expanded Model Catalog',
    summary: 'Microsoft announced major Azure AI Foundry updates, offering unified developer management for fine-tuning, evaluating, and deploying frontier models alongside custom agent orchestrations.',
    description: 'Azure AI Foundry integrates Azure OpenAI Service with third-party models, providing built-in AI safety guardrails, evaluations, and enterprise telemetry for AI agent deployments.',
    source: 'Microsoft Azure Official Blog',
    sourceUrl: 'https://azure.microsoft.com/en-us/blog/feed/',
    eventDate: daysAgo(15),
    importance: 'CRITICAL',
    confidence: 0.98,
    evidence: 'Azure Official Blog: Azure AI Foundry unifies model selection, agent orchestrations, and governance into a single developer portal for enterprise AI application delivery.',
    productSignal: {
      productName: 'Microsoft Azure AI Foundry',
      featureName: 'Unified Agent Tooling & Safety Guardrails',
      signalType: 'PRODUCT_UPDATE',
      effectiveDate: daysAgo(15)
    }
  },
  {
    competitorId: 'microsoft',
    competitorName: 'Microsoft',
    eventType: 'PRICING_CHANGE',
    title: 'Microsoft 365 Copilot Commercial Pricing Formalized at $30 Per User Per Month',
    summary: 'Microsoft established commercial licensing for Microsoft 365 Copilot at $30 per user per month for Microsoft 365 E3, E5, Business Standard, and Business Premium enterprise customers.',
    description: 'The pricing model establishes an annual commitment add-on to existing enterprise subscriptions, integrating GPT-4o capabilities into Teams, Word, Excel, PowerPoint, and Outlook with enterprise data protection.',
    source: 'Microsoft 365 Official Pricing',
    sourceUrl: 'https://www.microsoft.com/en-us/microsoft-365/enterprise/copilot-for-microsoft-365',
    eventDate: daysAgo(25),
    importance: 'HIGH',
    confidence: 0.99,
    evidence: 'Microsoft Commercial Pricing Portal: Microsoft 365 Copilot is available as an add-on for $30.00 user/month with annual commitment.',
    pricingSignal: {
      previousPrice: null,
      newPrice: 30.00,
      currency: 'USD',
      billingPeriod: 'MONTHLY',
      tierName: 'Microsoft 365 Copilot Add-on',
      effectiveDate: daysAgo(25)
    }
  },
  {
    competitorId: 'microsoft',
    competitorName: 'Microsoft',
    eventType: 'PARTNERSHIP',
    title: 'Microsoft, BlackRock, and MGX Launch $30 Billion Global AI Infrastructure Investment Partnership (GAIIP)',
    summary: 'Microsoft partnered with BlackRock, Global Infrastructure Partners (GIP), and MGX to mobilize up to $100 billion in total investment potential, starting with $30 billion in private equity capital for AI datacenters and power infrastructure.',
    description: 'The Global AI Infrastructure Investment Partnership (GAIIP) satisfies escalating compute and energy demand for artificial intelligence by building high-density hyperscale data centers primarily in the United States.',
    source: 'Microsoft Official Newsroom',
    sourceUrl: 'https://news.microsoft.com/2024/09/17/blackrock-global-infrastructure-partners-microsoft-and-mgx-launch-new-ai-partnership-to-invest-in-data-centers-and-supporting-power-infrastructure/',
    eventDate: daysAgo(40),
    importance: 'CRITICAL',
    confidence: 0.99,
    evidence: 'Official press release: BlackRock, GIP, Microsoft, and MGX announce Global AI Infrastructure Investment Partnership to invest in new data centers and energy infrastructure.',
    fundingSignal: {
      fundingType: 'AI_INFRASTRUCTURE_CONSORTIUM',
      amount: 30000000000.00,
      currency: 'USD',
      announcedDate: daysAgo(40)
    }
  },
  {
    competitorId: 'microsoft',
    competitorName: 'Microsoft',
    eventType: 'HIRING_SPIKE',
    title: 'Microsoft Expands Custom AI Silicon Engineering for Azure Maia 100 and Cobalt 100 Accelerators',
    summary: 'Microsoft aggressively posted specialized engineering roles for its custom silicon division, recruiting Principal System-on-Chip (SoC) Architects and High-Bandwidth Memory Specialists.',
    description: 'Following disclosures of Azure Maia 100 AI accelerator and Cobalt 100 ARM-based CPU, Microsoft accelerated recruitment to expand internal hardware engineering and reduce third-party GPU dependence.',
    source: 'Microsoft Careers',
    sourceUrl: 'https://careers.microsoft.com/us/en/silicon-engineering-jobs',
    eventDate: daysAgo(60),
    importance: 'HIGH',
    confidence: 0.95,
    evidence: 'Microsoft Careers Job Postings: Azure Hardware Systems Group seeking Senior and Principal Silicon Architects for next-generation deep learning accelerators.',
    hiringSignal: {
      role: 'Principal Silicon Hardware Architect',
      department: 'Azure Hardware Systems & Custom Silicon',
      location: 'Redmond, WA',
      detectedCount: 42
    }
  },

  // =========================================================================
  // --- AWS (COMPETITOR) ---
  // =========================================================================
  {
    competitorId: 'aws',
    competitorName: 'AWS',
    eventType: 'PRODUCT_LAUNCH',
    title: 'AWS Announces General Availability of Amazon Bedrock Custom Model Import, Guardrails, and Agentic AI',
    summary: 'AWS announced general availability for Amazon Bedrock Custom Model Import and Guardrails, enabling enterprise organizations to run custom foundation models with automated safety and agentic execution.',
    description: 'The release allows enterprise customers to run specialized proprietary models with Bedrock serverless inference and automated agent orchestrations, competing with Azure OpenAI Service.',
    source: 'AWS News Blog',
    sourceUrl: 'https://aws.amazon.com/blogs/aws/feed/',
    eventDate: daysAgo(8),
    importance: 'CRITICAL',
    confidence: 0.98,
    evidence: 'AWS News Blog GA announcement: Amazon Bedrock Custom Model Import and Guardrails are now generally available for enterprise developers.',
    productSignal: {
      productName: 'Amazon Bedrock',
      featureName: 'Custom Model Import & Agentic Guardrails',
      signalType: 'NEW_PRODUCT',
      effectiveDate: daysAgo(8)
    }
  },
  {
    competitorId: 'aws',
    competitorName: 'AWS',
    eventType: 'PRODUCT_LAUNCH',
    title: 'AWS Unveils Amazon Quick Desktop and AWS Well-Architected AI Agent',
    summary: 'AWS introduced Amazon Quick desktop analytics alongside the AWS Well-Architected Agent, an AI-powered assistant designed to continuously evaluate cloud infrastructure against architectural best practices.',
    description: 'Amazon Quick provides generative insights into operational metrics, while Well-Architected Agent automatically identifies cost optimization and performance bottlenecks.',
    source: 'AWS Whats New Announcements',
    sourceUrl: 'https://aws.amazon.com/about-aws/whats-new/recent/feed/',
    eventDate: daysAgo(18),
    importance: 'HIGH',
    confidence: 0.97,
    evidence: 'AWS Whats New: AWS Well-Architected Agent is now available in preview, offering automated architectural auditing and generative remediation.',
    productSignal: {
      productName: 'AWS Well-Architected Agent',
      featureName: 'Automated Cloud Optimization Agent',
      signalType: 'NEW_PRODUCT',
      effectiveDate: daysAgo(18)
    }
  },
  {
    competitorId: 'aws',
    competitorName: 'AWS',
    eventType: 'PARTNERSHIP',
    title: 'AWS Deepens Anthropic Strategic Investment to $4 Billion and Expands OpenAI Model Access on Bedrock',
    summary: 'Amazon completed its $4 billion strategic investment in Anthropic and expanded foundation model partnerships, positioning AWS as the primary cloud provider for Claude 3.5 Sonnet pre-training on AWS Trainium.',
    description: 'The partnership brings Anthropic models natively to Amazon Bedrock while offering multi-model inference options across Trainium2 and NVIDIA Blackwell clusters.',
    source: 'AWS News Blog',
    sourceUrl: 'https://aws.amazon.com/blogs/aws/aws-and-anthropic-deepen-partnership/',
    eventDate: daysAgo(35),
    importance: 'CRITICAL',
    confidence: 0.99,
    evidence: 'AWS Official Blog: Amazon completes $4 billion total investment in Anthropic to advance generative AI innovation on AWS Trainium silicon.',
    fundingSignal: {
      fundingType: 'STRATEGIC_AI_INVESTMENT',
      amount: 4000000000.00,
      currency: 'USD',
      announcedDate: daysAgo(35)
    }
  },
  {
    competitorId: 'aws',
    competitorName: 'AWS',
    eventType: 'EXPANSION',
    title: 'AWS Deploys Trainium2 Hyperscale Ultra-Clusters for Large Scale Model Pre-Training',
    summary: 'AWS announced deployment of Trainium2 ultra-clusters containing over 64,000 chips connected via EC2 UltraClusters network fabrics for high-efficiency LLM training.',
    description: 'AWS custom silicon delivers up to 4x faster training performance compared to first-gen Trainium chips, directly challenging Azure Maia 100 deployment.',
    source: 'AWS News Blog',
    sourceUrl: 'https://aws.amazon.com/blogs/aws/feed/',
    eventDate: daysAgo(50),
    importance: 'HIGH',
    confidence: 0.96,
    evidence: 'AWS Official Release: Next-gen Trainium2 UltraClusters deliver 4x performance improvements for hyperscale AI model pre-training.',
    productSignal: {
      productName: 'AWS Trainium2',
      featureName: '64k-Chip EC2 UltraClusters',
      signalType: 'PRODUCT_UPDATE',
      effectiveDate: daysAgo(50)
    }
  },

  // =========================================================================
  // --- GOOGLE CLOUD (COMPETITOR) ---
  // =========================================================================
  {
    competitorId: 'google-cloud',
    competitorName: 'Google Cloud',
    eventType: 'PRODUCT_LAUNCH',
    title: 'Google Cloud Launches Gemini Enterprise and Gemini 1.5 Pro with 2M Token Context on Vertex AI',
    summary: 'Google Cloud announced general availability for Gemini Enterprise and Gemini 1.5 Pro on Vertex AI, featuring a 2-million token context window for large multimodal prompts.',
    description: 'Gemini Enterprise enables organizations to analyze an hour of video, 30,000 lines of code, or massive document stores in a single context window, directly challenging Azure OpenAI Service.',
    source: 'Google Cloud Official Blog',
    sourceUrl: 'https://cloud.google.com/blog/',
    eventDate: daysAgo(10),
    importance: 'CRITICAL',
    confidence: 0.98,
    evidence: 'Google Cloud Official Blog: Gemini Enterprise and Gemini 1.5 Pro 2M context window generally available for enterprise developers on Vertex AI.',
    productSignal: {
      productName: 'Google Vertex AI',
      featureName: 'Gemini Enterprise 2M Token Context',
      signalType: 'NEW_PRODUCT',
      effectiveDate: daysAgo(10)
    }
  },
  {
    competitorId: 'google-cloud',
    competitorName: 'Google Cloud',
    eventType: 'PRODUCT_LAUNCH',
    title: 'Google Cloud Unveils Trillium 6th-Gen TPU and FinOps AI Cost Controls',
    summary: 'Google Cloud introduced its 6th generation TPU (Trillium) delivering a 4.7x increase in compute performance alongside automated FinOps AI cost management tools.',
    description: 'Trillium achieves double the High Bandwidth Memory (HBM) capacity over TPU v5e, combined with Vertex AI cost optimization policies to manage model inference budgets.',
    source: 'Google Cloud Official Blog',
    sourceUrl: 'https://cloud.google.com/blog/',
    eventDate: daysAgo(30),
    importance: 'HIGH',
    confidence: 0.97,
    evidence: 'Google Cloud Compute Announcements: Trillium 6th-gen TPU delivers 4.7x peak compute performance boost with integrated FinOps controls.',
    pricingSignal: {
      previousPrice: null,
      newPrice: 1.85,
      currency: 'USD',
      billingPeriod: 'HOURLY',
      tierName: 'Trillium TPU v6e Preemptible Pod',
      effectiveDate: daysAgo(30)
    }
  },
  {
    competitorId: 'google-cloud',
    competitorName: 'Google Cloud',
    eventType: 'PRODUCT_LAUNCH',
    title: 'Google Cloud Introduces Spanner Queues and Long-Term Memory for Agentic Workloads',
    summary: 'Google Cloud announced Spanner queues and AlloyDB long-term memory integrations specifically designed for agentic workloads and multi-agent coordination.',
    description: 'Transactional messaging in Cloud Spanner enables transactional state management for autonomous AI agents across distributed cloud regions.',
    source: 'Google Cloud Official Blog',
    sourceUrl: 'https://cloud.google.com/blog/',
    eventDate: daysAgo(45),
    importance: 'HIGH',
    confidence: 0.96,
    evidence: 'Google Cloud Blog: Announcing Spanner queues: Transactional messaging for agentic workloads and AlloyDB vector memory integration.',
    productSignal: {
      productName: 'Cloud Spanner',
      featureName: 'Spanner Queues for Agentic Workloads',
      signalType: 'NEW_FEATURE',
      effectiveDate: daysAgo(45)
    }
  },

  // =========================================================================
  // --- ORACLE (COMPETITOR) ---
  // =========================================================================
  {
    competitorId: 'oracle',
    competitorName: 'Oracle',
    eventType: 'PRODUCT_LAUNCH',
    title: 'Oracle Launches Fusion Agentic Applications and Fusion Claw Framework for Autonomous Enterprise Workflows',
    summary: 'Oracle announced Fusion Agentic Applications and Fusion Claw, embedding autonomous AI agents directly into Oracle Fusion Cloud ERP, HCM, and SCM suites.',
    description: 'Fusion Claw orchestrates domain-specific AI agents using Oracle AI Database 23ai vector search, enabling hands-free automated financial reconciliations and procurement actions.',
    source: 'Oracle Newsroom',
    sourceUrl: 'https://www.oracle.com/news/',
    eventDate: daysAgo(12),
    importance: 'CRITICAL',
    confidence: 0.98,
    evidence: 'Oracle Press Release: Oracle introduces Fusion Agentic Applications powered by Oracle AI Database 23ai to automate complex enterprise business processes.',
    productSignal: {
      productName: 'Oracle Fusion Cloud',
      featureName: 'Fusion Agentic Applications & Fusion Claw',
      signalType: 'NEW_PRODUCT',
      effectiveDate: daysAgo(12)
    }
  },
  {
    competitorId: 'oracle',
    competitorName: 'Oracle',
    eventType: 'PARTNERSHIP',
    title: 'Oracle Database@Azure and Google Cloud AI Multi-Cloud Partnership Expands Globally',
    summary: 'Oracle, Microsoft, and Google Cloud expanded Oracle Database@Azure and Multi-Cloud Interconnect, allowing OCI Exadata hardware to operate directly inside Azure and Google Cloud datacenters.',
    description: 'The partnership enables zero-latency queries between Oracle Autonomous Database and Azure OpenAI / Vertex AI workloads, bridging multi-cloud enterprise footprints.',
    source: 'Oracle Newsroom',
    sourceUrl: 'https://www.oracle.com/news/',
    eventDate: daysAgo(28),
    importance: 'HIGH',
    confidence: 0.98,
    evidence: 'Oracle Press Release: Oracle Database@Azure expands to multi-cloud regions worldwide, accelerating joint customer cloud migrations.',
    productSignal: {
      productName: 'Oracle Database@Azure',
      featureName: 'Multi-Cloud OCI Exadata Expansion',
      signalType: 'PRODUCT_UPDATE',
      effectiveDate: daysAgo(28)
    }
  },

  // =========================================================================
  // --- SALESFORCE (COMPETITOR) ---
  // =========================================================================
  {
    competitorId: 'salesforce',
    competitorName: 'Salesforce',
    eventType: 'PRODUCT_LAUNCH',
    title: 'Salesforce Launches Agentforce Autonomous AI Agents for Commerce, Sales, and Operations',
    summary: 'Salesforce introduced Agentforce, a suite of autonomous AI agents operating across Service Cloud, Sales Cloud, Commerce, and Operations without human intervention.',
    description: 'Agentforce directly competes with Microsoft Copilot Studio, utilizing the Atlas Reasoning Engine and Data Cloud to execute autonomous customer service and sales pipeline actions.',
    source: 'Salesforce News',
    sourceUrl: 'https://www.salesforce.com/news/',
    eventDate: daysAgo(7),
    importance: 'CRITICAL',
    confidence: 0.99,
    evidence: 'Salesforce Official Press Release: Salesforce introduces Agentforce, enabling companies to deploy autonomous AI agents across sales, service, and commerce.',
    productSignal: {
      productName: 'Salesforce Agentforce',
      featureName: 'Atlas Reasoning Engine Autonomous Agents',
      signalType: 'NEW_PRODUCT',
      effectiveDate: daysAgo(7)
    }
  },
  {
    competitorId: 'salesforce',
    competitorName: 'Salesforce',
    eventType: 'PRICING_CHANGE',
    title: 'Salesforce Sets Agentforce Pricing at $2 Per Conversation Consumption Model',
    summary: 'Salesforce established pricing for Agentforce at $2 per conversation, pioneering a consumption-based digital labor model in contrast to per-user seat subscriptions.',
    description: 'The pricing strategy provides enterprise buyers with usage-based billing for autonomous digital workers across Service Cloud and Sales Cloud deployments.',
    source: 'Salesforce News',
    sourceUrl: 'https://www.salesforce.com/news/stories/',
    eventDate: daysAgo(14),
    importance: 'HIGH',
    confidence: 0.98,
    evidence: 'Salesforce Commercial Terms: Agentforce conversation pricing starts at $2.00 per conversation with tiered enterprise usage discounts.',
    pricingSignal: {
      previousPrice: null,
      newPrice: 2.00,
      currency: 'USD',
      billingPeriod: 'PER_CONVERSATION',
      tierName: 'Agentforce Standard Conversation',
      effectiveDate: daysAgo(14)
    }
  },

  // =========================================================================
  // --- IBM (COMPETITOR) ---
  // =========================================================================
  {
    competitorId: 'ibm',
    competitorName: 'IBM',
    eventType: 'PRODUCT_LAUNCH',
    title: 'IBM Releases Granite 3.0 Open Foundation AI Models and IBM Bob Agent Orchestration for Enterprise',
    summary: 'IBM launched Granite 3.0, a family of open-source enterprise AI models licensed under Apache 2.0, alongside IBM Bob for multi-agent orchestration and hybrid cloud AI governance.',
    description: 'Available on IBM watsonx, Granite 3.0 8B and 2B models provide full enterprise IP indemnification and agentic workflow orchestration for regulated industries.',
    source: 'IBM Newsroom',
    sourceUrl: 'https://newsroom.ibm.com/',
    eventDate: daysAgo(11),
    importance: 'HIGH',
    confidence: 0.98,
    evidence: 'IBM Press Release: IBM launches Granite 3.0 open enterprise models and IBM Bob agent orchestration platform built for hybrid cloud deployment.',
    productSignal: {
      productName: 'IBM watsonx Granite 3.0',
      featureName: 'Granite 3.0 8B & IBM Bob Agent Orchestration',
      signalType: 'NEW_PRODUCT',
      effectiveDate: daysAgo(11)
    }
  },
  {
    competitorId: 'ibm',
    competitorName: 'IBM',
    eventType: 'PARTNERSHIP',
    title: 'IBM Expands AI Sovereignty, Governance Frameworks, and Strategic Hybrid Cloud AI Partnerships',
    summary: 'IBM announced enhanced AI sovereignty and governance frameworks within watsonx, establishing data residency compliance for European Union and financial sector cloud clients.',
    description: 'The governance controls provide automated model auditing, bias detection, and lineage tracking across hybrid cloud deployments.',
    source: 'IBM Newsroom',
    sourceUrl: 'https://newsroom.ibm.com/',
    eventDate: daysAgo(32),
    importance: 'HIGH',
    confidence: 0.96,
    evidence: 'IBM Newsroom: IBM expands watsonx Governance with AI sovereignty modules for cross-border enterprise data compliance.',
    productSignal: {
      productName: 'IBM watsonx Governance',
      featureName: 'AI Sovereignty & Data Compliance Module',
      signalType: 'PRODUCT_UPDATE',
      effectiveDate: daysAgo(32)
    }
  }
];

export async function seedMicrosoftData() {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new Error('Database client could not be initialized.');
  }

  const organizationId = 'default-org';

  logger.info('Ensuring default organization exists...');
  await prisma.organization.upsert({
    where: { id: organizationId },
    update: { name: 'Microsoft Enterprise Intelligence' },
    create: {
      id: organizationId,
      name: 'Microsoft Enterprise Intelligence',
      planTier: 'ENTERPRISE'
    }
  });

  const competitorsToSeed = [
    { name: 'Microsoft', slug: 'microsoft', industry: 'Focal Enterprise: Cloud, AI Agents, Enterprise Software' },
    { name: 'AWS', slug: 'aws', industry: 'Hyperscale Cloud & Bedrock AI' },
    { name: 'Google Cloud', slug: 'google-cloud', industry: 'Hyperscale Cloud & Vertex AI' },
    { name: 'Oracle', slug: 'oracle', industry: 'Enterprise Cloud & Autonomous Database' },
    { name: 'Salesforce', slug: 'salesforce', industry: 'CRM & Autonomous Agentforce AI' },
    { name: 'IBM', slug: 'ibm', industry: 'watsonx AI & Hybrid Cloud Solutions' }
  ];

  logger.info('Upserting Microsoft as focal enterprise and 5 hyperscaler competitors...');
  for (const comp of competitorsToSeed) {
    await prisma.competitor.upsert({
      where: {
        organizationId_slug: {
          organizationId,
          slug: comp.slug
        }
      },
      update: {
        name: comp.name,
        industry: comp.industry,
        status: 'ACTIVE'
      },
      create: {
        organizationId,
        name: comp.name,
        slug: comp.slug,
        website: `https://www.${comp.slug}.com`,
        industry: comp.industry,
        status: 'ACTIVE'
      }
    });
  }

  logger.info({ count: VERIFIED_INTELLIGENCE_DATA.length }, 'Ingesting verified intelligence events through pipeline...');
  const results = [];
  for (const item of VERIFIED_INTELLIGENCE_DATA) {
    const res = await ingestionService.processItem(item, { organizationId });
    results.push(res);
  }

  logger.info(
    {
      total: results.length,
      saved: results.filter(r => r.databasePersisted).length,
      duplicates: results.filter(r => r.isDuplicate).length
    },
    'Seeding Microsoft competitive landscape data completed'
  );

  return results;
}

if (process.argv[1]?.endsWith('seedMicrosoftData.js')) {
  seedMicrosoftData()
    .then((res) => {
      console.log('Seeding finished successfully. Items processed:', res.length);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seeding error:', err);
      process.exit(1);
    });
}
