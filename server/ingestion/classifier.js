/**
 * Competitive Intelligence Classifier
 * Rule-based keyword & pattern classification into standardized EventType categories.
 */

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const CATEGORY_PATTERNS = [
  {
    type: 'PRICING',
    keywords: [
      'pricing', 'price', 'pricing model', 'tier', 'subscription', 'cost', 'billing',
      'credits', 'licensing', 'discount', 'rate', 'rates', 'per user', 'per month', 'finops', 'savings'
    ]
  },
  {
    type: 'HIRING',
    keywords: [
      'hiring', 'jobs', 'roles', 'recruiting', 'recruits', 'talent', 'headcount',
      'careers', 'openings', 'hired', 'architect', 'specialists', 'engineers', 'recruitment'
    ]
  },
  {
    type: 'EXPANSION',
    keywords: [
      'expansion', 'expands', 'expand', 'regional', 'region', 'regions', 'data center',
      'datacenter', 'data centers', 'datacenters', 'geographic', 'location', 'locations',
      'infrastructure', 'footprint', 'availability zone', 'availability zones', 'multi-cloud'
    ]
  },
  {
    type: 'FUNDING',
    keywords: [
      'funding', 'invest', 'investment', 'investments', 'consortium', 'capital',
      'valuation', 'billion', 'million', 'acquisition', 'acquired', 'venture', 'strategic investment'
    ]
  },
  {
    type: 'FEATURE',
    keywords: [
      'feature', 'features', 'capability', 'capabilities', 'update', 'updates',
      'enhancement', 'preview', 'beta', 'integration', 'api', 'apis', 'sdk', 'sdks',
      'tooling', 'module', 'security', 'remediation', 'patch', 'vulnerability', 'console'
    ]
  },
  {
    type: 'PRODUCT',
    keywords: [
      'product', 'launch', 'launches', 'launched', 'released', 'release', 'releases',
      'version', 'unveils', 'unveiled', 'general availability', 'ga release', 'platform',
      'service', 'introducing', 'introduces', 'announces', 'announced'
    ]
  },
  {
    type: 'PARTNERSHIP',
    keywords: [
      'partner', 'partners', 'partnership', 'partnerships', 'alliance', 'alliances',
      'collaboration', 'joint venture', 'strategic agreement', 'cooperation', 'teaming'
    ]
  },
  {
    type: 'LEADERSHIP',
    keywords: [
      'ceo', 'cto', 'cfo', 'executive', 'board member', 'appointed', 'appoints',
      'resigned', 'steps down', 'president', 'chief executive'
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

  return 'PRODUCT'; // Default to PRODUCT if no category matches
}

export default classifyEvent;
