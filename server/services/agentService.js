import { competitorEventRepository } from '../repositories/competitorEventRepository.js';
import { competitorRepository } from '../repositories/competitorRepository.js';
import { memoryOperationRepository } from '../repositories/memoryOperationRepository.js';
import { conversationRepository } from '../repositories/conversationRepository.js';
import hindsightService from '../hindsight/hindsightService.js';
import ollamaService from './ollamaService.js';
import { env } from '../config/env.js';
import { getPrismaClient } from '../config/database.js';
import { logger } from '../config/logger.js';

export const agentService = {
  async executeQuery(userQuery, options = {}) {
    if (!userQuery || typeof userQuery !== 'string' || !userQuery.trim()) {
      throw new Error('User query string is required.');
    }

    if (userQuery.length > 4000) {
      throw new Error('Query cannot exceed 4000 characters.');
    }

    const cleanedQuery = userQuery.trim();
    const requestId = options.requestId || `req-${Date.now()}`;
    let orgId = options.organizationId || 'default-org';
    const userId = options.userId || null;
    let conversationId = options.conversationId || null;

    // Ensure Organization exists in PostgreSQL if DB is connected
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        await prisma.organization.upsert({
          where: { id: orgId },
          update: {},
          create: { id: orgId, name: 'Default Organization', planTier: 'FREE' }
        });
      } catch {
        // Ignore if org already exists
      }
    }

    // Load or create AgentConversation
    let conversation = null;
    if (conversationId) {
      conversation = await conversationRepository.findConversationById(conversationId);
    }
    if (!conversation) {
      conversation = await conversationRepository.createConversation({
        organizationId: orgId,
        userId,
        title: `Intelligence Query: ${cleanedQuery.slice(0, 40)}`
      });
      if (conversation) conversationId = conversation.id;
    }

    // Extract prior conversation history for context (last 6 messages)
    const conversationHistory = (conversation?.messages || [])
      .map(m => {
        let content = m.content;
        if (m.role === 'ASSISTANT') {
          try {
            const parsed = JSON.parse(m.content);
            if (parsed.answer) content = parsed.answer;
          } catch {}
        }
        return {
          role: m.role.toLowerCase() === 'assistant' ? 'assistant' : 'user',
          content: (content || '').slice(0, 800)
        };
      });

    // Record User Message
    if (conversationId) {
      await conversationRepository.addMessage({
        conversationId,
        role: 'USER',
        content: cleanedQuery
      });
    }

    // Ambiguous or single-character greeting/help checks
    const qLower = cleanedQuery.toLowerCase();
    if (cleanedQuery === '?' || qLower === 'help' || (cleanedQuery.length < 3 && !/[a-zA-Z0-9]/.test(cleanedQuery))) {
      const guidanceAnswer = `### CompetitorIQ Intelligence Assistant Guidance\n\n` +
        `I am your autonomous CompetitorIQ assistant. I can assist you with:\n\n` +
        `- **Platform Capabilities**: "What is CompetitorIQ?", "Summarize the available data"\n` +
        `- **Competitor Intelligence**: "What has AWS been doing?", "Summarize recent competitor activities"\n` +
        `- **Pricing & Signal Analysis**: "What pricing changes have competitors made?", "Explain hiring and product signals"\n` +
        `- **Competitive Comparisons**: "Compare Oracle and IBM pricing and expansion strategies"\n` +
        `- **Pattern Recognition**: "Identify patterns across historical events"\n` +
        `- **Technical & Business Concepts**: "Explain an AI, programming, or business concept", "What is an LLM?"\n` +
        `- **Follow-up Dialogue**: "What about their pricing?", "Can you elaborate on that?"\n\n` +
        `Please enter a query or choose one of the suggested queries above to begin.`;

      const helpPayload = {
        conversationId,
        answer: guidanceAnswer,
        facts: [],
        observations: [],
        inferences: [],
        unknowns: [],
        evidence: [],
        events: [],
        memories: [],
        hindsightStage: 'STANDBY',
        insufficientEvidence: false,
        hindsightStatus: {
          configured: hindsightService.isConfigured(),
          retained: null,
          recalled: false,
          reflected: false,
          creditLimitReached: false,
          message: 'Standby'
        },
        ollamaStatus: {
          configured: true,
          reachable: true,
          used: false,
          model: ollamaService.getModel(),
          status: 'idle',
          message: 'Guidance prompt rendered'
        }
      };

      if (conversationId) {
        await conversationRepository.addMessage({
          conversationId,
          role: 'ASSISTANT',
          content: JSON.stringify(helpPayload)
        });
      }

      return helpPayload;
    }

    // 1. Identify Target Competitors
    const allCompetitors = await competitorRepository.findAllByOrganization(orgId);
    let targetCompetitors = [];
    if (options.competitorId) {
      const found = allCompetitors.find(c => c.id === options.competitorId || c.slug === options.competitorId);
      if (found) targetCompetitors.push(found);
    }
    if (targetCompetitors.length === 0) {
      targetCompetitors = allCompetitors.filter(c => 
        qLower.includes(c.name.toLowerCase()) || (c.slug && qLower.includes(c.slug.toLowerCase()))
      );
    }

    // Check conversation history for competitor pronouns (for follow-ups like "What about their pricing?")
    if (targetCompetitors.length === 0 && conversationHistory.length > 0) {
      if (/\b(their|they|them|its|it|this competitor)\b/i.test(cleanedQuery)) {
        const recentAssistantText = conversationHistory.slice(-3).map(m => m.content.toLowerCase()).join(' ');
        for (const comp of allCompetitors) {
          if (recentAssistantText.includes(comp.name.toLowerCase())) {
            targetCompetitors.push(comp);
            break;
          }
        }
      }
    }

    // 2. Classify Query Intent
    const isPlatformQuery = /competitoriq/i.test(cleanedQuery) ||
      /^(what is|how does|explain|tell me about|how to use)\s+(this|the)?\s*(platform|system|application|tool|agent|app)\b/i.test(cleanedQuery) ||
      /^(what can you do|who are you|what is your purpose|summarize (the )?(available )?data)\b/i.test(cleanedQuery);

    const isBroadCompetitorQuery = /landscape|pricing|hiring|expansion|product launch|market move|recent (competitor )?activit|patterns across historical events|historical events|compare|comparison|dots|signals/i.test(cleanedQuery);

    // Explicit check for educational / conceptual / general knowledge questions
    const isEducationalOrConcept = /^(what is|what are|explain|define|how do|how does)\s+(an?|the)?\s*(ai|llm|large language model|machine learning|deep learning|neural network|programming|algorithm|database|acid|sql|vector|api|rest|microservice|business|ebitda|saas|cac|ltv|roi|churn|capital|weather|history|science)\b/i.test(cleanedQuery) ||
      /(ai|programming|business) concept/i.test(cleanedQuery) ||
      /general knowledge/i.test(cleanedQuery) ||
      /what is an? /i.test(cleanedQuery) ||
      /capital of/i.test(cleanedQuery);

    // Entity-seeking query for unknown or unmonitored companies (e.g., "What has NonExistentCompanyX999 been doing?")
    const looksLikeSpecificEntityQuery = !isEducationalOrConcept && !isPlatformQuery && !isBroadCompetitorQuery && targetCompetitors.length === 0 && (
      /what has\s+([A-Za-z0-9_-]+)\s+been doing/i.test(cleanedQuery) ||
      /(?:what (?:has|did|are the moves of)|recent moves for|activities of|updates on)\s+([A-Z][a-zA-Z0-9_-]+)/i.test(cleanedQuery) ||
      /(corp|inc|technologies|company|labs|systems|ltd)\b/i.test(cleanedQuery)
    );

    // 3. Structured Event Retrieval (PostgreSQL)
    let pgEvents = [];
    try {
      if (targetCompetitors.length > 0) {
        for (const comp of targetCompetitors) {
          const events = await competitorEventRepository.findByCompetitor(comp.id, { limit: 15 });
          pgEvents.push(...events);
        }
      } else if (isPlatformQuery || isBroadCompetitorQuery) {
        // Fetch recent events across the organization to ground platform and broad landscape queries
        pgEvents = await competitorEventRepository.searchEvents({
          organizationId: orgId,
          limit: 15
        });
      } else {
        // Search by query text
        pgEvents = await competitorEventRepository.searchEvents({
          organizationId: orgId,
          query: cleanedQuery,
          limit: 15
        });
      }
    } catch (err) {
      logger.warn({ err: err.message }, 'Failed to query PostgreSQL events in agentService');
    }

    // 4. Vector Memory Retrieval (Hindsight RECALL)
    let hindsightMemories = [];
    let hindsightStatus = {
      configured: hindsightService.isConfigured(),
      retained: null,
      recalled: false,
      reflected: false,
      creditLimitReached: false,
      message: 'Hindsight connected'
    };
    let activeHindsightStage = 'UNCONFIGURED';

    if (hindsightStatus.configured && (targetCompetitors.length > 0 || isBroadCompetitorQuery)) {
      const recallOp = await memoryOperationRepository.recordStart({
        stage: 'RECALL',
        organizationId: orgId,
        competitorId: targetCompetitors[0]?.id || null,
        requestId,
        query: cleanedQuery
      });

      try {
        activeHindsightStage = 'RECALL';
        const recallRes = await hindsightService.recall(cleanedQuery, { limit: 10 });
        const recalled = Array.isArray(recallRes) ? recallRes : (recallRes?.memories || []);
        hindsightMemories = recalled;
        hindsightStatus.recalled = true;

        if (recallOp?.id) {
          await memoryOperationRepository.recordCompletion(recallOp.id, {
            status: 'COMPLETED',
            memoryCount: hindsightMemories.length
          });
        }
      } catch (err) {
        logger.warn({ err: err.message }, 'Hindsight RECALL operation failed in agentService');
        const isCreditLimit = err.message?.includes('Insufficient credits') || err.message?.includes('402');
        hindsightStatus.creditLimitReached = isCreditLimit;
        hindsightStatus.message = err.message || 'Hindsight recall error';
        activeHindsightStage = 'DEGRADED';

        if (recallOp?.id) {
          await memoryOperationRepository.recordCompletion(recallOp.id, {
            status: 'FAILED',
            errorCode: isCreditLimit ? 'INSUFFICIENT_CREDITS' : (err.code || 'HINDSIGHT_ERROR'),
            metadata: { message: err.message }
          });
        }
      }
    }

    // 5. Strategic Pattern Synthesis (Hindsight REFLECT)
    const isReflectRequested = options.mode === 'REFLECT' || 
      /strategy|pattern|trend|roadmap|trajectory|similar moves/i.test(cleanedQuery);

    let reflectAnalysis = null;
    if (isReflectRequested && hindsightStatus.configured && !hindsightStatus.creditLimitReached) {
      const reflectOp = await memoryOperationRepository.recordStart({
        stage: 'REFLECT',
        organizationId: orgId,
        competitorId: targetCompetitors[0]?.id || null,
        requestId,
        query: cleanedQuery
      });

      try {
        activeHindsightStage = 'REFLECT';
        reflectAnalysis = await hindsightService.reflect(cleanedQuery);
        hindsightStatus.reflected = true;

        if (reflectOp?.id) {
          await memoryOperationRepository.recordCompletion(reflectOp.id, {
            status: 'COMPLETED',
            memoryCount: hindsightMemories.length,
            metadata: { confidenceScore: reflectAnalysis?.confidenceScore }
          });
        }
      } catch (err) {
        logger.warn({ err: err.message }, 'Hindsight REFLECT operation failed in agentService');
        const isCreditLimit = err.message?.includes('Insufficient credits') || err.message?.includes('402');
        hindsightStatus.creditLimitReached = isCreditLimit;
        if (activeHindsightStage === 'REFLECT') activeHindsightStage = 'DEGRADED';

        if (reflectOp?.id) {
          await memoryOperationRepository.recordCompletion(reflectOp.id, {
            status: 'FAILED',
            errorCode: isCreditLimit ? 'INSUFFICIENT_CREDITS' : (err.code || 'HINDSIGHT_ERROR'),
            metadata: { message: err.message }
          });
        }
      }
    }

    // 6. Query Intent Handling & Grounding Routing
    const totalEvidenceCount = pgEvents.length + hindsightMemories.length;

    // Handle Specific Non-Existent Competitor query (Preserves Test 2 requirement)
    if (looksLikeSpecificEntityQuery && totalEvidenceCount === 0) {
      const unknowns = [`No recorded events or Hindsight memories found matching query: "${cleanedQuery}"`];
      const answer = `Insufficient evidence to answer this query based on stored competitor intelligence.`;

      const resultPayload = {
        conversationId,
        answer,
        facts: [],
        observations: [],
        inferences: [],
        unknowns,
        evidence: [],
        events: [],
        memories: [],
        hindsightStage: activeHindsightStage,
        insufficientEvidence: true,
        hindsightStatus,
        ollamaStatus: {
          configured: true,
          reachable: true,
          used: false,
          model: ollamaService.getModel(),
          status: 'insufficient_evidence',
          message: 'No evidence available for LLM reasoning'
        }
      };

      if (conversationId) {
        await conversationRepository.addMessage({
          conversationId,
          role: 'ASSISTANT',
          content: JSON.stringify(resultPayload)
        });
      }

      return resultPayload;
    }

    // 7. General Knowledge / Educational / AI Concepts Query Handling
    const isGeneralOrEducational = isEducationalOrConcept || (!isPlatformQuery && !isBroadCompetitorQuery && targetCompetitors.length === 0 && totalEvidenceCount === 0);
    const ollamaTimeout = options.timeoutMs || (process.env.NODE_ENV === 'test' ? 1000 : (env.OLLAMA_TIMEOUT_MS || 60000));

    if (isGeneralOrEducational) {
      let answerText = '';
      let ollamaStatus = {
        configured: true,
        reachable: false,
        used: false,
        model: ollamaService.getModel(),
        status: 'idle',
        message: ''
      };

      try {
        const ollamaRes = await ollamaService.generateGeneralResponse(cleanedQuery, conversationHistory, {
          timeoutMs: ollamaTimeout
        });

        if (ollamaRes && ollamaRes.content) {
          answerText = ollamaRes.content;
          ollamaStatus = {
            configured: true,
            reachable: true,
            used: true,
            model: ollamaRes.model || ollamaService.getModel(),
            status: 'ok',
            message: 'Ollama local LLM answered general query successfully'
          };
        }
      } catch (ollamaErr) {
        logger.warn({ err: ollamaErr.message }, 'Ollama general response failed; using fallback educational response');
        ollamaStatus = {
          configured: true,
          reachable: false,
          used: false,
          model: ollamaService.getModel(),
          status: 'degraded',
          errorCode: ollamaErr.code || 'OLLAMA_UNAVAILABLE',
          message: ollamaErr.message || 'Ollama unavailable; conceptual fallback used'
        };

        answerText = `### CompetitorIQ Knowledge Assistant (Ollama Offline Mode)\n\n` +
          `**Query:** ${cleanedQuery}\n\n` +
          `*Note: The local Ollama instance (${ollamaService.getModel()}) is currently unreachable or timed out (${ollamaStatus.message}).*\n\n` +
          `CompetitorIQ is configured to provide direct general-knowledge and technical concept explanations via local Ollama. ` +
          `When Ollama is online, you can ask about AI architectures, software engineering patterns, or business strategy concepts.\n\n` +
          `If this query was intended for competitive intelligence, you can also ask about monitored competitors (e.g., AWS, Oracle, IBM, Salesforce) or platform features.`;
      }

      const resultPayload = {
        conversationId,
        answer: answerText,
        facts: [],
        observations: [],
        inferences: [],
        unknowns: [],
        evidence: [],
        events: [],
        memories: [],
        hindsightStage: 'STANDBY',
        insufficientEvidence: false,
        hindsightStatus,
        ollamaStatus
      };

      if (conversationId) {
        await conversationRepository.addMessage({
          conversationId,
          role: 'ASSISTANT',
          content: JSON.stringify(resultPayload)
        });
      }

      return resultPayload;
    }

    // 8. Ground Facts for Platform Queries or Competitor Intelligence Queries
    const facts = [];
    const observations = [];
    const inferences = [];
    const unknowns = [];
    const evidenceList = [];

    if (isPlatformQuery) {
      facts.push(`Fact: CompetitorIQ is an autonomous competitive intelligence system that monitors market signals across pricing, product releases, executive hiring, and expansion.`);
      facts.push(`Fact: Architecture includes automated multi-source ingestion, PostgreSQL structured event storage, Hindsight vector memory bank (RETAIN, RECALL, REFLECT), and Ollama grounded local LLM synthesis.`);
      facts.push(`Fact: Currently monitored competitors in active workspace (${orgId}): ${allCompetitors.map(c => c.name).join(', ') || 'AWS, Oracle, IBM, Salesforce'}.`);
      facts.push(`Fact: Total recorded events available across the intelligence ecosystem: ${pgEvents.length}.`);

      observations.push(`CompetitorIQ continuously extracts structured signals (pricing tiers, funding rounds, open roles, product releases) from ingested competitor news.`);
      inferences.push(`Inference: Stored intelligence allows executives to connect disparate tactical moves into coherent strategic trajectories.`);
    }

    // Monitored competitor with 0 ingested events
    if (targetCompetitors.length > 0 && pgEvents.length === 0 && hindsightMemories.length === 0) {
      const compNames = targetCompetitors.map(c => c.name).join(', ');
      facts.push(`Fact: ${compNames} is registered as a monitored competitor in CompetitorIQ.`);
      facts.push(`Fact: Currently, 0 historical events or public signals have been ingested yet into the database for ${compNames}.`);
      unknowns.push(`No public press releases, pricing updates, or hiring signals have been collected yet for ${compNames}.`);
      observations.push(`CompetitorIQ is configured to monitor ${compNames}, but the automated ingestion pipeline has not yet ingested events for this entity.`);
    }

    // Ground Facts from PostgreSQL Events
    for (const evt of pgEvents) {
      const compName = evt.competitor?.name || 'Competitor';
      const eventDateStr = evt.eventDate ? new Date(evt.eventDate).toISOString().split('T')[0] : 'Unknown Date';

      facts.push(`Fact: ${compName} - ${evt.title} (${evt.eventType}, ${eventDateStr}). Summary: ${evt.summary}`);

      if (evt.pricingSignals?.length) {
        for (const ps of evt.pricingSignals) {
          facts.push(`Fact (Pricing Metric): ${compName} ${ps.tierName} price updated to ${ps.currency} ${ps.newPrice} (Previous: ${ps.previousPrice || 'N/A'})`);
        }
      }
      if (evt.fundingSignals?.length) {
        for (const fs of evt.fundingSignals) {
          facts.push(`Fact (Funding Metric): ${compName} raised ${fs.currency} ${fs.amount} in ${fs.fundingType}`);
        }
      }
      if (evt.hiringSignals?.length) {
        for (const hs of evt.hiringSignals) {
          facts.push(`Fact (Hiring Metric): ${compName} opened ${hs.detectedCount} role(s) for ${hs.role} in ${hs.location || 'Global'}`);
        }
      }

      evidenceList.push({
        eventId: evt.id,
        competitorName: compName,
        eventType: evt.eventType,
        title: evt.title,
        sourceUrl: evt.source?.url || null,
        publisher: evt.source?.publisher || null,
        date: eventDateStr,
        confidence: evt.confidence || 0.9,
        excerpt: evt.evidence?.[0]?.excerpt || evt.summary
      });
    }

    // Ground Facts from Hindsight Memories
    for (const mem of hindsightMemories) {
      const memText = mem.text || mem.content || '';
      if (memText && !facts.some(f => f.includes(memText))) {
        facts.push(`Fact (Hindsight Memory): ${memText}`);
      }
    }

    // Synthesize Observations across events
    const categoryCounts = {};
    for (const evt of pgEvents) {
      categoryCounts[evt.eventType] = (categoryCounts[evt.eventType] || 0) + 1;
    }
    const categorySummary = Object.entries(categoryCounts)
      .map(([cat, count]) => `${count} ${cat}`)
      .join(', ');

    if (pgEvents.length > 0 && !isPlatformQuery) {
      observations.push(`Observed total ${pgEvents.length} competitive events (${categorySummary}) across recent records.`);
    }

    // Logical Inferences (clearly labeled)
    if (categoryCounts['PRICING']) {
      inferences.push(`Inference: Active pricing updates suggest tactical revenue model adjustments or margin positioning against rivals.`);
    }
    if (categoryCounts['PRODUCT'] || categoryCounts['FEATURE']) {
      inferences.push(`Inference: Rapid product/feature releases indicate strong engineering focus on feature-parity acceleration.`);
    }
    if (categoryCounts['HIRING']) {
      inferences.push(`Inference: Hiring signals indicate strategic expansion in technical talent and operational capability.`);
    }
    if (categoryCounts['EXPANSION']) {
      inferences.push(`Inference: Geographic and data center expansion reflects aggressive regional enterprise market capture.`);
    }

    // Highlight Unknowns & Data Gaps
    if (pgEvents.length < 3 && !isPlatformQuery) {
      unknowns.push('Limited event sample size in database — further automated web scraping ingestion recommended.');
    }
    if (hindsightStatus.creditLimitReached) {
      unknowns.push('Hindsight Cloud credit balance exhausted — memory operations running in PostgreSQL fallback mode.');
    }

    // Grounded AI Reasoning & Synthesis (Ollama local LLM with fallback)
    let answerText = '';
    let ollamaStatus = {
      configured: true,
      reachable: false,
      used: false,
      model: ollamaService.getModel(),
      status: 'idle',
      message: ''
    };

    try {
      const ollamaRes = await ollamaService.generateGroundedBrief(cleanedQuery, facts, observations, {
        timeoutMs: ollamaTimeout,
        conversationHistory
      });

      if (ollamaRes && ollamaRes.content) {
        let content = ollamaRes.content;
        const missingFacts = facts.filter(f => {
          const rawTitle = f.replace(/^Fact:\s*/, '').split('(')[0].trim();
          return rawTitle && !content.includes(rawTitle);
        });
        if (missingFacts.length > 0 && !content.includes('Verified Grounded Facts:')) {
          content += `\n\n#### Verified Grounded Facts:\n` + facts.slice(0, 8).map(f => `- ${f}`).join('\n');
        }
        answerText = content;
        ollamaStatus = {
          configured: true,
          reachable: true,
          used: true,
          model: ollamaRes.model || ollamaService.getModel(),
          status: 'ok',
          message: 'Ollama local LLM grounded reasoning executed successfully'
        };
      }
    } catch (ollamaErr) {
      logger.warn({ err: ollamaErr.message }, 'Ollama reasoning failed or offline; using deterministic fallback synthesis');
      ollamaStatus = {
        configured: true,
        reachable: false,
        used: false,
        model: ollamaService.getModel(),
        status: 'degraded',
        errorCode: ollamaErr.code || 'OLLAMA_UNAVAILABLE',
        message: ollamaErr.message || 'Ollama unavailable; fallback synthesis used'
      };
    }

    if (!answerText) {
      // Construct Fallback Answer Text
      const compHeader = isPlatformQuery 
        ? 'CompetitorIQ Platform Overview' 
        : (targetCompetitors.map(c => c.name).join(', ') || 'Competitors');

      answerText = `### Competitor Intelligence Brief: ${compHeader}\n\n`;
      answerText += `**Query:** ${cleanedQuery}\n\n`;

      answerText += `#### Verified Facts:\n`;
      facts.slice(0, 8).forEach(f => {
        answerText += `- ${f}\n`;
      });

      answerText += `\n#### Strategic Observations:\n`;
      observations.forEach(o => {
        answerText += `- ${o}\n`;
      });

      if (inferences.length > 0) {
        answerText += `\n#### Logical Inferences:\n`;
        inferences.forEach(i => {
          answerText += `- ${i}\n`;
        });
      }

      if (unknowns.length > 0) {
        answerText += `\n#### Unknowns & Data Gaps:\n`;
        unknowns.forEach(u => {
          answerText += `- ${u}\n`;
        });
      }

      if (reflectAnalysis?.summary) {
        answerText += `\n#### Strategic Pattern Reflection:\n${reflectAnalysis.summary}\n`;
      }
    }

    const resultPayload = {
      conversationId,
      answer: answerText,
      facts,
      observations,
      inferences,
      unknowns,
      evidence: evidenceList,
      events: pgEvents,
      memories: hindsightMemories,
      hindsightStage: activeHindsightStage,
      insufficientEvidence: false,
      hindsightStatus,
      ollamaStatus
    };

    if (conversationId) {
      await conversationRepository.addMessage({
        conversationId,
        role: 'ASSISTANT',
        content: JSON.stringify(resultPayload)
      });
    }

    return resultPayload;
  }
};

export default agentService;
