/**
 * Research Planner Module
 * Breaks down user research prompts into structured task plans and target competitor identification.
 */

export class ResearchPlanner {
  createPlan(userQuery) {
    const queryLower = userQuery.toLowerCase();
    const competitors = [];

    const candidateEntities = [
      'Oracle', 'IBM', 'AWS', 'Salesforce', 'Microsoft', 'Google',
      'Tesla', 'BYD', 'Tata Motors'
    ];

    candidateEntities.forEach(entity => {
      if (queryLower.includes(entity.toLowerCase())) {
        competitors.push(entity);
      }
    });

    let domainCategory = 'Enterprise Cloud & Database';
    if (/crm|salesforce|agentforce|customer/i.test(queryLower)) {
      domainCategory = 'Enterprise CRM & Agentic Workflow';
    } else if (/aws|cloud|compute|bedrock/i.test(queryLower)) {
      domainCategory = 'Hyperscale Cloud & Infrastructure';
    } else if (/ibm|watsonx|hybrid|red hat/i.test(queryLower)) {
      domainCategory = 'Hybrid Cloud & Enterprise AI';
    }

    const steps = [
      { id: 1, name: 'Understand Research Goal', status: 'completed', detail: `Analyzed query intent for domain: ${domainCategory}` },
      { id: 2, name: 'Retrieve Hindsight Memory Context', status: 'pending', detail: 'Querying vector memory engine for historical context...' },
      { id: 3, name: 'Discover & Map Competitor Ecosystem', status: 'pending', detail: `Identifying key rivals in ${domainCategory}...` },
      { id: 4, name: 'Web Data Ingestion & Crawl', status: 'pending', detail: 'Collecting public pricing, product specs, and filings...' },
      { id: 5, name: 'Extract Structured Intelligence', status: 'pending', detail: 'Parsing features, pricing tiers, and market positioning...' },
      { id: 6, name: 'Delta & Change Detection ("What Changed?")', status: 'pending', detail: 'Comparing current metrics against Hindsight historical baseline...' },
      { id: 7, name: 'Synthesize Multi-Competitor Matrix', status: 'pending', detail: 'Cross-benchmarking feature coverage & strengths...' },
      { id: 8, name: 'Generate AI Strategic Insights', status: 'pending', detail: 'Formulating strategic threat assessments & recommendations...' },
      { id: 9, name: 'Store Context to Hindsight Memory', status: 'pending', detail: 'Persisting new intelligence to persistent memory bank...' },
      { id: 10, name: 'Generate Executive Brief', status: 'pending', detail: 'Assembling final interactive report with source citations...' }
    ];

    return {
      query: userQuery,
      domainCategory,
      explicitCompetitors: competitors.length > 0 ? competitors : ['Oracle', 'IBM', 'AWS', 'Salesforce'],
      planSteps: steps
    };
  }
}

export const researchPlanner = new ResearchPlanner();
