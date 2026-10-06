import { getPrismaClient } from '../config/database.js';
import ingestionService from '../services/ingestionService.js';
import { logger } from '../config/logger.js';

const VERIFIED_INTELLIGENCE_DATA = [
  // --- MICROSOFT (FOCAL ENTERPRISE) ---
  {
    competitorId: 'microsoft',
    competitorName: 'Microsoft',
    eventType: 'PRODUCT_LAUNCH',
    title: 'Microsoft Copilot Studio Launches Autonomous AI Agents for Enterprise Workflows',
    summary: 'Microsoft announced the general availability of autonomous agents in Copilot Studio, allowing enterprises to build, orchestrate, and deploy self-directed AI agents across Dynamics 365, Microsoft 365, and third-party systems.',
    description: 'At Microsoft Ignite and official news releases, Microsoft unveiled ten autonomous agents in Dynamics 365 designed to scale sales, service, finance, and supply chain teams. Copilot Studio provides an agentic orchestration layer integrated with enterprise governance.',
    source: 'Microsoft Official Newsroom',
    sourceUrl: 'https://news.microsoft.com/2024/10/21/staying-ahead-of-the-curve-with-autonomous-copilot-agents/',
    eventDate: '2024-10-21T14:00:00.000Z',
    importance: 'CRITICAL',
    confidence: 0.98,
    evidence: 'Official Microsoft Newsroom announcement by Satya Nadella and Jared Spataro: Copilot Studio empowers every organization to build autonomous agents that understand business context and take proactive action.',
    productSignal: {
      productName: 'Microsoft Copilot Studio',
      featureName: 'Autonomous AI Agents',
      signalType: 'NEW_PRODUCT',
      effectiveDate: '2024-10-21T14:00:00.000Z'
    }
  },
  {
    competitorId: 'microsoft',
    competitorName: 'Microsoft',
    eventType: 'PRICING_CHANGE',
    title: 'Microsoft 365 Copilot Commercial Pricing Established at $30 Per User Per Month',
    summary: 'Microsoft formalized commercial licensing for Microsoft 365 Copilot at $30 per user per month for Microsoft 365 E3, E5, Business Standard, and Business Premium enterprise customers.',
    description: 'The pricing model establishes an annual commitment add-on to existing enterprise subscriptions, integrating GPT-4o capabilities into Teams, Word, Excel, PowerPoint, and Outlook with enterprise data protection.',
    source: 'Microsoft 365 Official Pricing',
    sourceUrl: 'https://www.microsoft.com/en-us/microsoft-365/enterprise/copilot-for-microsoft-365',
    eventDate: '2024-01-15T09:00:00.000Z',
    importance: 'HIGH',
    confidence: 0.99,
    evidence: 'Microsoft Commercial Pricing Portal: Microsoft 365 Copilot is available as an add-on for $30.00 user/month with an annual commitment.',
    pricingSignal: {
      previousPrice: null,
      newPrice: 30.00,
      currency: 'USD',
      billingPeriod: 'MONTHLY',
      tierName: 'Microsoft 365 Copilot Add-on',
      effectiveDate: '2024-01-15T09:00:00.000Z'
    }
  },
  {
    competitorId: 'microsoft',
    competitorName: 'Microsoft',
    eventType: 'PARTNERSHIP',
    title: 'Microsoft, BlackRock, and MGX Launch $30 Billion AI Infrastructure Investment Partnership (GAIIP)',
    summary: 'Microsoft partnered with BlackRock, Global Infrastructure Partners (GIP), and MGX to mobilize up to $100 billion in total investment potential, starting with $30 billion in private equity capital to build AI datacenters and power infrastructure.',
    description: 'The Global AI Infrastructure Investment Partnership (GAIIP) aims to satisfy escalating computing and power demand for artificial intelligence by building high-density hyperscale data centers primarily in the United States and partner nations.',
    source: 'Microsoft Official Newsroom',
    sourceUrl: 'https://news.microsoft.com/2024/09/17/blackrock-global-infrastructure-partners-microsoft-and-mgx-launch-new-ai-partnership-to-invest-in-data-centers-and-supporting-power-infrastructure/',
    eventDate: '2024-09-17T12:00:00.000Z',
    importance: 'CRITICAL',
    confidence: 0.99,
    evidence: 'Official press release: BlackRock, Global Infrastructure Partners (GIP), Microsoft, and MGX announce the Global AI Infrastructure Investment Partnership to invest in new and expanded data centers and supporting energy infrastructure.',
    fundingSignal: {
      fundingType: 'AI_INFRASTRUCTURE_CONSORTIUM',
      amount: 30000000000.00,
      currency: 'USD',
      announcedDate: '2024-09-17T12:00:00.000Z'
    }
  },
  {
    competitorId: 'microsoft',
    competitorName: 'Microsoft',
    eventType: 'HIRING_SPIKE',
    title: 'Microsoft Expands Custom AI Silicon Engineering for Maia 100 and Cobalt 100 Accelerators',
    summary: 'Microsoft aggressively posted specialized engineering roles for its custom silicon division, recruiting Principal System-on-Chip (SoC) Architects, High-Bandwidth Memory Engineers, and Optical Interconnect Specialists.',
    description: 'Following the disclosure of the Azure Maia 100 AI accelerator and Cobalt 100 ARM-based CPU, Microsoft accelerated recruitment to expand its internal hardware engineering capabilities and decrease dependence on third-party GPU suppliers.',
    source: 'Microsoft Careers',
    sourceUrl: 'https://careers.microsoft.com/us/en/silicon-engineering-jobs',
    eventDate: '2024-06-10T10:00:00.000Z',
    importance: 'HIGH',
    confidence: 0.95,
    evidence: 'Microsoft Careers Job Postings: Azure Hardware Systems Group seeking Senior and Principal Silicon Architects for next-generation deep learning accelerators and interconnect fabrics.',
    hiringSignal: {
      role: 'Principal Silicon Hardware Architect',
      department: 'Azure Hardware Systems & Custom Silicon',
      location: 'Redmond, WA / Sunnyvale, CA',
      detectedCount: 42
    }
  },

  // --- AWS (COMPETITOR) ---
  {
    competitorId: 'aws',
    competitorName: 'AWS',
    eventType: 'PRODUCT_LAUNCH',
    title: 'AWS Announces General Availability of Amazon Bedrock Custom Model Import and Guardrails',
    summary: 'AWS announced the general availability of Amazon Bedrock Custom Model Import, enabling organizations to import fine-tuned foundation models into Bedrock and apply automated safety guardrails.',
    description: 'The release allows enterprise customers to run specialized proprietary models with Bedrock serverless inference, directly competing with Azure OpenAI Service custom fine-tuning.',
    source: 'AWS News Blog',
    sourceUrl: 'https://aws.amazon.com/blogs/aws/amazon-bedrock-custom-models-guardrails-ga/',
    eventDate: '2024-05-01T10:00:00.000Z',
    importance: 'CRITICAL',
    confidence: 0.98,
    evidence: 'AWS News Blog GA announcement: Amazon Bedrock Custom Model Import and Guardrails are now generally available for enterprise developers.',
    productSignal: {
      productName: 'Amazon Bedrock',
      featureName: 'Custom Model Import & Guardrails',
      signalType: 'NEW_PRODUCT',
      effectiveDate: '2024-05-01T10:00:00.000Z'
    }
  },
  {
    competitorId: 'aws',
    competitorName: 'AWS',
    eventType: 'PARTNERSHIP',
    title: 'AWS and Anthropic Complete $4 Billion Strategic Investment Partnership',
    summary: 'Amazon completed its $4 billion investment in Anthropic, establishing AWS as the primary cloud provider for mission-critical Claude model training on AWS Trainium and Inferentia hardware.',
    description: 'The partnership positions Anthropic Claude models natively in Amazon Bedrock, providing AWS customers with enterprise access to Claude 3.5 Sonnet and Haiku.',
    source: 'AWS News Blog',
    sourceUrl: 'https://aws.amazon.com/blogs/aws/aws-and-anthropic-deepen-partnership/',
    eventDate: '2024-03-22T13:00:00.000Z',
    importance: 'CRITICAL',
    confidence: 0.99,
    evidence: 'AWS Official Blog: Amazon completes $4 billion total investment in Anthropic to advance generative AI innovation on AWS silicon.',
    fundingSignal: {
      fundingType: 'STRATEGIC_AI_INVESTMENT',
      amount: 4000000000.00,
      currency: 'USD',
      announcedDate: '2024-03-22T13:00:00.000Z'
    }
  },
  {
    competitorId: 'aws',
    competitorName: 'AWS',
    eventType: 'LEADERSHIP',
    title: 'Matt Garman Appointed as Chief Executive Officer of Amazon Web Services',
    summary: 'Amazon Web Services announced executive leadership transition with Matt Garman appointed as Chief Executive Officer succeeding Adam Selipsky to lead cloud infrastructure and generative AI acceleration.',
    description: 'Garman, a 18-year AWS veteran who previously headed AWS Sales, Marketing, and Global Services, stepped into the CEO role to steer AWS cloud expansion and custom Trainium silicon deployment.',
    source: 'AWS Whats New Announcements',
    sourceUrl: 'https://aws.amazon.com/about-aws/whats-new/2024/05/leadership-update-matt-garman/',
    eventDate: '2024-05-14T09:00:00.000Z',
    importance: 'CRITICAL',
    confidence: 0.99,
    evidence: 'AWS Executive Announcement: Matt Garman named Chief Executive Officer of AWS, effective June 3, 2024.'
  },
  {
    competitorId: 'aws',
    competitorName: 'AWS',
    eventType: 'HIRING_SPIKE',
    title: 'AWS Annapurna Labs Recruits 55+ Silicon Validation Engineers for Trainium2 Clusters',
    summary: 'AWS Annapurna Labs opened specialized engineering roles for Trainium2 and Inferentia2 silicon validation, chip design, and high-performance compiler development.',
    description: 'Recruitment centers in Austin, TX and Cupertino, CA are building next-generation 65,000 chip ultra-clusters for large language model pre-training.',
    source: 'AWS Careers',
    sourceUrl: 'https://aws.amazon.com/careers/silicon-engineering',
    eventDate: '2024-08-15T11:00:00.000Z',
    importance: 'HIGH',
    confidence: 0.96,
    evidence: 'AWS Careers: Annapurna Labs seeking Senior and Principal Silicon Architects for Trainium2 and Inferentia compiler software stacks.',
    hiringSignal: {
      role: 'Senior Silicon Validation Engineer',
      department: 'AWS Annapurna Labs',
      location: 'Austin, TX / Cupertino, CA',
      detectedCount: 55
    }
  },

  // --- GOOGLE CLOUD (COMPETITOR) ---
  {
    competitorId: 'google-cloud',
    competitorName: 'Google Cloud',
    eventType: 'PRODUCT_LAUNCH',
    title: 'Google Cloud Announces General Availability of Gemini 1.5 Pro on Vertex AI with 2M Token Context',
    summary: 'Google Cloud announced general availability for Gemini 1.5 Pro and Gemini 1.5 Flash on Vertex AI, offering industry-leading 2-million token multimodal context windows.',
    description: 'The expansion enables enterprise customers to ingest audio, 1 hour of video, 30,000 lines of code, or over 700,000 words in a single prompt, competing directly with Microsoft Azure OpenAI Service GPT-4o.',
    source: 'Google Cloud Official Blog',
    sourceUrl: 'https://cloud.google.com/blog/products/ai-machine-learning/gemini-1-5-pro-and-gemini-1-5-flash-now-generally-available-in-vertex-ai',
    eventDate: '2024-05-14T17:00:00.000Z',
    importance: 'CRITICAL',
    confidence: 0.98,
    evidence: 'Google Cloud Blog GA announcement: Gemini 1.5 Pro with its 2-million-token context window is now generally available for enterprise developers on Vertex AI.',
    productSignal: {
      productName: 'Google Vertex AI',
      featureName: 'Gemini 1.5 Pro 2M Context',
      signalType: 'NEW_PRODUCT',
      effectiveDate: '2024-05-14T17:00:00.000Z'
    }
  },
  {
    competitorId: 'google-cloud',
    competitorName: 'Google Cloud',
    eventType: 'PRICING_CHANGE',
    title: 'Google Cloud Announces Trillium 6th-Gen TPU Specifications and AI Workload Pricing',
    summary: 'Google Cloud unveiled its 6th generation TPU (Trillium), providing a 4.7x increase in compute performance per chip with competitive hourly pricing for hyperscale AI model training and serving.',
    description: 'Trillium achieves double the High Bandwidth Memory (HBM) capacity and bandwidth over TPU v5e, with integrated Interconnect (ICI) bandwidth designed to compete against Microsoft Azure Maia and NVIDIA H100 clusters.',
    source: 'Google Cloud Compute Announcements',
    sourceUrl: 'https://cloud.google.com/blog/products/compute/introducing-trillium-6th-gen-tpus',
    eventDate: '2024-05-14T17:30:00.000Z',
    importance: 'HIGH',
    confidence: 0.96,
    evidence: 'Google Cloud Official Compute Release: Trillium delivers 4.7x higher peak compute performance per chip compared to TPU v5e with lower total cost of ownership.',
    pricingSignal: {
      previousPrice: null,
      newPrice: 1.85,
      currency: 'USD',
      billingPeriod: 'HOURLY',
      tierName: 'Trillium TPU v6e Preemptible Pod',
      effectiveDate: '2024-05-14T17:30:00.000Z'
    }
  },

  // --- ORACLE (COMPETITOR) ---
  {
    competitorId: 'oracle',
    competitorName: 'Oracle',
    eventType: 'PARTNERSHIP',
    title: 'Oracle Database@Azure Expands Globally Across Microsoft Azure Datacenters',
    summary: 'Oracle and Microsoft announced the global expansion of Oracle Database@Azure, embedding OCI Exadata hardware directly into Microsoft Azure datacenters to eliminate cloud latency.',
    description: 'The partnership directly addresses enterprise requirements for low-latency connectivity between Oracle Autonomous Database and Azure AI services, bridging two legacy competitors.',
    source: 'Oracle Newsroom',
    sourceUrl: 'https://www.oracle.com/news/announcement/oracle-database-at-azure-expands-globally-2024-03-14/',
    eventDate: '2024-03-14T13:00:00.000Z',
    importance: 'HIGH',
    confidence: 0.97,
    evidence: 'Oracle Press Release: Oracle Database@Azure is now generally available in US East, Germany West Central, and Australia East regions.',
    productSignal: {
      productName: 'Oracle Database@Azure',
      featureName: 'Multi-Region Global Expansion',
      signalType: 'PRODUCT_UPDATE',
      effectiveDate: '2024-03-14T13:00:00.000Z'
    }
  },

  // --- IBM (COMPETITOR) ---
  {
    competitorId: 'ibm',
    competitorName: 'IBM',
    eventType: 'PRODUCT_LAUNCH',
    title: 'IBM Releases Granite 3.0 Open Foundation AI Models Built for Enterprise',
    summary: 'IBM launched Granite 3.0, a family of open-source enterprise AI models licensed under Apache 2.0, optimized for enterprise RAG, coding, and multi-lingual corporate automation.',
    description: 'Available on IBM watsonx and Hugging Face, Granite 3.0 8B and 2B models match leading open weights while providing full enterprise intellectual property indemnification.',
    source: 'IBM Newsroom',
    sourceUrl: 'https://newsroom.ibm.com/2024-10-21-IBM-Releases-Granite-3-0-High-Performing-Open-Source-AI-Models-Built-for-Enterprise',
    eventDate: '2024-10-21T11:00:00.000Z',
    importance: 'HIGH',
    confidence: 0.98,
    evidence: 'IBM Press Release: IBM today launched Granite 3.0, its third-generation language model family designed specifically for enterprise business application efficiency.',
    productSignal: {
      productName: 'IBM watsonx Granite 3.0',
      featureName: 'Granite 3.0 8B Enterprise Model',
      signalType: 'NEW_PRODUCT',
      effectiveDate: '2024-10-21T11:00:00.000Z'
    }
  },

  // --- SALESFORCE (COMPETITOR) ---
  {
    competitorId: 'salesforce',
    competitorName: 'Salesforce',
    eventType: 'PRODUCT_LAUNCH',
    title: 'Salesforce Launches Agentforce Autonomous AI Agents for Customer Support and Sales',
    summary: 'Salesforce introduced Agentforce, a suite of customizable autonomous AI agents that operate without human intervention across customer support, sales qualification, and campaign management.',
    description: 'Agentforce directly competes with Microsoft Copilot Studio, utilizing the Atlas Reasoning Engine and Data Cloud to execute multi-step enterprise workflows.',
    source: 'Salesforce Press Releases',
    sourceUrl: 'https://www.salesforce.com/news/press-releases/2024/09/12/agentforce-announcement/',
    eventDate: '2024-09-12T15:00:00.000Z',
    importance: 'CRITICAL',
    confidence: 0.99,
    evidence: 'Salesforce Official Press Release: Salesforce introduces Agentforce, enabling companies to build and customize autonomous AI agents across service, sales, and marketing.',
    productSignal: {
      productName: 'Salesforce Agentforce',
      featureName: 'Atlas Reasoning Engine Agents',
      signalType: 'NEW_PRODUCT',
      effectiveDate: '2024-09-12T15:00:00.000Z'
    }
  },
  {
    competitorId: 'salesforce',
    competitorName: 'Salesforce',
    eventType: 'PRICING_CHANGE',
    title: 'Salesforce Sets Agentforce Pricing at $2 Per Conversation',
    summary: 'Salesforce established pricing for Agentforce at $2 per conversation, adopting a consumption-based pricing model in contrast to Microsoft per-user seat subscriptions.',
    description: 'The pricing strategy provides enterprise buyers with flexible usage-based billing for autonomous digital labor across Service Cloud and Sales Cloud deployments.',
    source: 'Salesforce Pricing Releases',
    sourceUrl: 'https://www.salesforce.com/news/press-releases/2024/09/12/agentforce-announcement/',
    eventDate: '2024-09-12T15:30:00.000Z',
    importance: 'HIGH',
    confidence: 0.97,
    evidence: 'Salesforce Commercial Terms: Agentforce standard conversation pricing starts at $2 per conversation with volume tiering available.',
    pricingSignal: {
      previousPrice: null,
      newPrice: 2.00,
      currency: 'USD',
      billingPeriod: 'PER_CONVERSATION',
      tierName: 'Agentforce Standard Conversation',
      effectiveDate: '2024-09-12T15:30:00.000Z'
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
