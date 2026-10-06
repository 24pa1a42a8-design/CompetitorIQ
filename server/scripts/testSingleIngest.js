import 'dotenv/config';
import { fetchPublicSource } from '../adapters/httpFetcher.js';
import { parseSourceContent } from '../adapters/htmlParser.js';
import { ingestionService } from '../services/ingestionService.js';

async function test() {
  const url = 'https://news.microsoft.com/feed/';
  const fetchRes = await fetchPublicSource(url);
  console.log('Fetch success:', fetchRes.success, 'status:', fetchRes.statusCode, 'content length:', fetchRes.content?.length);
  if (!fetchRes.success) {
    console.log('Fetch error:', fetchRes.error);
    return;
  }
  const parsed = parseSourceContent(fetchRes.content, { sourceUrl: url });
  console.log('Parsed items count:', parsed.items?.length);
  if (parsed.items?.length > 0) {
    console.log('Item 0:', parsed.items[0]);
    try {
      const res = await ingestionService.processItem({
        competitor: 'Microsoft',
        competitorName: 'Microsoft',
        competitorId: 'microsoft',
        title: parsed.items[0].title,
        summary: parsed.items[0].summary,
        description: parsed.items[0].summary,
        source: 'Microsoft Official Newsroom',
        sourceUrl: parsed.items[0].sourceUrl,
        publishedAt: parsed.items[0].publishedDate,
        imageUrl: parsed.items[0].imageUrl,
        evidence: parsed.items[0].evidence
      }, { organizationId: 'default-org' });
      console.log('Ingest result:', res);
    } catch (err) {
      console.error('Ingest error:', err);
    }
  }
}
test();
