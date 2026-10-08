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
    this.orgId = null;
    this.authToken = null;
  }

  setAuth(orgId, token = null) {
    this.orgId = orgId || null;
    this.authToken = token || null;
  }

  getOrganizationId() {
    if (this.orgId) return this.orgId;
    if (typeof window !== 'undefined') {
      try {
        const rawAuth = localStorage.getItem('competitor_iq_auth')
          || sessionStorage.getItem('competitor_iq_auth')
          || localStorage.getItem('competitor_iq_user');
        if (rawAuth) {
          const parsed = JSON.parse(rawAuth);
          if (parsed?.organizationId) return parsed.organizationId;
          if (parsed?.user?.organizationId) return parsed.user.organizationId;
        }
      } catch {
        // ignore JSON parse error in non-browser or corrupted local storage
      }
    }
    return 'default-org';
  }

  async ensureAuthToken() {
    if (this.authToken) return this.authToken;
    if (typeof window !== 'undefined') {
      try {
        const rawAuth = localStorage.getItem('competitor_iq_auth')
          || sessionStorage.getItem('competitor_iq_auth');
        if (rawAuth) {
          const parsed = JSON.parse(rawAuth);
          if (parsed?.token) {
            this.authToken = parsed.token;
            return this.authToken;
          }
        }
      } catch {
        // ignore
      }
    }

    // Auto-provision signed JWT for default session
    try {
      const orgId = this.getOrganizationId();
      const res = await fetch(`${this.baseUrl}/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: orgId, role: 'ANALYST' })
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.data?.token) {
          this.authToken = json.data.token;
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('competitor_iq_auth', JSON.stringify({ token: this.authToken, user: json.data.user }));
            } catch (_) {}
          }
          return this.authToken;
        }
      }
    } catch (err) {
      console.warn('Failed auto-obtaining auth token:', err);
    }
    return null;
  }

  getAuthToken() {
    if (this.authToken) return this.authToken;
    if (typeof window !== 'undefined') {
      try {
        const rawAuth = localStorage.getItem('competitor_iq_auth')
          || sessionStorage.getItem('competitor_iq_auth');
        if (rawAuth) {
          const parsed = JSON.parse(rawAuth);
          if (parsed?.token) return parsed.token;
        }
      } catch {
        // ignore
      }
    }
    return null;
  }

  async request(endpoint, options = {}) {
    if (!this.authToken && endpoint !== '/auth/token' && endpoint !== '/auth/login') {
      await this.ensureAuthToken().catch(() => {});
    }

    const url = `${this.baseUrl}${endpoint}`;
    const dynamicOrgId = options.headers?.['x-organization-id'] || this.getOrganizationId();
    const dynamicToken = options.headers?.Authorization || this.getAuthToken();
    const requestId = Math.random().toString(36).substring(2, 9);
    const startTime = Date.now();
    const method = (options.method || 'GET').toUpperCase();

    const headers = {
      'Content-Type': 'application/json',
      'x-organization-id': dynamicOrgId,
      ...(dynamicToken ? { Authorization: dynamicToken.startsWith('Bearer ') ? dynamicToken : `Bearer ${dynamicToken}` } : {}),
      ...(options.headers || {})
    };

    const controller = new AbortController();
    let isTimedOut = false;
    const timeoutMs = options.timeout || 30000;
    const timeoutId = setTimeout(() => {
      isTimedOut = true;
      controller.abort();
    }, timeoutMs);

    if (options.signal) {
      if (options.signal.aborted) {
        clearTimeout(timeoutId);
        const cancelErr = new Error('Request was cancelled.');
        cancelErr.name = 'AbortError';
        cancelErr.code = 'ERR_CANCELED';
        cancelErr.isCancelled = true;
        throw cancelErr;
      }
      options.signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    console.log(`[API START] requestId=${requestId} ${method} ${endpoint}`);

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
        console.log(`[API ERROR] requestId=${requestId} status=${response.status} duration=${Date.now() - startTime}ms error=${errorMsg}`);
        throw error;
      }

      console.log(`[API END] requestId=${requestId} status=${response.status} duration=${Date.now() - startTime}ms`);
      return data;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError' || err.isCancelled) {
        if (isTimedOut) {
          console.log(`[API TIMEOUT] requestId=${requestId} duration=${Date.now() - startTime}ms timeout=${timeoutMs}ms`);
          const timeoutError = new Error(`Request timed out after ${timeoutMs / 1000}s. Please try again.`);
          timeoutError.name = 'TimeoutError';
          timeoutError.code = 'TIMEOUT';
          throw timeoutError;
        }
        console.log(`[API CANCELLED] requestId=${requestId} duration=${Date.now() - startTime}ms reason=user_navigation`);
        const cancelError = new Error('Request was cancelled.');
        cancelError.name = 'AbortError';
        cancelError.code = 'ERR_CANCELED';
        cancelError.isCancelled = true;
        throw cancelError;
      }
      console.log(`[API ERROR] requestId=${requestId} duration=${Date.now() - startTime}ms error=${err.message}`);
      if (err.message === 'Failed to fetch' || (err instanceof TypeError && err.message?.includes('fetch'))) {
        const connErr = new Error(`Backend Connection Error: Unable to reach CompetitorIQ server at ${this.baseUrl}. Please verify the Express backend is running on port 5000 (npm run server).`);
        connErr.code = 'BACKEND_UNAVAILABLE';
        connErr.status = 503;
        throw connErr;
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
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.limit) query.append('limit', params.limit);
    if (params.offset) query.append('offset', params.offset);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await this.request(`/ingestion/events${queryString}`);
    if (res && res.data && !Array.isArray(res.data) && Array.isArray(res.data.events)) {
      return { ...res, data: res.data.events };
    }
    return res;
  }

  async getEventById(id) {
    return this.request(`/events/${id}`);
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
      signal: options.signal,
      timeout: options.timeout || 60000,
      body: JSON.stringify({
        query: queryText,
        competitorId: options.competitorId,
        conversationId: options.conversationId,
        mode: options.mode || 'AUTO',
        timeoutMs: options.timeoutMs,
        maxIterations: options.maxIterations
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

  async getUnreadAlertsCount() {
    return this.request('/alerts/unread-count');
  }

  async markAllAlertsAsRead() {
    return this.request('/alerts/read-all', {
      method: 'PATCH'
    });
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

  async getLatestExecutiveReport(params = {}) {
    const query = new URLSearchParams();
    if (params.reportType) query.append('reportType', params.reportType);
    if (params.windowDays) query.append('windowDays', params.windowDays);
    if (Array.isArray(params.competitorIds) && params.competitorIds.length > 0) {
      query.append('competitorIds', params.competitorIds.join(','));
    }
    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await this.request(`/executive-reports/latest${queryString}`, {
      timeout: 30000,
      signal: params.signal
    });

    const reportPayload = res?.data?.report || res?.data?.data || (res?.data?.metadata ? res.data : null) || res?.data || res;
    return reportPayload;
  }

  async generateExecutiveReport(params = {}) {
    const res = await this.request('/executive-reports/generate', {
      method: 'POST',
      body: JSON.stringify(params),
      timeout: 30000,
      signal: params.signal
    });

    const reportPayload = res?.data?.report || res?.data?.data || (res?.data?.metadata ? res.data : null) || res?.data || res;
    return reportPayload;
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

  // Official Sources Real Refresh Pipeline
  async refreshOfficialData() {
    return this.request('/ingestion/refresh', {
      method: 'POST',
      body: JSON.stringify({})
    });
  }

  async refreshCompetitorData(competitorSlug) {
    return this.request(`/ingestion/competitor/${encodeURIComponent(competitorSlug)}`, {
      method: 'POST',
      body: JSON.stringify({})
    });
  }

  async search(query, signal = null) {
    if (!query || !query.trim()) {
      return { success: true, data: { competitors: [], events: [], signals: [] } };
    }
    const params = new URLSearchParams({ q: query.trim() });
    return this.request(`/search?${params.toString()}`, { signal });
  }
}

export const apiService = new ApiService();
export default apiService;

