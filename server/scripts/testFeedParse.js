function parseFeedOrHtml(text, baseUrl = '') {
  const items = [];
  
  // 1. Try RSS / Atom
  const isRss = text.includes('<rss') || text.includes('<feed') || text.includes('xmlns="http://www.w3.org/2005/Atom"');
  if (isRss) {
    const itemRegex = /<(?:item|entry)\b[^>]*>([\s\S]*?)<\/(?:item|entry)>/gi;
    let match;
    while ((match = itemRegex.exec(text)) !== null) {
      const chunk = match[1];
      const titleMatch = chunk.match(/<title\b[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
      const linkMatch = chunk.match(/<link\b[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i) || 
                        chunk.match(/<link\b[^>]*href=["']([^"']+)["']/i);
      const dateMatch = chunk.match(/<(?:pubDate|published|updated|dc:date)\b[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/(?:pubDate|published|updated|dc:date)>/i);
      const descMatch = chunk.match(/<(?:description|summary|content:encoded)\b[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/(?:description|summary|content:encoded)>/i);
      const imgMatch = chunk.match(/<enclosure\b[^>]*url=["']([^"']+)["'][^>]*type=["']image/i) ||
                       chunk.match(/<media:(?:content|thumbnail)\b[^>]*url=["']([^"']+)["']/i) ||
                       chunk.match(/<img\b[^>]*src=["']([^"']+)["']/i);

      let title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : '';
      let link = linkMatch ? (linkMatch[1] || linkMatch[2] || '').replace(/<!\[CDATA\[|\]\]>/g, '').trim() : '';
      let date = dateMatch ? dateMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : null;
      let description = descMatch ? descMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
      let image = imgMatch ? imgMatch[1].trim() : null;

      if (title) {
        items.push({
          title,
          link: link || baseUrl,
          date,
          description: description.slice(0, 300),
          image
        });
      }
    }
  }

  // 2. Try HTML Articles
  if (items.length === 0) {
    const articleRegex = /<(?:article|div\b[^>]*class=["'][^"']*(?:news|press|article|card)[^"']*["'])[^>]*>([\s\S]*?)<\/(?:article|div)>/gi;
    let match;
    while ((match = articleRegex.exec(text)) !== null && items.length < 15) {
      const chunk = match[1];
      const titleMatch = chunk.match(/<h[2-4]\b[^>]*>(?:<a\b[^>]*>)?([\s\S]*?)(?:<\/a>)?<\/h[2-4]>/i) ||
                         chunk.match(/<a\b[^>]*class=["'][^"']*title[^"']*["'][^>]*>([\s\S]*?)<\/a>/i);
      const linkMatch = chunk.match(/<a\b[^>]*href=["']([^"']+)["']/i);
      const imgMatch = chunk.match(/<img\b[^>]*src=["']([^"']+)["']/i);
      const dateMatch = chunk.match(/<time\b[^>]*datetime=["']([^"']+)["']/i) || chunk.match(/(\w{3,9}\s+\d{1,2},\s+\d{4})/);

      let title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';
      let link = linkMatch ? linkMatch[1].trim() : baseUrl;
      if (link.startsWith('/')) {
        try { link = new URL(link, baseUrl).href; } catch (e) {}
      }
      let image = imgMatch ? imgMatch[1].trim() : null;
      if (image && image.startsWith('/')) {
        try { image = new URL(image, baseUrl).href; } catch (e) {}
      }
      let date = dateMatch ? (dateMatch[1] || dateMatch[0]) : null;
      let desc = chunk.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300);

      if (title && title.length > 10 && !title.toLowerCase().includes('cookie') && !title.toLowerCase().includes('privacy')) {
        items.push({
          title,
          link,
          date,
          description: desc,
          image
        });
      }
    }
  }

  return items;
}

const sources = [
  { name: 'Microsoft', url: 'https://news.microsoft.com/feed/' },
  { name: 'AWS', url: 'https://aws.amazon.com/blogs/aws/feed/' },
  { name: 'Google Cloud', url: 'https://cloud.google.com/blog/rss/' },
  { name: 'Salesforce', url: 'https://www.salesforce.com/news/feed/' },
  { name: 'Oracle', url: 'https://www.oracle.com/news/announcement/' },
  { name: 'IBM', url: 'https://newsroom.ibm.com/announcements' }
];

async function testAll() {
  for (const s of sources) {
    try {
      const res = await fetch(s.url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } });
      const text = await res.text();
      const items = parseFeedOrHtml(text, s.url);
      console.log(`\n=== ${s.name} ===`);
      console.log(`Status: ${res.status}, Extracted Items: ${items.length}`);
      if (items.length > 0) {
        console.log('Sample Title:', items[0].title);
        console.log('Sample URL:', items[0].link);
        console.log('Sample Date:', items[0].date);
        console.log('Sample Image:', items[0].image || 'None in entry (will fallback to logo)');
      }
    } catch (e) {
      console.error(`${s.name} Failed:`, e.message);
    }
  }
}

testAll();
