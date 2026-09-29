import { test, describe, before, after, afterEach } from 'node:test';
import assert from 'node:assert';
import ollamaService, { OllamaError } from '../server/services/ollamaService.js';
import agentService from '../server/services/agentService.js';
import ingestionService from '../server/services/ingestionService.js';

describe('Ollama Local LLM Integration Unit & Integration Tests', () => {
  const testOrgId = 'ollama-test-org';
  const timestamp = Date.now();
  const originalFetch = globalThis.fetch;

  before(async () => {
    // Seed test competitor events
    await ingestionService.processItem({
      competitorName: 'OllamaCorp',
      eventType: 'PRODUCT',
      title: `OllamaCorp Qwen Integration Launch ${timestamp}`,
      summary: 'OllamaCorp launched local AI model integration with qwen2.5:3b model.',
      source: 'Tech Release',
      sourceUrl: `https://ollamacorp.com/news/qwen-${timestamp}`,
      eventDate: new Date().toISOString()
    }, { organizationId: testOrgId });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  after(() => {
    globalThis.fetch = originalFetch;
  });

  test('1. ollamaService.checkHealth success with qwen2.5:3b model', async () => {
    globalThis.fetch = async (url, options) => {
      if (typeof url === 'string' && url.includes('11434/api/tags')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            models: [
              { name: 'qwen2.5:3b', size: 1900000000 },
              { name: 'llama3:latest', size: 4000000000 }
            ]
          })
        };
      }
      return originalFetch(url, options);
    };

    const health = await ollamaService.checkHealth();
    assert.strictEqual(health.reachable, true);
    assert.strictEqual(health.status, 'ok');
    assert.strictEqual(health.model, 'qwen2.5:3b');
    assert.strictEqual(health.modelAvailable, true);
  });

  test('2. ollamaService.checkHealth connection failure handling when Ollama is stopped', async () => {
    globalThis.fetch = async (url, options) => {
      if (typeof url === 'string' && url.includes('11434')) {
        throw new Error('connect ECONNREFUSED 127.0.0.1:11434');
      }
      return originalFetch(url, options);
    };

    const health = await ollamaService.checkHealth();
    assert.strictEqual(health.reachable, false);
    assert.strictEqual(health.status, 'unavailable');
    assert.ok(health.message.includes('ECONNREFUSED'));
  });

  test('3. ollamaService.chat success response parsing', async () => {
    globalThis.fetch = async (url, options) => {
      if (typeof url === 'string' && url.includes('11434/api/chat')) {
        const body = JSON.parse(options.body);
        assert.strictEqual(body.model, 'qwen2.5:3b');
        assert.strictEqual(body.stream, false);

        return {
          ok: true,
          status: 200,
          json: async () => ({
            model: 'qwen2.5:3b',
            created_at: new Date().toISOString(),
            message: {
              role: 'assistant',
              content: 'Grounded Brief: OllamaCorp introduced local qwen2.5:3b integration.'
            },
            done: true
          })
        };
      }
      return originalFetch(url, options);
    };

    const response = await ollamaService.chat([
      { role: 'user', content: 'What did OllamaCorp do?' }
    ]);

    assert.strictEqual(response.model, 'qwen2.5:3b');
    assert.strictEqual(response.content.includes('Grounded Brief'), true);
    assert.strictEqual(response.role, 'assistant');
    assert.strictEqual(response.done, true);
  });

  test('4. ollamaService.chat request timeout error handling', async () => {
    globalThis.fetch = async (url, options) => {
      if (typeof url === 'string' && url.includes('11434')) {
        const error = new Error('The operation was aborted');
        error.name = 'AbortError';
        throw error;
      }
      return originalFetch(url, options);
    };

    try {
      await ollamaService.chat([{ role: 'user', content: 'Hello' }], { timeoutMs: 50 });
      assert.fail('Should have thrown OllamaError for timeout');
    } catch (err) {
      assert.strictEqual(err.code, 'OLLAMA_TIMEOUT');
      assert.strictEqual(err.statusCode, 504);
    }
  });

  test('5. ollamaService.chat invalid response format handling', async () => {
    globalThis.fetch = async (url, options) => {
      if (typeof url === 'string' && url.includes('11434')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ unexpectedField: true })
        };
      }
      return originalFetch(url, options);
    };

    try {
      await ollamaService.chat([{ role: 'user', content: 'Test' }]);
      assert.fail('Should have thrown OllamaError for invalid response structure');
    } catch (err) {
      assert.strictEqual(err.code, 'OLLAMA_INVALID_RESPONSE');
      assert.strictEqual(err.statusCode, 502);
    }
  });

  test('6. ollamaService.chat HTTP 404 model missing handling', async () => {
    globalThis.fetch = async (url, options) => {
      if (typeof url === 'string' && url.includes('11434')) {
        return {
          ok: false,
          status: 404,
          text: async () => 'model "qwen2.5:3b" not found'
        };
      }
      return originalFetch(url, options);
    };

    try {
      await ollamaService.chat([{ role: 'user', content: 'Test' }]);
      assert.fail('Should have thrown OllamaError for 404 model missing');
    } catch (err) {
      assert.strictEqual(err.code, 'OLLAMA_MODEL_NOT_FOUND');
      assert.strictEqual(err.statusCode, 404);
    }
  });

  test('7. agentService query execution with successful Ollama LLM grounding', async () => {
    globalThis.fetch = async (url, options) => {
      if (typeof url === 'string' && url.includes('11434/api/chat')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            model: 'qwen2.5:3b',
            message: {
              role: 'assistant',
              content: `### Executive Brief: OllamaCorp\n\n- Verified Fact: OllamaCorp launched local AI integration with qwen2.5:3b.`
            },
            done: true
          })
        };
      }
      return originalFetch(url, options);
    };

    const result = await agentService.executeQuery('What did OllamaCorp launch recently?', {
      organizationId: testOrgId
    });

    assert.strictEqual(result.insufficientEvidence, false);
    assert.strictEqual(result.ollamaStatus.used, true);
    assert.strictEqual(result.ollamaStatus.status, 'ok');
    assert.strictEqual(result.ollamaStatus.model, 'qwen2.5:3b');
    assert.ok(result.answer.includes('OllamaCorp'));
  });

  test('8. agentService query execution during Hindsight credit exhaustion (402) with active local Ollama reasoning', async () => {
    globalThis.fetch = async (url, options) => {
      if (typeof url === 'string' && url.includes('11434/api/chat')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            model: 'qwen2.5:3b',
            message: {
              role: 'assistant',
              content: `### Executive Brief (Local Ollama Reasoning)\n\n- Fact: OllamaCorp launched Qwen integration.`
            },
            done: true
          })
        };
      }
      return originalFetch(url, options);
    };

    const result = await agentService.executeQuery('Analyze OllamaCorp strategy', {
      organizationId: testOrgId,
      mode: 'REFLECT'
    });

    assert.ok(result);
    assert.strictEqual(result.ollamaStatus.used, true);
    assert.strictEqual(result.ollamaStatus.status, 'ok');
    assert.strictEqual(typeof result.hindsightStatus, 'object');
  });

  test('9. agentService query execution when Ollama is offline uses deterministic fallback', async () => {
    globalThis.fetch = async (url, options) => {
      if (typeof url === 'string' && url.includes('11434')) {
        throw new Error('connect ECONNREFUSED 127.0.0.1:11434');
      }
      return originalFetch(url, options);
    };

    const result = await agentService.executeQuery('What are the recent moves for OllamaCorp?', {
      organizationId: testOrgId
    });

    assert.strictEqual(result.insufficientEvidence, false);
    assert.strictEqual(result.ollamaStatus.used, false);
    assert.strictEqual(result.ollamaStatus.status, 'degraded');
    assert.ok(result.answer.includes('OllamaCorp Qwen Integration Launch'));
  });
});
