/**
 * Centralized API Service for CompetitorIQ Frontend
 * Reusable HTTP helper with error handling, timeouts, and JSON serialization.
 */

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL)
  || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000/api'
    : '/api');

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.defaultOrgId = 'default-org';
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'x-organization-id': this.defaultOrgId,
      ...(options.headers || {})
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMsg = data?.error?.message || data?.message || `HTTP ${response.status}: Request failed`;
        const error = new Error(errorMsg);
        error.status = response.status;
        error.code = data?.error?.code || 'API_ERROR';
        error.details = data;
        throw error;
      }

      return data;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        const timeoutError = new Error('Request timed out. Please try again.');
        timeoutError.code = 'TIMEOUT';
        throw timeoutError;
      }
      throw err;
    }
  }

  // Health & System Readiness
  async getHealth() {
    return this.request('/health');
  }

  async getReadiness() {
    return this.request('/health/ready');
  }

  async getOllamaStatus() {
    return this.request('/health/ollama');
  }

  // Competitor Intelligence Events
  async getEvents(params = {}) {
    const query = new URLSearchParams();
    if (params.competitorId) query.append('competitorId', params.competitorId);
    if (params.eventType) query.append('eventType', params.eventType);
    if (params.query) query.append('query', params.query);
    if (params.limit) query.append('limit', params.limit);
    if (params.offset) query.append('offset', params.offset);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await this.request(`/ingestion/events${queryString}`);
    if (res && res.data && !Array.isArray(res.data) && Array.isArray(res.data.events)) {
      return { ...res, data: res.data.events };
    }
    return res;
  }

  async ingestItem(itemData) {
    return this.request('/ingestion/ingest', {
      method: 'POST',
      body: JSON.stringify(itemData)
    });
  }

  async ingestBatch(batchItems) {
    return this.request('/ingestion/batch', {
      method: 'POST',
      body: JSON.stringify({ items: batchItems })
    });
  }

  // Competitor Directory & Profiles
  async getCompetitors() {
    return this.request('/competitors');
  }

  async getCompetitorById(id) {
    return this.request(`/competitors/${id}`);
  }

  // Hindsight Operations & Memory Status
  async getHindsightStatus() {
    return this.request('/hindsight/status');
  }

  async recallMemories(queryText, limit = 10) {
    return this.request('/hindsight/recall', {
      method: 'POST',
      body: JSON.stringify({ query: queryText, limit })
    });
  }

  async reflectStrategy(queryText, context = '') {
    return this.request('/hindsight/reflect', {
      method: 'POST',
      body: JSON.stringify({ query: queryText, context })
    });
  }

  // AI Agent Workspace & Reasoning Engine
  async queryAgent(queryText, options = {}) {
    return this.request('/agent/query', {
      method: 'POST',
      body: JSON.stringify({
        query: queryText,
        competitorId: options.competitorId,
        conversationId: options.conversationId,
        mode: options.mode || 'AUTO'
      })
    });
  }

  async getAgentConversations() {
    return this.request('/agent/conversations');
  }

  async getConversationMessages(conversationId) {
    return this.request(`/agent/conversations/${conversationId}`);
  }

  // Competitive Intelligence Alert Engine
  async getAlerts(params = {}) {
    const query = new URLSearchParams();
    if (params.competitorId) query.append('competitorId', params.competitorId);
    if (params.severity) query.append('severity', params.severity);
    if (params.type) query.append('type', params.type);
    if (params.status) query.append('status', params.status);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.limit) query.append('limit', params.limit);
    if (params.offset) query.append('offset', params.offset);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return this.request(`/alerts${queryString}`);
  }

  async getAlertById(id) {
    return this.request(`/alerts/${id}`);
  }

  async updateAlertStatus(id, status) {
    return this.request(`/alerts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  async evaluateAlerts(params = {}) {
    return this.request('/alerts/evaluate', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  // Connect-the-Dots Intelligence Engine
  async getConnectDotsPatterns(params = {}) {
    const query = new URLSearchParams();
    if (params.competitorId) query.append('competitorId', params.competitorId);
    if (params.patternType) query.append('patternType', params.patternType);
    if (params.confidence) query.append('confidence', params.confidence);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.limit) query.append('limit', params.limit);
    if (params.offset) query.append('offset', params.offset);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return this.request(`/connect-dots${queryString}`);
  }

  async getConnectDotsPatternById(id) {
    return this.request(`/connect-dots/${id}`);
  }

  async analyzeConnectDots(params = {}) {
    return this.request('/connect-dots/analyze', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  // Strategic Analysis Engine
  async getStrategicAnalyses(params = {}) {
    const query = new URLSearchParams();
    if (params.competitorId) query.append('competitorId', params.competitorId);
    if (params.analysisType) query.append('analysisType', params.analysisType);
    if (params.confidence) query.append('confidence', params.confidence);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.limit) query.append('limit', params.limit);
    if (params.offset) query.append('offset', params.offset);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return this.request(`/strategic-analysis${queryString}`);
  }

  async getStrategicAnalysisById(id) {
    return this.request(`/strategic-analysis/${id}`);
  }

  async analyzeStrategicData(params = {}) {
    return this.request('/strategic-analysis/analyze', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  // Competitive Comparison Engine
  async getCompetitiveComparison(params = {}) {
    const query = new URLSearchParams();
    if (params.competitorIds) {
      const compVal = Array.isArray(params.competitorIds) ? params.competitorIds.join(',') : params.competitorIds;
      query.append('competitorIds', compVal);
    }
    if (params.windowDays) query.append('windowDays', params.windowDays);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.categories) {
      const catVal = Array.isArray(params.categories) ? params.categories.join(',') : params.categories;
      query.append('categories', catVal);
    }

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return this.request(`/competitive-comparison${queryString}`);
  }

  // Executive Intelligence Report Engine
  async getExecutiveReports(params = {}) {
    const query = new URLSearchParams();
    if (params.competitorId) query.append('competitorId', params.competitorId);
    if (params.reportType) query.append('reportType', params.reportType);
    if (params.limit) query.append('limit', params.limit);
    if (params.offset) query.append('offset', params.offset);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return this.request(`/executive-reports${queryString}`);
  }

  async getExecutiveReportById(id) {
    return this.request(`/executive-reports/${id}`);
  }

  async generateExecutiveReport(params = {}) {
    return this.request('/executive-reports/generate', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  // Continuous Competitor Monitoring Layer
  async getMonitoringStatus() {
    return this.request('/monitoring/status');
  }

  async runMonitoringAll(force = false) {
    return this.request('/monitoring/run', {
      method: 'POST',
      body: JSON.stringify({ force })
    });
  }

  async runMonitoringSingle(sourceId) {
    return this.request(`/monitoring/run/${sourceId}`, {
      method: 'POST'
    });
  }

  async toggleMonitoring(enabled) {
    return this.request('/monitoring/toggle', {
      method: 'POST',
      body: JSON.stringify({ enabled })
    });
  }
}

export const apiService = new ApiService();
export default apiService;
