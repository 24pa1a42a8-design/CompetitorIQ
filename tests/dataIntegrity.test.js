import test from 'node:test';
import assert from 'node:assert';
import { getPrismaClient } from '../server/config/database.js';
import { resolveCompetitorFromSource } from '../server/ingestion/competitorResolver.js';

test('Competitor Data Integrity & Identity Resolution Tests', async (t) => {
  const prisma = getPrismaClient();

  await t.test('1. resolveCompetitorFromSource correctly maps official domains for all 6 competitors', () => {
    const testCases = [
      { url: 'https://newsroom.ibm.com/announcements', expected: 'IBM' },
      { url: 'https://cloud.google.com/blog/topics/developers', expected: 'Google Cloud' },
      { url: 'https://aws.amazon.com/blogs/aws/feed/', expected: 'AWS' },
      { url: 'https://news.microsoft.com/feed/', expected: 'Microsoft' },
      { url: 'https://azure.microsoft.com/en-us/blog/feed/', expected: 'Microsoft' },
      { url: 'https://www.oracle.com/news/announcement/', expected: 'Oracle' },
      { url: 'https://www.salesforce.com/news/feed/', expected: 'Salesforce' }
    ];

    for (const tc of testCases) {
      const res = resolveCompetitorFromSource({ sourceUrl: tc.url });
      assert.ok(res, `Failed to resolve competitor for URL: ${tc.url}`);
      assert.strictEqual(res.name, tc.expected, `Expected ${tc.expected} for ${tc.url}, got ${res.name}`);
    }
  });

  await t.test('2. resolveCompetitorFromSource fails closed on unknown or unverified domains', () => {
    const unknown = resolveCompetitorFromSource({ sourceUrl: 'https://unknown-random-domain.com/feed' });
    assert.strictEqual(unknown, null, 'Unrecognized domain must fail closed and return null');
  });

  await t.test('3. Database Event Audit — Zero cross-company mismatches in PostgreSQL', async () => {
    if (!prisma) return;

    const events = await prisma.competitorEvent.findMany({
      include: {
        competitor: true,
        source: true
      }
    });

    assert.ok(events.length > 0, 'Database should contain verified intelligence events');

    let mismatches = 0;
    const mismatchDetails = [];

    for (const event of events) {
      const compName = event.competitor?.name || 'UNKNOWN';
      const url = (event.source?.url || '').toLowerCase();
      const sourceName = (event.source?.name || event.source?.publisher || '').toLowerCase();

      let expected = null;
      if (url.includes('newsroom.ibm.com') || url.includes('ibm.com') || sourceName.includes('ibm newsroom')) expected = 'IBM';
      else if (url.includes('cloud.google.com') || url.includes('blog.google') || sourceName.includes('google cloud')) expected = 'Google Cloud';
      else if (url.includes('aws.amazon.com') || url.includes('amazon.com/aws') || sourceName.includes('aws news')) expected = 'AWS';
      else if (url.includes('microsoft.com') || url.includes('azure.microsoft.com') || url.includes('azure.com') || sourceName.includes('microsoft official')) expected = 'Microsoft';
      else if (url.includes('oracle.com') || sourceName.includes('oracle news')) expected = 'Oracle';
      else if (url.includes('salesforce.com') || sourceName.includes('salesforce news')) expected = 'Salesforce';

      if (expected && expected !== compName) {
        mismatches++;
        mismatchDetails.push({
          id: event.id,
          title: event.title,
          assigned: compName,
          expected
        });
      }
    }

    if (mismatches > 0) {
      console.error('Mismatches found in DB test:', mismatchDetails);
    }

    assert.strictEqual(mismatches, 0, `Expected 0 cross-company mismatches in database, found ${mismatches}`);
  });
});
