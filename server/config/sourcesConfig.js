/**
 * CompetitorIQ Source Adapters Configuration
 * Configures allowed public competitor domains and source metadata.
 */

export const ALLOWED_DOMAINS = [
  'oracle.com',
  'ibm.com',
  'aws.amazon.com',
  'amazon.com',
  'salesforce.com',
  'microsoft.com',
  'google.com',
  'example.com',      // Allowed for fixture testing
  'localhost.local'  // Allowed for fixture testing when explicitly passed
];

export const SOURCE_CONFIGS = {
  oracle_press: {
    id: 'oracle_press',
    competitorName: 'Oracle',
    adapterType: 'news_press',
    url: 'https://oracle.com/news/press',
    sourceType: 'PRESS_RELEASE',
    publisher: 'Oracle Newsroom',
    rateLimitMs: 2000
  },
  ibm_announcements: {
    id: 'ibm_announcements',
    competitorName: 'IBM',
    adapterType: 'product_release',
    url: 'https://ibm.com/news/announcements',
    sourceType: 'PRODUCT_PAGE',
    publisher: 'IBM Newsroom',
    rateLimitMs: 2000
  },
  aws_careers: {
    id: 'aws_careers',
    competitorName: 'AWS',
    adapterType: 'careers_hiring',
    url: 'https://aws.amazon.com/careers',
    sourceType: 'CAREERS',
    publisher: 'AWS Careers',
    rateLimitMs: 2000
  },
  salesforce_pricing: {
    id: 'salesforce_pricing',
    competitorName: 'Salesforce',
    adapterType: 'pricing_page',
    url: 'https://salesforce.com/pricing',
    sourceType: 'PRICING_PAGE',
    publisher: 'Salesforce Official Pricing',
    rateLimitMs: 2000
  }
};

export default {
  ALLOWED_DOMAINS,
  SOURCE_CONFIGS
};
