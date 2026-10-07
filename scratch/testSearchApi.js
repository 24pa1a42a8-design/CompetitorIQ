import http from 'http';

function search(query) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:5000/api/search?q=${encodeURIComponent(query)}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
        } catch (err) {
          resolve({ statusCode: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
  });
}

async function run() {
  const res = await search('AWS');
  console.log('Search AWS response:', JSON.stringify(res, null, 2));
}

run();
