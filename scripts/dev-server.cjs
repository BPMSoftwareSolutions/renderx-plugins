#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT ? Number(process.env.PORT) : 5007;
const ROOT = process.cwd();

const MIME = new Map(Object.entries({
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif'
}));

function safeJoin(base, target) {
  const p = path.join(base, target);
  const rel = path.relative(base, p);
  if (rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return p;
}

const server = http.createServer((req, res) => {
  try {
    const url = decodeURIComponent(req.url || '/');
    let filePath = url.split('?')[0];
    if (filePath.endsWith('/')) filePath += 'index.html';
    const abs = safeJoin(ROOT, filePath);
    if (!abs) {
      res.writeHead(400); res.end('Bad Request'); return;
    }
    fs.stat(abs, (err, stat) => {
      if (err || !stat.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
        return;
      }
      const ext = path.extname(abs).toLowerCase();
      const type = MIME.get(ext) || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': type,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      });
      fs.createReadStream(abs).pipe(res);
    });
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Server error');
  }
});

server.listen(PORT, () => {
  console.log(`[dev-server] Listening on http://localhost:${PORT}`);
});

