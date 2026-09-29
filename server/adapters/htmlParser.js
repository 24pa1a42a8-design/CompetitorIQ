/**
 * Robust HTML / RSS / Text Extractor Utility
 * Extracts structured intelligence signals (title, summary, publishedDate, evidence excerpts)
 * from raw HTML, XML, or JSON document strings.
 */

function cleanText(raw = '') {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/<script\b[^<]*>([\s\S]*?)<\/script>/gi, '')
    .replace(/<style\b[^<]*>([\s\S]*?)<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractMeta(html, nameOrProp) {
  const reg1 = new RegExp(`<meta\\s+name=["']${nameOrProp}["']\\s+content=["'](.*?)["']`, 'i');
  const match1 = html.match(reg1);
  if (match1 && match1[1]) return match1[1].trim();

  const reg2 = new RegExp(`<meta\\s+property=["']${nameOrProp}["']\\s+content=["'](.*?)["']`, 'i');
  const match2 = html.match(reg2);
  if (match2 && match2[1]) return match2[1].trim();

  return null;
}

export function parseSourceContent(contentString, options = {}) {
  if (!contentString || typeof contentString !== 'string') {
    return {
      title: options.defaultTitle || 'Untitled Source',
      summary: '',
      evidence: '',
      publishedDate: null,
      items: []
    };
  }

  // 1. Try parsing JSON feed if content is JSON
  if (options.contentType?.includes('json') || contentString.trim().startsWith('{')) {
    try {
      const data = JSON.parse(contentString);
      const items = Array.isArray(data) ? data : (data.items || data.articles || data.data || [data]);
      return {
        title: data.title || options.defaultTitle || 'JSON Intelligence Feed',
        summary: data.description || data.summary || '',
        evidence: cleanText(JSON.stringify(data)),
        publishedDate: data.publishedAt || data.date || null,
        items: items.map(item => ({
          title: item.title || item.name || 'Untitled Item',
          summary: item.summary || item.description || item.body || cleanText(item.content || ''),
          sourceUrl: item.url || item.link || options.sourceUrl,
          publishedDate: item.publishedAt || item.date || null,
          evidence: item.excerpt || item.summary || item.title || ''
        }))
      };
    } catch {
      // Fall through to HTML extraction if JSON parsing fails
    }
  }

  // 2. HTML Meta Extraction
  let title = extractMeta(contentString, 'og:title') ||
              extractMeta(contentString, 'twitter:title') ||
              extractMeta(contentString, 'title');

  if (!title) {
    const titleMatch = contentString.match(/<title\b[^>]*>(.*?)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      title = cleanText(titleMatch[1]);
    }
  }

  if (!title) {
    const h1Match = contentString.match(/<h1\b[^>]*>(.*?)<\/h1>/i);
    if (h1Match && h1Match[1]) {
      title = cleanText(h1Match[1]);
    }
  }

  let summary = extractMeta(contentString, 'og:description') ||
                extractMeta(contentString, 'twitter:description') ||
                extractMeta(contentString, 'description');

  if (!summary) {
    const pMatch = contentString.match(/<p\b[^>]*>(.*?)<\/p>/i);
    if (pMatch && pMatch[1]) {
      summary = cleanText(pMatch[1]);
    }
  }

  // Published Date Extraction
  let publishedDate = extractMeta(contentString, 'article:published_time') ||
                      extractMeta(contentString, 'date') ||
                      extractMeta(contentString, 'pubdate');

  if (!publishedDate) {
    const timeMatch = contentString.match(/<time\b[^>]*datetime=["'](.*?)["']/i);
    if (timeMatch && timeMatch[1]) {
      publishedDate = timeMatch[1];
    }
  }

  const cleanBodyText = cleanText(contentString);
  const excerpt = cleanBodyText.slice(0, 500);

  // Extract multiple article/item cards if present
  const items = [];
  const articleRegex = /<article\b[^>]*>([\s\S]*?)<\/article>/gi;
  let match;
  while ((match = articleRegex.exec(contentString)) !== null && items.length < 10) {
    const artHtml = match[1];
    const artTitleMatch = artHtml.match(/<h[2-4]\b[^>]*>(.*?)<\/h[2-4]>/i) || artHtml.match(/<a\b[^>]*>(.*?)<\/a>/i);
    const artTitle = artTitleMatch ? cleanText(artTitleMatch[1]) : '';
    const artText = cleanText(artHtml);

    if (artTitle && artTitle.length > 5) {
      items.push({
        title: artTitle,
        summary: artText.slice(0, 250),
        sourceUrl: options.sourceUrl,
        publishedDate: publishedDate || null,
        evidence: artText.slice(0, 400)
      });
    }
  }

  // If no article tags found, treat page as single item
  if (items.length === 0) {
    items.push({
      title: title || options.defaultTitle || 'Public Source Page',
      summary: summary || cleanBodyText.slice(0, 250) || 'Public competitor webpage content.',
      sourceUrl: options.sourceUrl,
      publishedDate: publishedDate || null,
      evidence: excerpt || summary || title || ''
    });
  }

  return {
    title: title || options.defaultTitle || 'Public Source Page',
    summary: summary || cleanBodyText.slice(0, 250),
    evidence: excerpt,
    publishedDate: publishedDate || null,
    items
  };
}

export default parseSourceContent;
