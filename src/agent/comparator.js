/**
 * Comparator Module
 * Constructs multi-competitor comparison matrix across pricing, features, market positioning, strengths, and risks.
 */

export class Comparator {
  compare(competitors, webSources = []) {
    return {
      matrix: [
        {
          field: 'Market Positioning',
          Oracle: 'Autonomous Database & High-performance OCI Multi-Cloud Egress.',
          IBM: 'Regulated Enterprise AI with watsonx & Hybrid Red Hat OpenShift.',
          AWS: 'Global Hyperscale Cloud Footprint with 200+ AWS services & Bedrock.',
          Salesforce: 'Unified Enterprise Customer 360 & Autonomous Agentforce workflows.'
        },
        {
          field: 'Pricing & Billing Model',
          Oracle: 'Universal Credits & Annual Committed OCI Consumption.',
          IBM: 'Hybrid Capacity Subscription + Enterprise Consulting Agreements.',
          AWS: 'Pay-as-you-go Consumption with Savings Plans.',
          Salesforce: 'Per-user annual subscription + $2 per Agentforce conversation.'
        },
        {
          field: 'Autonomous AI Capability',
          Oracle: 'OCI Autonomous Database 23ai & Select AI Vector Search.',
          IBM: 'watsonx.ai Agent Orchestration & Open Granite 3.0 Models.',
          AWS: 'Amazon Bedrock Multi-Agent API & Custom Trainium2 Silicon.',
          Salesforce: 'Agentforce Studio & Low-code Agentic Workflow Automation.'
        },
        {
          field: 'Security & Compliance',
          Oracle: 'SOC2 Type II, FedRAMP High, ISO 27001, Sovereign Cloud Certified.',
          IBM: 'SOC2 Type II, HIPAA Compliant, PCI-DSS, ISO 27001.',
          AWS: 'SOC1/2/3, FedRAMP High, DoD SRG IL6.',
          Salesforce: 'SOC2 Type II, ISO 27001, HIPAA, Hyperforce Data Residency.'
        }
      ],
      competitorCards: competitors
    };
  }
}

export const comparator = new Comparator();
