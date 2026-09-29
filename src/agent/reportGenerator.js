/**
 * Report Generator Module
 * Compiles all research artifacts into a comprehensive, exportable executive report.
 */

export class ReportGenerator {
  generateReport(plan, competitors, comparison, changes, insights, webSources) {
    const title = `CompetitorIQ Intelligence Brief: ${plan.query}`;
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const executiveSummary = `This autonomous competitor intelligence report analyzes the strategic moves, pricing structures, and product differentiation for ${competitors.map(c => c.name).join(', ')}. Research conducted across ${webSources.length} verified web sources and cross-referenced with Hindsight persistent vector memory.`;

    const markdownText = `# ${title}
*Generated on ${date} by CompetitorIQ Autonomous Agent*

---

## Executive Summary
${executiveSummary}

## Competitors Analyzed
${competitors.map(c => `- **${c.name}** (${c.category}): Market Share ${c.marketShare || 'N/A'}, Pricing: ${c.pricingRange}`).join('\n')}

---

## Strategic Changes & Delta ("What Changed?")
${changes.map(ch => `### ${ch.competitor} — ${ch.title}
- **Change Type**: ${ch.changeType}
- **Date Logged**: ${ch.date}
- **Previous Baseline**: ${ch.previousState}
- **Current State**: ${ch.currentState}
- **Source**: ${ch.source} (${ch.confidence})
`).join('\n')}

---

## AI Strategic Insights
${insights.map(i => `### [${i.badge}] ${i.title}
**Analysis**: ${i.analysis}
**Recommendation**: ${i.recommendation}
`).join('\n')}

---

## Verified Sources & Telemetry
${webSources.map(s => `- [${s.title}](${s.url}) — *${s.domain}* (${s.date})`).join('\n')}
`;

    return {
      title,
      date,
      executiveSummary,
      competitors,
      comparison,
      changes,
      insights,
      webSources,
      markdownText
    };
  }
}

export const reportGenerator = new ReportGenerator();
