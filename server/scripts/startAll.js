import { spawn } from 'child_process';
import http from 'http';

console.log('\n==================================================');
console.log('    STARTING COMPETITORIQ FULL-STACK APPLICATION   ');
console.log('==================================================');
console.log('Starting Backend on http://localhost:5000 ...');
console.log('Starting Frontend on http://localhost:5174 ...');
console.log('--------------------------------------------------\n');

// Spawn Express Backend
const backend = spawn('node', ['server/server.js'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
  env: { ...process.env, PORT: '5000' }
});

// Spawn Vite Frontend
const frontend = spawn('npx', ['vite', '--port', '5174'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
  env: { ...process.env, VITE_API_BASE_URL: 'http://localhost:5000/api' }
});

function prefixOutput(stream, prefix, colorCode = '\x1b[36m') {
  const reset = '\x1b[0m';
  stream.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line) => {
      if (line.trim()) {
        console.log(`${colorCode}${prefix}${reset} ${line}`);
      }
    });
  });
}

prefixOutput(backend.stdout, '[Backend]');
prefixOutput(backend.stderr, '[Backend Error]', '\x1b[31m');
prefixOutput(frontend.stdout, '[Frontend]', '\x1b[32m');
prefixOutput(frontend.stderr, '[Frontend Error]', '\x1b[31m');

function cleanup() {
  console.log('\n[System] Shutting down CompetitorIQ backend and frontend...');
  try { backend.kill('SIGTERM'); } catch (_) {}
  try { frontend.kill('SIGTERM'); } catch (_) {}
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
