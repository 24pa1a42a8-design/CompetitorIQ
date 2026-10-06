/**
 * CompetitorIQ Source Adapters Configuration
 * Configures allowed public competitor domains and official source metadata.
 * Focal company: Microsoft. Competitors: AWS, Google Cloud, Oracle, IBM, Salesforce.
 */

export const ALLOWED_DOMAINS = [
  'oracle.com',
  'ibm.com',
  'aws.amazon.com',
  'amazon.com',
  'salesforce.com',
  'microsoft.com',
  'azure.com',
  'google.com',
  'withgoogle.com',
  'example.com',      // Allowed for fixture testing
  'localhost.local'  // Allowed for fixture testing when explicitly passed
];

export const SOURCE_CONFIGS = {
  // === Microsoft Official Sources ===
  microsoft_news: {
    id: 'microsoft_news',
    competitorName: 'Microsoft',
    adapterType: 'news_press',
    url: 'https://news.microsoft.com/feed/',
    sourceType: 'PRESS_RELEASE',
    publisher: 'Microsoft Official Newsroom',
    rateLimitMs: 2000
  },
  microsoft_azure_blog: {
    id: 'microsoft_azure_blog',
    competitorName: 'Microsoft',
    adapterType: 'product_release',
    url: 'https://azure.microsoft.com/en-us/blog/feed/',
    sourceType: 'BLOG',
    publisher: 'Microsoft Azure Official Blog',
    rateLimitMs: 2000
  },
  microsoft_azure_pricing: {
    id: 'microsoft_azure_pricing',
    competitorName: 'Microsoft',
    adapterType: 'pricing_page',
    url: 'https://azure.microsoft.com/en-us/pricing/',
    sourceType: 'PRICING_PAGE',
    publisher: 'Azure Official Pricing',
    rateLimitMs: 2000
  },
  microsoft_careers: {
    id: 'microsoft_careers',
    competitorName: 'Microsoft',
    adapterType: 'careers_hiring',
    url: 'https://careers.microsoft.com',
    sourceType: 'CAREERS',
    publisher: 'Microsoft Careers',
    rateLimitMs: 2000
  },

  // === AWS Official Sources ===
  aws_news_blog: {
    id: 'aws_news_blog',
    competitorName: 'AWS',
    adapterType: 'news_press',
    url: 'https://aws.amazon.com/blogs/aws/feed/',
    sourceType: 'BLOG',
    publisher: 'AWS News Blog',
    rateLimitMs: 2000
  },
  aws_whats_new: {
    id: 'aws_whats_new',
    competitorName: 'AWS',
    adapterType: 'product_release',
    url: 'https://aws.amazon.com/about-aws/whats-new/recent/feed/',
    sourceType: 'PRODUCT_PAGE',
    publisher: 'AWS Whats New Announcements',
    rateLimitMs: 2000
  },
  aws_pricing: {
    id: 'aws_pricing',
    competitorName: 'AWS',
    adapterType: 'pricing_page',
    url: 'https://aws.amazon.com/pricing/',
    sourceType: 'PRICING_PAGE',
    publisher: 'AWS Official Pricing',
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

  // === Google Cloud Official Sources ===
  google_cloud_blog: {
    id: 'google_cloud_blog',
    competitorName: 'Google Cloud',
    adapterType: 'news_press',
    url: 'https://cloudblog.withgoogle.com/rss',
    sourceType: 'BLOG',
    publisher: 'Google Cloud Official Blog',
    rateLimitMs: 2000
  },
  google_cloud_releases: {
    id: 'google_cloud_releases',
    competitorName: 'Google Cloud',
    adapterType: 'product_release',
    url: 'https://cloud.google.com/feeds/gcp-release-notes.xml',
    sourceType: 'PRODUCT_PAGE',
    publisher: 'Google Cloud Release Notes',
    rateLimitMs: 2000
  },
  google_cloud_pricing: {
    id: 'google_cloud_pricing',
    competitorName: 'Google Cloud',
    adapterType: 'pricing_page',
    url: 'https://cloud.google.com/pricing',
    sourceType: 'PRICING_PAGE',
    publisher: 'Google Cloud Official Pricing',
    rateLimitMs: 2000
  },
  google_cloud_news: {
    id: 'google_cloud_news',
    competitorName: 'Google Cloud',
    adapterType: 'product_release',
    url: 'https://cloud.google.com/blog',
    sourceType: 'BLOG',
    publisher: 'Google Cloud Official Blog',
    rateLimitMs: 2000
  },

  // === Oracle Official Sources ===
  oracle_cloud_feed: {
    id: 'oracle_cloud_feed',
    competitorName: 'Oracle',
    adapterType: 'product_release',
    url: 'https://blogs.oracle.com/cloud-infrastructure/feed',
    sourceType: 'BLOG',
    publisher: 'Oracle Cloud Infrastructure Blog',
    rateLimitMs: 2000
  },
  oracle_press: {
    id: 'oracle_press',
    competitorName: 'Oracle',
    adapterType: 'news_press',
    url: 'https://www.oracle.com/news/announcement/',
    sourceType: 'PRESS_RELEASE',
    publisher: 'Oracle Newsroom',
    rateLimitMs: 2000
  },
  oracle_pricing: {
    id: 'oracle_pricing',
    competitorName: 'Oracle',
    adapterType: 'pricing_page',
    url: 'https://www.oracle.com/cloud/price-list/',
    sourceType: 'PRICING_PAGE',
    publisher: 'Oracle Cloud Price List',
    rateLimitMs: 2000
  },

  // === IBM Official Sources ===
  ibm_announcements: {
    id: 'ibm_announcements',
    competitorName: 'IBM',
    adapterType: 'news_press',
    url: 'https://newsroom.ibm.com/announcements',
    sourceType: 'PRESS_RELEASE',
    publisher: 'IBM Newsroom',
    rateLimitMs: 2000
  },
  ibm_watsonx_blog: {
    id: 'ibm_watsonx_blog',
    competitorName: 'IBM',
    adapterType: 'product_release',
    url: 'https://www.ibm.com/blog/category/artificial-intelligence/feed/',
    sourceType: 'BLOG',
    publisher: 'IBM watsonx AI Blog',
    rateLimitMs: 2000
  },
  ibm_pricing: {
    id: 'ibm_pricing',
    competitorName: 'IBM',
    adapterType: 'pricing_page',
    url: 'https://www.ibm.com/cloud/pricing',
    sourceType: 'PRICING_PAGE',
    publisher: 'IBM Cloud Pricing',
    rateLimitMs: 2000
  },

  // === Salesforce Official Sources ===
  salesforce_news: {
    id: 'salesforce_news',
    competitorName: 'Salesforce',
    adapterType: 'news_press',
    url: 'https://www.salesforce.com/news/feed/',
    sourceType: 'PRESS_RELEASE',
    publisher: 'Salesforce News',
    rateLimitMs: 2000
  },
  salesforce_agentforce: {
    id: 'salesforce_agentforce',
    competitorName: 'Salesforce',
    adapterType: 'product_release',
    url: 'https://www.salesforce.com/agentforce/',
    sourceType: 'PRODUCT_PAGE',
    publisher: 'Salesforce Agentforce Product Portal',
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
