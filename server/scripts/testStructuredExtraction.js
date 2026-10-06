async function testGoogle() {
  const urls = [
    'https://cloud.google.com/feeds/gcp-release-notes.xml',
    'https://cloud.google.com/blog/topics/inside-google-cloud/rss',
    'https://cloud.google.com/blog/products/ai-machine-learning/rss',
    'https://cloud.google.com/blog/products/gcp/rss',
    'https://cloudblog.withgoogle.com/rss'
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const text = await res.text();
      console.log(url, 'Status:', res.status, 'Length:', text.length, 'IsXML:', text.includes('<rss') || text.includes('<feed') || text.includes('<?xml'));
    } catch (e) {
      console.log(url, 'Error:', e.message);
    }
  }
}
testGoogle();
