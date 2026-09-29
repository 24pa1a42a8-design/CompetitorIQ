/**
 * Competitive Intelligence Classifier
 * Rule-based keyword & pattern classification into standardized EventType categories.
 */

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const CATEGORY_PATTERNS = [
  {
    type: 'FUNDING',
    keywords: ['funding', 'series a', 'series b', 'series c', 'valuation', 'investor', 'venture', 'capital', 'raises', 'raised', 'seed round', 'acquisition', 'acquired']
  },
  {
    type: 'PRICING',
    keywords: ['pricing', 'price', 'tier', 'subscription', 'plan', 'discount', 'billing', 'usage-based', 'credits', 'cost', 'freemium']
  },
  {
    type: 'PRODUCT',
    keywords: ['product', 'launch', 'launches', 'release', 'version', 'v2', 'v3', 'platform', 'service', 'general availability', 'ga release']
  },
  {
    type: 'FEATURE',
    keywords: ['feature', 'capability', 'update', 'enhancement', 'preview', 'beta', 'integration api', 'module']
  },
  {
    type: 'HIRING',
    keywords: ['hiring', 'jobs', 'roles', 'recruiting', 'talent', 'headcount', 'careers', 'openings', 'hired']
  },
  {
    type: 'LEADERSHIP',
    keywords: ['ceo', 'cto', 'cfo', 'executive', 'board member', 'appointed', 'appoints', 'resigned', 'steps down', 'president']
  },
  {
    type: 'PARTNERSHIP',
    keywords: ['partner', 'partnership', 'alliance', 'collaboration', 'joint venture', 'strategic agreement', 'multi-cloud deal']
  },
  {
    type: 'EXPANSION',
    keywords: ['expansion', 'regional', 'data center', 'datacenter', 'apac', 'emea', 'geographic', 'new office', 'hq relocation']
  },
  {
    type: 'MESSAGING',
    keywords: ['positioning', 'headline', 'rebrand', 'tagline', 'campaign', 'slogan', 'mission', 'narrative', 'repositioning']
  }
];

export function classifyEvent(title = '', summary = '', description = '') {
  const combinedText = `${title} ${summary} ${description}`.toLowerCase();

  for (const category of CATEGORY_PATTERNS) {
    for (const keyword of category.keywords) {
      const pattern = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'i');
      if (pattern.test(combinedText)) {
        return category.type;
      }
    }
  }

  return 'ANNOUNCEMENT';
}
