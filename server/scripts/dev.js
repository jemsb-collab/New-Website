'use strict';

const { spawn } = require('node:child_process');
const path = require('node:path');

const root = path.join(__dirname, '..', '..');

const server = spawn('node', ['server/index.js'], { cwd: root, stdio: 'inherit', env: { ...process.env, PORT: '3001' } });
const client = spawn('npm', ['--prefix', 'client', 'run', 'dev'], { cwd: root, stdio: 'inherit' });

function shutdown() {
  server.kill();
  client.kill();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

server.on('exit', () => shutdown());
client.on('exit', () => shutdown());
