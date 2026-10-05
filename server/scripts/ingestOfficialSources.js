/**
 * CompetitorIQ — Official Sources Live Ingestion Script
 * Fetches verified public feeds & pages from official corporate sources only:
 * - Microsoft (Focal)
 * - AWS
 * - Google Cloud
 * - Oracle
 * - IBM
 * - Salesforce
 *
 * Persists records into PostgreSQL with deduplication, evidence excerpts, and original source URLs.
 */

import 'dotenv/config';
import { SOURCE_CONFIGS } from '../config/sourcesConfig.js';
import { fetchPublicSource } from '../adapters/httpFetcher.js';
import { parseSourceContent } from '../adapters/htmlParser.js';
import { ingestionService } from '../services/ingestionService.js';
import { getPrismaClient } from '../config/database.js';

const COMPANIES = [
  'Microsoft',
  'AWS',
  'Google Cloud',
  'Oracle',
  'IBM',
  'Salesforce'
];

async function runOfficialIngestion() {
  console.log('================================================================');
  console.log(' CompetitorIQ — Real Official Source Data Ingestion Pipeline');
  console.log(` Timestamp: ${new Date().toISOString()}`);
  console.log(' Organizations: Scoped to authenticated tenant (default-org)');
  console.log('================================================================\n');

  // Verify database connection
  const prisma = getPrismaClient();
  if (prisma) {
    try {
      await prisma.$connect();
      console.log('✔ Connected to PostgreSQL database\n');
    } catch (dbErr) {
      console.error('✖ Database connection error:', dbErr.message);
      process.exit(1);
    }
  }

  const overallReport = {
    totalSourcesChecked: 0,
    totalPagesRetrieved: 0,
    totalNewEvents: 0,
    totalDuplicatesSkipped: 0,
    totalFailedSources: 0
  };

  const companyStats = {};
  for (const c of COMPANIES) {
    companyStats[c] = {
      sourcesChecked: 0,
      pagesRetrieved: 0,
      newEvents: 0,
      updatedEvents: 0,
      duplicatesSkipped: 0,
      failedSources: 0,
      sampleUrls: []
    };
  }

  const allConfigs = Object.values(SOURCE_CONFIGS);

  for (const compName of COMPANIES) {
    const configsForComp = allConfigs.filter(cfg => cfg.competitorName?.toLowerCase() === compName.toLowerCase());
    const stats = companyStats[compName];

    for (const cfg of configsForComp) {
      stats.sourcesChecked++;
      overallReport.totalSourcesChecked++;

      try {
        const fetchRes = await fetchPublicSource(cfg.url, {
          rateLimitMs: cfg.rateLimitMs || 1000,
          timeoutMs: 15000,
          maxRetries: 2,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });

        if (!fetchRes.success || !fetchRes.content) {
          stats.failedSources++;
          overallReport.totalFailedSources++;
          continue;
        }

        stats.pagesRetrieved++;
        overallReport.totalPagesRetrieved++;

        const parsed = parseSourceContent(fetchRes.content, {
          sourceUrl: cfg.url,
          defaultTitle: `${cfg.publisher || compName} Announcement`,
          contentType: fetchRes.contentType
        });

        const items = parsed.items || [];

        for (const item of items) {
          const rawItem = {
            competitor: compName,
            competitorName: compName,
            competitorId: compName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            title: item.title,
            summary: item.summary,
            description: item.evidence || item.summary,
            source: cfg.publisher || compName,
            sourceUrl: item.sourceUrl || cfg.url,
            publishedAt: item.publishedDate || fetchRes.fetchedAt,
            imageUrl: item.imageUrl || null,
            evidence: item.evidence || item.summary || item.title
          };

          const result = await ingestionService.processItem(rawItem, {
            organizationId: 'default-org'
          });

          if (result.isDuplicate) {
            stats.duplicatesSkipped++;
            overallReport.totalDuplicatesSkipped++;
          } else {
            stats.newEvents++;
            overallReport.totalNewEvents++;
            if (stats.sampleUrls.length < 2 && item.sourceUrl) {
              stats.sampleUrls.push(item.sourceUrl);
            }
          }
        }
      } catch (_err) {
        stats.failedSources++;
        overallReport.totalFailedSources++;
      }
    }
  }

  // Print Report per Company
  console.log('----------------------------------------------------------------');
  console.log(' OFFICIAL INGESTION SUMMARY REPORT');
  console.log('----------------------------------------------------------------');
  for (const compName of COMPANIES) {
    const s = companyStats[compName];
    console.log(`\n${compName}`);
    console.log(`  - Sources checked:    ${s.sourcesChecked}`);
    console.log(`  - Pages retrieved:    ${s.pagesRetrieved}`);
    console.log(`  - New events:         ${s.newEvents}`);
    console.log(`  - Updated events:     ${s.updatedEvents}`);
    console.log(`  - Duplicates skipped: ${s.duplicatesSkipped}`);
    console.log(`  - Failed sources:     ${s.failedSources}`);
    if (s.sampleUrls.length > 0) {
      console.log(`  - Sample Verified Source URLs:`);
      for (const u of s.sampleUrls) {
        console.log(`      * ${u}`);
      }
    }
  }

  console.log('\n================================================================');
  console.log(' OVERALL PIPELINE TOTALS');
  console.log(`  - Total Sources Checked:    ${overallReport.totalSourcesChecked}`);
  console.log(`  - Total Pages Retrieved:    ${overallReport.totalPagesRetrieved}`);
  console.log(`  - Total New Events Added:   ${overallReport.totalNewEvents}`);
  console.log(`  - Total Duplicates Skipped: ${overallReport.totalDuplicatesSkipped}`);
  console.log(`  - Total Failed Sources:     ${overallReport.totalFailedSources}`);
  console.log('================================================================\n');

  if (prisma) {
    await prisma.$disconnect();
  }

  return overallReport;
}

runOfficialIngestion().catch(err => {
  console.error('Fatal ingestion script error:', err);
  process.exit(1);
});
