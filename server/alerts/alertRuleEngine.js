/**
 * CompetitorIQ Alert Rule Engine
 * Deterministic, rule-based evaluation engine for competitive signals.
 * Derives alert type, severity, and clear rationale strictly from empirical event attributes.
 */

export const ALERT_RULES = [
  {
    ruleId: 'RULE_PRICING_CHANGE',
    name: 'Pricing Model Modification Alert',
    alertType: 'PRICE_CHANGE',
    enabled: true,
    matches(event, normalized) {
      const type = (event.eventType || normalized?.eventType || '').toUpperCase();
      return type === 'PRICING';
    },
    evaluate(event, normalized, competitor) {
      const compName = competitor?.name || normalized?.competitorName || event.competitor?.name || 'Competitor';
      const importance = (event.importance || normalized?.importance || 'MEDIUM').toUpperCase();
      const confidence = Number(event.confidence ?? normalized?.confidence ?? 0.8);
      const text = `${event.title} ${event.summary || ''}`.toLowerCase();

      let severity = 'MEDIUM';
      if (importance === 'CRITICAL' || text.includes('hike') || text.includes('tier increase') || (importance === 'HIGH' && confidence >= 0.85)) {
        severity = 'CRITICAL';
      } else if (importance === 'HIGH' || confidence >= 0.75) {
        severity = 'HIGH';
      }

      const explanation = `Pricing alert: ${compName} updated pricing structure with ${Math.round(confidence * 100)}% verified evidence confidence.`;
      return {
        triggered: true,
        alertType: 'PRICE_CHANGE',
        severity,
        title: `Pricing Update: ${compName}`,
        reason: explanation
      };
    }
  },
  {
    ruleId: 'RULE_PRODUCT_LAUNCH',
    name: 'New Product Announcement Alert',
    alertType: 'NEW_PRODUCT',
    enabled: true,
    matches(event, normalized) {
      const type = (event.eventType || normalized?.eventType || '').toUpperCase();
      return type === 'PRODUCT';
    },
    evaluate(event, normalized, competitor) {
      const compName = competitor?.name || normalized?.competitorName || event.competitor?.name || 'Competitor';
      const importance = (event.importance || normalized?.importance || 'MEDIUM').toUpperCase();
      const confidence = Number(event.confidence ?? normalized?.confidence ?? 0.8);
      const text = `${event.title} ${event.summary || ''}`.toLowerCase();

      let severity = 'HIGH';
      if (importance === 'CRITICAL' || text.includes('flagship') || text.includes('v3.0') || text.includes('platform launch') || text.includes('next-gen')) {
        severity = 'CRITICAL';
      } else if (importance === 'LOW') {
        severity = 'MEDIUM';
      }

      const explanation = `New product alert: ${compName} launched a major product or platform update (${event.title}).`;
      return {
        triggered: true,
        alertType: 'NEW_PRODUCT',
        severity,
        title: `Product Launch: ${compName}`,
        reason: explanation
      };
    }
  },
  {
    ruleId: 'RULE_FEATURE_LAUNCH',
    name: 'New Feature & Capabilities Alert',
    alertType: 'NEW_FEATURE',
    enabled: true,
    matches(event, normalized) {
      const type = (event.eventType || normalized?.eventType || '').toUpperCase();
      return type === 'FEATURE';
    },
    evaluate(event, normalized, competitor) {
      const compName = competitor?.name || normalized?.competitorName || event.competitor?.name || 'Competitor';
      const importance = (event.importance || normalized?.importance || 'MEDIUM').toUpperCase();

      let severity = 'MEDIUM';
      if (importance === 'CRITICAL' || importance === 'HIGH') {
        severity = 'HIGH';
      } else if (importance === 'LOW') {
        severity = 'LOW';
      }

      const explanation = `Feature launch alert: ${compName} released a new capability (${event.title}).`;
      return {
        triggered: true,
        alertType: 'NEW_FEATURE',
        severity,
        title: `Feature Update: ${compName}`,
        reason: explanation
      };
    }
  },
  {
    ruleId: 'RULE_HIRING_SPIKE',
    name: 'Strategic Hiring & Recruitment Spike',
    alertType: 'HIRING_SPIKE',
    enabled: true,
    matches(event, normalized) {
      const type = (event.eventType || normalized?.eventType || '').toUpperCase();
      return type === 'HIRING';
    },
    evaluate(event, normalized, competitor) {
      const compName = competitor?.name || normalized?.competitorName || event.competitor?.name || 'Competitor';
      const importance = (event.importance || normalized?.importance || 'MEDIUM').toUpperCase();
      const text = `${event.title} ${event.summary || ''}`.toLowerCase();

      let severity = 'MEDIUM';
      if (importance === 'CRITICAL' || text.includes('executive') || text.includes('vp') || text.includes('cto') || text.includes('r&d expansion')) {
        severity = 'HIGH';
      }

      const explanation = `Hiring signal alert: ${compName} posted key technical or leadership hiring signals (${event.title}).`;
      return {
        triggered: true,
        alertType: 'HIRING_SPIKE',
        severity,
        title: `Hiring Signal: ${compName}`,
        reason: explanation
      };
    }
  },
  {
    ruleId: 'RULE_FUNDING_EVENT',
    name: 'Capital & Funding Announcement Alert',
    alertType: 'FUNDING',
    enabled: true,
    matches(event, normalized) {
      const type = (event.eventType || normalized?.eventType || '').toUpperCase();
      return type === 'FUNDING';
    },
    evaluate(event, normalized, competitor) {
      const compName = competitor?.name || normalized?.competitorName || event.competitor?.name || 'Competitor';
      const importance = (event.importance || normalized?.importance || 'HIGH').toUpperCase();

      let severity = 'HIGH';
      if (importance === 'CRITICAL' || `${event.title} ${event.summary}`.includes('$100M') || `${event.title} ${event.summary}`.includes('$500M')) {
        severity = 'CRITICAL';
      }

      const explanation = `Funding alert: ${compName} secured financial capital/investment backing (${event.title}).`;
      return {
        triggered: true,
        alertType: 'FUNDING',
        severity,
        title: `Capital Funding: ${compName}`,
        reason: explanation
      };
    }
  },
  {
    ruleId: 'RULE_PARTNERSHIP',
    name: 'Strategic Alliance & Partnership Alert',
    alertType: 'PARTNERSHIP',
    enabled: true,
    matches(event, normalized) {
      const type = (event.eventType || normalized?.eventType || '').toUpperCase();
      return type === 'PARTNERSHIP';
    },
    evaluate(event, normalized, competitor) {
      const compName = competitor?.name || normalized?.competitorName || event.competitor?.name || 'Competitor';
      const importance = (event.importance || normalized?.importance || 'HIGH').toUpperCase();
      const text = `${event.title} ${event.summary || ''}`.toLowerCase();

      let severity = 'HIGH';
      if (importance === 'CRITICAL' || text.includes('strategic alliance') || text.includes('exclusive') || text.includes('aws') || text.includes('azure') || text.includes('google cloud')) {
        severity = 'CRITICAL';
      }

      const explanation = `Partnership alert: ${compName} announced a commercial or technology partnership (${event.title}).`;
      return {
        triggered: true,
        alertType: 'PARTNERSHIP',
        severity,
        title: `Strategic Partnership: ${compName}`,
        reason: explanation
      };
    }
  },
  {
    ruleId: 'RULE_MESSAGING_CHANGE',
    name: 'Market Positioning & Messaging Shift Alert',
    alertType: 'MESSAGING_CHANGE',
    enabled: true,
    matches(event, normalized) {
      const type = (event.eventType || normalized?.eventType || '').toUpperCase();
      return type === 'MESSAGING';
    },
    evaluate(event, normalized, competitor) {
      const compName = competitor?.name || normalized?.competitorName || event.competitor?.name || 'Competitor';
      const importance = (event.importance || normalized?.importance || 'MEDIUM').toUpperCase();

      let severity = 'MEDIUM';
      if (importance === 'CRITICAL' || importance === 'HIGH') {
        severity = 'HIGH';
      }

      const explanation = `Messaging shift alert: ${compName} changed strategic positioning or value proposition.`;
      return {
        triggered: true,
        alertType: 'MESSAGING_CHANGE',
        severity,
        title: `Messaging Pivot: ${compName}`,
        reason: explanation
      };
    }
  },
  {
    ruleId: 'RULE_LEADERSHIP_CHANGE',
    name: 'Executive Leadership Move Alert',
    alertType: 'IMPORTANT_PATTERN',
    enabled: true,
    matches(event, normalized) {
      const type = (event.eventType || normalized?.eventType || '').toUpperCase();
      return type === 'LEADERSHIP';
    },
    evaluate(event, normalized, competitor) {
      const compName = competitor?.name || normalized?.competitorName || event.competitor?.name || 'Competitor';
      const importance = (event.importance || normalized?.importance || 'HIGH').toUpperCase();

      let severity = 'HIGH';
      if (importance === 'CRITICAL' || `${event.title} ${event.summary}`.toLowerCase().includes('ceo')) {
        severity = 'CRITICAL';
      }

      const explanation = `Executive leadership alert: ${compName} announced C-suite or board leadership changes.`;
      return {
        triggered: true,
        alertType: 'IMPORTANT_PATTERN',
        severity,
        title: `Leadership Shift: ${compName}`,
        reason: explanation
      };
    }
  },
  {
    ruleId: 'RULE_MARKET_EXPANSION',
    name: 'Geographic & Regional Expansion Alert',
    alertType: 'COMPETITOR_ACTIVITY_SPIKE',
    enabled: true,
    matches(event, normalized) {
      const type = (event.eventType || normalized?.eventType || '').toUpperCase();
      return type === 'EXPANSION';
    },
    evaluate(event, normalized, competitor) {
      const compName = competitor?.name || normalized?.competitorName || event.competitor?.name || 'Competitor';

      const explanation = `Market expansion alert: ${compName} expanded operations into a new region or market segment.`;
      return {
        triggered: true,
        alertType: 'COMPETITOR_ACTIVITY_SPIKE',
        severity: 'HIGH',
        title: `Market Expansion: ${compName}`,
        reason: explanation
      };
    }
  },
  {
    ruleId: 'RULE_MAJOR_ANNOUNCEMENT',
    name: 'High-Importance Corporate Signal Alert',
    alertType: 'IMPORTANT_PATTERN',
    enabled: true,
    matches(event, normalized) {
      const importance = (event.importance || normalized?.importance || '').toUpperCase();
      return importance === 'HIGH' || importance === 'CRITICAL';
    },
    evaluate(event, normalized, competitor) {
      const compName = competitor?.name || normalized?.competitorName || event.competitor?.name || 'Competitor';
      const importance = (event.importance || normalized?.importance || 'HIGH').toUpperCase();

      const severity = importance === 'CRITICAL' ? 'CRITICAL' : 'HIGH';
      const explanation = `High-importance signal alert: ${compName} posted a verified ${importance.toLowerCase()}-priority corporate event.`;
      return {
        triggered: true,
        alertType: 'IMPORTANT_PATTERN',
        severity,
        title: `Critical Activity: ${compName}`,
        reason: explanation
      };
    }
  }
];

export const alertRuleEngine = {
  getRules() {
    return ALERT_RULES.filter(r => r.enabled);
  },

  evaluateEvent(eventRecord, normalizedItem = null, competitorRecord = null) {
    if (!eventRecord && !normalizedItem) {
      return { triggered: false, reason: 'Invalid event input' };
    }

    const rules = this.getRules();
    for (const rule of rules) {
      if (rule.matches(eventRecord || {}, normalizedItem)) {
        const result = rule.evaluate(eventRecord || {}, normalizedItem, competitorRecord);
        return {
          ...result,
          ruleId: rule.ruleId
        };
      }
    }

    return {
      triggered: false,
      reason: 'No matching alert rules for event signal'
    };
  }
};

export default alertRuleEngine;
