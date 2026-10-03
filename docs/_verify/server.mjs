import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root = process.argv[2];
const port = Number(process.argv[3] || 18777);
const FLAT = 'dsh__node_modules__@deepseek-ai__dsh-web-frontend__dist__';
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.woff':'font/woff', '.ttf':'font/ttf', '.webmanifest':'application/manifest+json', '.png':'image/png' };
const alias = (p) => {
  if (p === '/' || p === '/index.html') return FLAT + 'index.html';
  if (p.startsWith('/assets/')) return FLAT + 'assets__' + p.slice('/assets/'.length);
  if (p === '/manifest.webmanifest') return FLAT + 'manifest.webmanifest';
  if (p === '/favicon.svg') return FLAT + 'favicon.svg';
  if (p === '/favicon-dark.svg') return FLAT + 'favicon-dark.svg';
  return null;
};
http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]);
  const mapped = alias(p) ?? p.replace(/^\//, '');
  const f = path.join(root, mapped);
  if (!f.startsWith(root)) { res.writeHead(403); return res.end('no'); }
  fs.readFile(f, (e, data) => {
    if (e) { res.writeHead(404); return res.end('404 ' + mapped); }
    res.writeHead(200, { 'content-type': mime[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(data);
  });
}).listen(port, '127.0.0.1', () => console.log('LISTENING http://127.0.0.1:' + port));
