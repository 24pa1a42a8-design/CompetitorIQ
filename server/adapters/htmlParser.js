/**
 * Robust HTML / RSS / XML / JSON Content Extractor
 * Extracts verified structured intelligence signals:
 * - Title
 * - Summary
 * - Original URL
 * - Published Date
 * - Official Image URL
 * - Evidence Excerpts
 */

function cleanText(raw = '') {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/<script\b[^<]*>([\s\S]*?)<\/script>/gi, '')
    .replace(/<style\b[^<]*>([\s\S]*?)<\/style>/gi, '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveUrl(relativeOrAbsolute, baseUrl) {
  if (!relativeOrAbsolute) return baseUrl;
  try {
    return new URL(relativeOrAbsolute.trim(), baseUrl).href;
  } catch {
    return relativeOrAbsolute.trim();
  }
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
  const sourceUrl = options.sourceUrl || '';
  if (!contentString || typeof contentString !== 'string') {
    return {
      title: options.defaultTitle || 'Untitled Source',
      summary: '',
      evidence: '',
      publishedDate: null,
      imageUrl: null,
      items: []
    };
  }

  // 1. Try parsing JSON feed if content is JSON
  if (options.contentType?.includes('json') || contentString.trim().startsWith('{') || contentString.trim().startsWith('[')) {
    try {
      const data = JSON.parse(contentString);
      const rawItems = Array.isArray(data) ? data : (data.items || data.articles || data.data || [data]);
      const items = rawItems.map(item => ({
        title: cleanText(item.title || item.name || 'Untitled Item'),
        summary: cleanText(item.summary || item.description || item.body || JSON.stringify(item)).slice(0, 350),
        sourceUrl: resolveUrl(item.url || item.link || sourceUrl, sourceUrl),
        publishedDate: item.publishedAt || item.date || item.publishedDate || null,
        imageUrl: item.image || item.imageUrl || item.thumbnail || null,
        evidence: cleanText(item.excerpt || item.summary || item.title || '').slice(0, 500)
      }));

      return {
        title: data.title || options.defaultTitle || 'JSON Intelligence Feed',
        summary: cleanText(data.description || data.summary || ''),
        evidence: cleanText(JSON.stringify(data)).slice(0, 500),
        publishedDate: data.publishedAt || data.date || null,
        imageUrl: data.image || null,
        items
      };
    } catch {
      // Fall through if not valid JSON
    }
  }

  // 2. Try parsing XML / RSS / Atom Feeds
  const isRssOrAtom = contentString.includes('<rss') || 
                      contentString.includes('<feed') || 
                      contentString.includes('<channel>') ||
                      contentString.includes('xmlns="http://www.w3.org/2005/Atom"');

  if (isRssOrAtom) {
    const items = [];
    const itemRegex = /<(?:item|entry)\b[^>]*>([\s\S]*?)<\/(?:item|entry)>/gi;
    let match;

    while ((match = itemRegex.exec(contentString)) !== null && items.length < 30) {
      const chunk = match[1];
      const titleMatch = chunk.match(/<title\b[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
      const linkMatch = chunk.match(/<link\b[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i) || 
                        chunk.match(/<link\b[^>]*href=["']([^"']+)["']/i);
      const dateMatch = chunk.match(/<(?:pubDate|published|updated|dc:date)\b[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/(?:pubDate|published|updated|dc:date)>/i);
      const descMatch = chunk.match(/<(?:description|summary|content:encoded)\b[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/(?:description|summary|content:encoded)>/i);
      
      const imgMatch = chunk.match(/<enclosure\b[^>]*url=["']([^"']+)["'][^>]*type=["']image/i) ||
                       chunk.match(/<media:(?:content|thumbnail)\b[^>]*url=["']([^"']+)["']/i) ||
                       chunk.match(/<img\b[^>]*src=["']([^"']+)["']/i);

      const title = cleanText(titleMatch ? titleMatch[1] : '');
      const rawLink = linkMatch ? (linkMatch[1] || linkMatch[2] || '') : '';
      const link = resolveUrl(cleanText(rawLink), sourceUrl);
      const date = dateMatch ? cleanText(dateMatch[1]) : null;
      const fullDesc = descMatch ? cleanText(descMatch[1]) : '';
      const summary = fullDesc.slice(0, 350);
      const image = imgMatch ? resolveUrl(imgMatch[1].trim(), sourceUrl) : null;

      if (title && title.length > 5 && !title.toLowerCase().includes('untitled')) {
        items.push({
          title,
          summary: summary || title,
          sourceUrl: link || sourceUrl,
          publishedDate: date ? new Date(date).toISOString() : null,
          imageUrl: image,
          evidence: fullDesc.slice(0, 500) || summary || title
        });
      }
    }

    if (items.length > 0) {
      return {
        title: items[0].title || options.defaultTitle || 'Official Feed',
        summary: items[0].summary || '',
        evidence: items[0].evidence || '',
        publishedDate: items[0].publishedDate || null,
        imageUrl: items[0].imageUrl || null,
        items
      };
    }
  }

  // 3. HTML Page Parsing
  let globalTitle = extractMeta(contentString, 'og:title') ||
                    extractMeta(contentString, 'twitter:title') ||
                    extractMeta(contentString, 'title');

  if (!globalTitle) {
    const titleMatch = contentString.match(/<title\b[^>]*>(.*?)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      globalTitle = cleanText(titleMatch[1]);
    }
  }

  let globalImage = extractMeta(contentString, 'og:image') ||
                    extractMeta(contentString, 'twitter:image') ||
                    extractMeta(contentString, 'image');

  if (globalImage) {
    globalImage = resolveUrl(globalImage, sourceUrl);
  }

  let globalSummary = extractMeta(contentString, 'og:description') ||
                      extractMeta(contentString, 'twitter:description') ||
                      extractMeta(contentString, 'description');

  if (!globalSummary) {
    const pMatch = contentString.match(/<p\b[^>]*>(.*?)<\/p>/i);
    if (pMatch && pMatch[1]) {
      globalSummary = cleanText(pMatch[1]);
    }
  }

  let globalDate = extractMeta(contentString, 'article:published_time') ||
                   extractMeta(contentString, 'date') ||
                   extractMeta(contentString, 'pubdate');

  if (!globalDate) {
    const timeMatch = contentString.match(/<time\b[^>]*datetime=["'](.*?)["']/i);
    if (timeMatch && timeMatch[1]) {
      globalDate = timeMatch[1];
    }
  }

  const cleanBody = cleanText(contentString);
  const items = [];

  // Look for articles, IBM wd_items, or press cards
  const cardRegex = /<(?:article|div\b[^>]*class=["'][^"']*(?:wd_item|news|press|article|card|release)[^"']*["'])[^>]*>([\s\S]*?)<\/(?:article|div)>/gi;
  let match;

  while ((match = cardRegex.exec(contentString)) !== null && items.length < 20) {
    const chunk = match[1];
    const artTitleMatch = chunk.match(/<(?:h[2-4]|a\b[^>]*class=["'][^"']*title[^"']*["'])\b[^>]*>(?:<a\b[^>]*>)?([\s\S]*?)(?:<\/a>)?<\/(?:h[2-4]|a)>/i) ||
                          chunk.match(/<div\b[^>]*class=["'][^"']*wd_title[^"']*["'][^>]*>[\s\S]*?<a\b[^>]*>([\s\S]*?)<\/a>/i);
    const linkMatch = chunk.match(/<a\b[^>]*href=["']([^"']+)["']/i);
    const imgMatch = chunk.match(/<img\b[^>]*src=["']([^"']+)["']/i);
    const dateMatch = chunk.match(/<time\b[^>]*datetime=["']([^"']+)["']/i) ||
                      chunk.match(/<div\b[^>]*class=["'][^"']*wd_date[^"']*["'][^>]*>([\s\S]*?)<\/div>/i) ||
                      chunk.match(/(\w{3,9}\s+\d{1,2},\s+\d{4})/);

    const artTitle = cleanText(artTitleMatch ? artTitleMatch[1] : '');
    const artLink = linkMatch ? resolveUrl(linkMatch[1], sourceUrl) : sourceUrl;
    const artImg = imgMatch ? resolveUrl(imgMatch[1], sourceUrl) : globalImage;
    const artDate = dateMatch ? cleanText(dateMatch[1] || dateMatch[0]) : globalDate;
    const artDesc = cleanText(chunk).slice(0, 350);

    if (artTitle && artTitle.length > 8 && !artTitle.toLowerCase().includes('cookie') && !artTitle.toLowerCase().includes('privacy')) {
      items.push({
        title: artTitle,
        summary: artDesc || artTitle,
        sourceUrl: artLink,
        publishedDate: artDate ? new Date(artDate).toISOString() : (globalDate ? new Date(globalDate).toISOString() : null),
        imageUrl: artImg,
        evidence: artDesc.slice(0, 500)
      });
    }
  }

  // If no card blocks parsed, use the page level metadata
  if (items.length === 0) {
    items.push({
      title: globalTitle || options.defaultTitle || 'Official Source Page',
      summary: (globalSummary || cleanBody.slice(0, 350) || 'Official intelligence source report.').slice(0, 350),
      sourceUrl,
      publishedDate: globalDate ? new Date(globalDate).toISOString() : null,
      imageUrl: globalImage,
      evidence: cleanBody.slice(0, 500)
    });
  }

  return {
    title: globalTitle || options.defaultTitle || 'Official Source Page',
    summary: globalSummary || cleanBody.slice(0, 350),
    evidence: cleanBody.slice(0, 500),
    publishedDate: globalDate ? new Date(globalDate).toISOString() : null,
    imageUrl: globalImage,
    items
  };
}

export default parseSourceContent;
