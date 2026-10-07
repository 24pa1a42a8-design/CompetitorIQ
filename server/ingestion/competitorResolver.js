/**
 * CompetitorIQ — Deterministic Competitor Identity Resolver
 * Resolves competitor identity (Microsoft, AWS, Google Cloud, Oracle, Salesforce, IBM)
 * based strictly on verified source domain, publisher metadata, and explicit competitor identity.
 *
 * FAIL-CLOSED: Returns null if competitor identity cannot be mapped with confidence.
 */

export const OFFICIAL_COMPETITOR_DOMAINS = {
  'microsoft.com': { name: 'Microsoft', slug: 'microsoft' },
  'azure.microsoft.com': { name: 'Microsoft', slug: 'microsoft' },
  'azure.com': { name: 'Microsoft', slug: 'microsoft' },
  'aws.amazon.com': { name: 'AWS', slug: 'aws' },
  'amazon.com': { name: 'AWS', slug: 'aws' },
  'cloud.google.com': { name: 'Google Cloud', slug: 'google-cloud' },
  'blog.google': { name: 'Google Cloud', slug: 'google-cloud' },
  'withgoogle.com': { name: 'Google Cloud', slug: 'google-cloud' },
  'oracle.com': { name: 'Oracle', slug: 'oracle' },
  'salesforce.com': { name: 'Salesforce', slug: 'salesforce' },
  'ibm.com': { name: 'IBM', slug: 'ibm' },
  'newsroom.ibm.com': { name: 'IBM', slug: 'ibm' }
};

export function resolveCompetitorFromSource(item) {
  if (!item) return null;

  const url = (item.sourceUrl || item.source?.url || item.url || '').toLowerCase().trim();
  const sourceName = (item.source?.publisher || item.source?.name || item.sourceName || item.publisher || item.source || '').toLowerCase().trim();
  const rawId = (item.competitorId || item.competitorName || item.competitor?.name || item.competitor?.slug || item.competitor || '').toLowerCase().trim();

  // 1. OFFICIAL DOMAIN MATCHING (Highest Confidence — Cannot be overridden by title text)
  if (url.includes('newsroom.ibm.com') || url.includes('ibm.com')) return { name: 'IBM', slug: 'ibm' };
  if (url.includes('cloud.google.com') || url.includes('blog.google') || url.includes('cloudblog.withgoogle.com')) return { name: 'Google Cloud', slug: 'google-cloud' };
  if (url.includes('aws.amazon.com') || url.includes('amazon.com/aws') || url.includes('aws.amazon')) return { name: 'AWS', slug: 'aws' };
  if (url.includes('microsoft.com') || url.includes('azure.microsoft.com') || url.includes('azure.com')) return { name: 'Microsoft', slug: 'microsoft' };
  if (url.includes('oracle.com')) return { name: 'Oracle', slug: 'oracle' };
  if (url.includes('salesforce.com')) return { name: 'Salesforce', slug: 'salesforce' };

  // 2. SOURCE PUBLISHER / METADATA MATCHING
  if (sourceName.includes('ibm newsroom') || sourceName.includes('ibm blog') || sourceName.includes('watsonx blog')) return { name: 'IBM', slug: 'ibm' };
  if (sourceName.includes('google cloud') || sourceName.includes('gcp release') || sourceName.includes('vertex ai')) return { name: 'Google Cloud', slug: 'google-cloud' };
  if (sourceName.includes('aws news') || sourceName.includes('aws whats new') || sourceName.includes('amazon web services')) return { name: 'AWS', slug: 'aws' };
  if (sourceName.includes('microsoft official') || sourceName.includes('azure official') || sourceName.includes('microsoft 365')) return { name: 'Microsoft', slug: 'microsoft' };
  if (sourceName.includes('oracle news') || sourceName.includes('oracle cloud')) return { name: 'Oracle', slug: 'oracle' };
  if (sourceName.includes('salesforce news') || sourceName.includes('salesforce agentforce')) return { name: 'Salesforce', slug: 'salesforce' };

  // 3. EXPLICIT RAW COMPETITOR IDENTIFIER
  if (rawId === 'ibm') return { name: 'IBM', slug: 'ibm' };
  if (rawId === 'google-cloud' || rawId === 'google cloud' || rawId === 'google') return { name: 'Google Cloud', slug: 'google-cloud' };
  if (rawId === 'aws') return { name: 'AWS', slug: 'aws' };
  if (rawId === 'microsoft') return { name: 'Microsoft', slug: 'microsoft' };
  if (rawId === 'oracle') return { name: 'Oracle', slug: 'oracle' };
  if (rawId === 'salesforce') return { name: 'Salesforce', slug: 'salesforce' };

  // FAIL-CLOSED: Return null if source/identity cannot be mapped with confidence
  return null;
}
