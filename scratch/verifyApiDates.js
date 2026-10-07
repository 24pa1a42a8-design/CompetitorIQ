import http from 'http';

function getEvents() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:5000/api/ingestion/events?limit=35', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  const res = await getEvents();
  const events = res?.data?.events || res?.data || [];
  console.log(`Fetched ${events.length} events from API:`);
  events.slice(0, 15).forEach(e => {
    const comp = e.competitor?.name || 'Competitor';
    const dateStr = e.eventDate ? new Date(e.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date unavailable';
    console.log(`- [${dateStr}] (${comp} | ${e.eventType}) ${e.title.slice(0, 60)}...`);
  });
}

run();
