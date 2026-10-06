/**
 * Competitive Intelligence Classifier
 * Rule-based keyword & pattern classification into standardized EventType categories.
 */

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const CATEGORY_PATTERNS = [
  {
    type: 'PARTNERSHIP',
    keywords: [
      'partner', 'partners', 'partnership', 'partnerships', 'alliance', 'alliances',
      'collaboration', 'joint venture', 'strategic agreement', 'multi-cloud deal',
      'agreement', 'consortium', 'jointly', 'cooperation', 'teaming'
    ]
  },
  {
    type: 'FUNDING',
    keywords: [
      'funding', 'series a', 'series b', 'series c', 'valuation', 'investor',
      'venture', 'capital', 'raises', 'raised', 'seed round', 'acquisition',
      'acquired', 'investment'
    ]
  },
  {
    type: 'PRICING',
    keywords: [
      'pricing', 'price', 'tier', 'subscription', 'plan', 'discount', 'billing',
      'usage-based', 'credits', 'cost', 'freemium', 'licensing'
    ]
  },
  {
    type: 'PRODUCT',
    keywords: [
      'product', 'launch', 'launches', 'released', 'release', 'releases', 'version',
      'v2', 'v3', 'platform', 'service', 'general availability', 'ga release', 'unveiled', 'unveils'
    ]
  },
  {
    type: 'FEATURE',
    keywords: [
      'feature', 'capability', 'update', 'enhancement', 'preview', 'beta',
      'integration api', 'module'
    ]
  },
  {
    type: 'HIRING',
    keywords: [
      'hiring', 'jobs', 'roles', 'recruiting', 'recruits', 'talent', 'headcount',
      'careers', 'openings', 'hired'
    ]
  },
  {
    type: 'LEADERSHIP',
    keywords: [
      'ceo', 'cto', 'cfo', 'executive', 'board member', 'appointed', 'appoints',
      'resigned', 'steps down', 'president', 'chief executive'
    ]
  },
  {
    type: 'EXPANSION',
    keywords: [
      'expansion', 'expands', 'expand', 'regional', 'data center', 'datacenter',
      'apac', 'emea', 'geographic', 'new office', 'hq relocation'
    ]
  },
  {
    type: 'MESSAGING',
    keywords: [
      'positioning', 'headline', 'rebrand', 'tagline', 'campaign', 'slogan',
      'mission', 'narrative', 'repositioning'
    ]
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

export default classifyEvent;
