import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export class OllamaError extends Error {
  constructor(message, code = 'OLLAMA_ERROR', statusCode = 500, details = null) {
    super(message);
    this.name = 'OLLAMA_ERROR';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const ollamaService = {
  getBaseUrl() {
    return env.OLLAMA_BASE_URL || 'http://localhost:11434';
  },

  getModel() {
    return env.OLLAMA_MODEL || 'qwen2.5:3b';
  },

  getTimeoutMs() {
    return env.OLLAMA_TIMEOUT_MS || 15000;
  },

  /**
   * Health and reachability check for local Ollama service and configured model
   */
  async checkHealth(options = {}) {
    const baseUrl = options.baseUrl || this.getBaseUrl();
    const model = options.model || this.getModel();
    const timeoutMs = options.timeoutMs || 3000;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${baseUrl}/api/tags`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          status: 'unavailable',
          reachable: false,
          model,
          baseUrl,
          message: `Ollama service returned HTTP status ${response.status}`
        };
      }

      const data = await response.json().catch(() => ({}));
      const models = Array.isArray(data?.models) ? data.models : [];
      const modelNames = models.map(m => m.name || m.model || '');
      const isModelAvailable = modelNames.some(m => m.toLowerCase().includes(model.toLowerCase()));

      return {
        status: isModelAvailable || models.length > 0 ? 'ok' : 'model_missing',
        reachable: true,
        model,
        baseUrl,
        modelAvailable: isModelAvailable,
        availableModels: modelNames,
        message: isModelAvailable 
          ? `Ollama reachable and model '${model}' is ready.`
          : `Ollama reachable, but model '${model}' was not found in installed tags.`
      };
    } catch (err) {
      clearTimeout(timeoutId);
      const isTimeout = err.name === 'AbortError';
      const msg = isTimeout 
        ? `Ollama health check timed out after ${timeoutMs}ms`
        : (err.message || 'Ollama connection failed');

      return {
        status: 'unavailable',
        reachable: false,
        model,
        baseUrl,
        message: msg
      };
    }
  },

  /**
   * Execute chat completion against Ollama /api/chat endpoint
   */
  async chat(messages, options = {}) {
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new OllamaError('Messages array is required for Ollama chat', 'OLLAMA_INVALID_REQUEST', 400);
    }

    const baseUrl = options.baseUrl || this.getBaseUrl();
    const model = options.model || this.getModel();
    const timeoutMs = options.timeoutMs || this.getTimeoutMs();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const requestBody = {
      model,
      messages,
      stream: false,
      options: {
        temperature: options.temperature ?? 0.2,
        num_predict: options.numPredict || options.maxTokens || 512
      }
    };

    if (options.format) {
      requestBody.format = options.format;
    }

    try {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        logger.warn({ status: response.status, errText }, 'Ollama chat API call returned non-200 status');
        throw new OllamaError(
          `Ollama API returned HTTP ${response.status}: ${errText.slice(0, 150)}`,
          response.status === 404 ? 'OLLAMA_MODEL_NOT_FOUND' : 'OLLAMA_HTTP_ERROR',
          response.status,
          { status: response.status, body: errText }
        );
      }

      const data = await response.json();

      if (!data || !data.message || typeof data.message.content !== 'string') {
        throw new OllamaError('Invalid response structure returned by Ollama chat API', 'OLLAMA_INVALID_RESPONSE', 502, data);
      }

      return {
        model: data.model || model,
        content: data.message.content.trim(),
        role: data.message.role || 'assistant',
        done: data.done ?? true,
        totalDuration: data.total_duration || null,
        promptEvalCount: data.prompt_eval_count || null,
        evalCount: data.eval_count || null
      };
    } catch (err) {
      clearTimeout(timeoutId);

      if (err instanceof OllamaError) {
        throw err;
      }

      if (err.name === 'AbortError') {
        logger.warn({ timeoutMs }, 'Ollama chat request timed out');
        throw new OllamaError(`Ollama request timed out after ${timeoutMs}ms`, 'OLLAMA_TIMEOUT', 504);
      }

      logger.warn({ err: err.message }, 'Ollama chat request failed');
      throw new OllamaError(`Ollama request failed: ${err.message}`, 'OLLAMA_UNAVAILABLE', 503);
    }
  },

  /**
   * Helper to generate a grounded competitor intelligence brief using Ollama
   */
  async generateGroundedBrief(userQuery, facts, observations = [], inferences = [], implications = [], options = {}) {
    // Graceful argument overloading if called with (userQuery, facts, observations, options)
    if (!Array.isArray(inferences) && typeof inferences === 'object' && inferences !== null) {
      options = inferences;
      inferences = [];
      implications = [];
    } else if (!Array.isArray(implications) && typeof implications === 'object' && implications !== null) {
      options = implications;
      implications = [];
    }

    const systemPrompt = `You are the CompetitorIQ Grounded AI Intelligence Analyst powered by qwen2.5:3b.
Your task is to analyze competitive intelligence data and produce a structured, professional executive brief for the user query.

CRITICAL GROUNDING RULES:
1. STRICT TRUTHFULNESS: Base your brief ONLY on the provided facts and evidence below.
2. ABSOLUTELY NO FABRICATION: Do NOT invent competitor names, dates, metrics, pricing, features, or events.
3. 5-BOX EPISTEMOLOGICAL SEPARATION: Clearly distinguish between:
   - FACTS: Direct historical events and numbers from stored database records. Attribute sources inline with tags like [Source: Publisher Name] where available.
   - STRATEGIC OBSERVATIONS: Empirical patterns and velocity metrics derived directly from the facts.
   - LOGICAL INFERENCES: Logical deductions connecting observations to strategic motives.
   - BUSINESS IMPLICATIONS: Commercial and competitive impact on Microsoft and rivals (pricing pressure, margin impact, enterprise market share, feature parity).
   - UNKNOWNS & DATA GAPS: What is missing, unverified, or uncertain in the evidence.
4. If evidence is missing or insufficient, state it clearly.`;

    // Deduplicate and cap facts to top 8 to keep local LLM inference under 10 seconds
    const uniqueFacts = [...new Set(facts)].slice(0, 8);
    const uniqueObservations = [...new Set(observations)].slice(0, 5);
    const uniqueInferences = [...new Set(Array.isArray(inferences) ? inferences : [])].slice(0, 4);
    const uniqueImplications = [...new Set(Array.isArray(implications) ? implications : [])].slice(0, 4);

    let toolContextSection = '';
    if (options.toolOutputs && typeof options.toolOutputs === 'object') {
      const parts = [];
      if (Array.isArray(options.toolOutputs.comparisons) && options.toolOutputs.comparisons.length > 0) {
        parts.push('Competitor Momentum Comparisons:\n' + options.toolOutputs.comparisons.map(c => `- ${c.competitorName}: Momentum ${c.momentumScore}/100 (${c.momentumLevel}), Events: ${c.eventCount}`).join('\n'));
      }
      if (Array.isArray(options.toolOutputs.pricingSignals) && options.toolOutputs.pricingSignals.length > 0) {
        parts.push('Extracted Pricing Signals:\n' + options.toolOutputs.pricingSignals.map(p => `- ${p.competitorName} ${p.tierName}: ${p.currency} ${p.newPrice || 'Custom'} (Previous: ${p.previousPrice || 'N/A'})`).join('\n'));
      }
      if (Array.isArray(options.toolOutputs.patterns) && options.toolOutputs.patterns.length > 0) {
        parts.push('Correlated Strategic Patterns:\n' + options.toolOutputs.patterns.map(pat => `- ${pat.title}: ${pat.summary || pat.description}`).join('\n'));
      }
      if (parts.length > 0) {
        toolContextSection = `\n\nInternal Tool Execution Insights:\n${parts.join('\n\n')}`;
      }
    }

    const userContent = `User Query: "${userQuery}"

Verified Facts & Evidence:
${uniqueFacts.length > 0 ? uniqueFacts.map(f => `- ${f}`).join('\n') : '(No direct facts)'}

Strategic Observations:
${uniqueObservations.length > 0 ? uniqueObservations.map(o => `- ${o}`).join('\n') : '(None)'}

Logical Inferences:
${uniqueInferences.length > 0 ? uniqueInferences.map(i => `- ${i}`).join('\n') : '(None)'}

Business Implications:
${uniqueImplications.length > 0 ? uniqueImplications.map(imp => `- ${imp}`).join('\n') : '(None)'}${toolContextSection}

Please provide a concise executive brief answering the user query based strictly on the above facts. Include sections for Verified Facts, Strategic Observations, Logical Inferences, Business & Strategic Implications, and Unknowns & Data Gaps. Keep it concise and embed inline citations where appropriate.`;

    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    if (Array.isArray(options.conversationHistory) && options.conversationHistory.length > 0) {
      for (const msg of options.conversationHistory) {
        if (msg.content && (msg.role === 'user' || msg.role === 'assistant')) {
          messages.push({
            role: msg.role,
            content: msg.content.slice(0, 1000)
          });
        }
      }
    }

    messages.push({ role: 'user', content: userContent });

    return this.chat(messages, options);
  },

  /**
   * General knowledge, educational, or follow-up response using Ollama
   */
  async generateGeneralResponse(userQuery, conversationHistory = [], options = {}) {
    const systemPrompt = `You are the CompetitorIQ Intelligent Assistant powered by ${this.getModel()}.
You assist users with competitive intelligence, business analysis, software engineering, AI concepts, and general knowledge questions.

CRITICAL RULES:
1. Provide a direct, articulate, and accurate answer to the user's question.
2. For business, AI, programming, or general knowledge topics, explain clearly and informatively.
3. For questions requiring live external real-time data (e.g. live stock tickers, current weather, unrecorded today's breaking news), clearly disclose that real-time live internet browsing is unavailable and never invent current metrics or pretend to browse live websites.
4. Maintain a professional, objective tone.
5. If answering a follow-up question, use the provided conversation context.`;

    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Append prior conversation context if present
    if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      for (const msg of conversationHistory) {
        if (msg.content && (msg.role === 'user' || msg.role === 'assistant')) {
          messages.push({
            role: msg.role,
            content: msg.content.slice(0, 1000)
          });
        }
      }
    }

    messages.push({ role: 'user', content: userQuery });

    return this.chat(messages, {
      ...options,
      numPredict: options.numPredict || 512,
      temperature: options.temperature ?? 0.3
    });
  }
};

export default ollamaService;
