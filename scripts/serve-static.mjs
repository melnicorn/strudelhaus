// Serves the static export in out/ with a plain Node HTTP server (no Next), to check it works
// the way a CDN or static host would serve it.
// Run with: node scripts/serve-static.mjs [port]   (build first with: npm run build:static)
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const ROOT = resolve('out');
const PORT = Number(process.argv[2] ?? process.env.PORT ?? 3000);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
};

if (!existsSync(ROOT)) {
  console.error('No out/ folder. Run `npm run build:static` first.');
  process.exit(1);
}

const isFile = (p) => existsSync(p) && statSync(p).isFile();

function send(res, status, file) {
  res.writeHead(status, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
}

createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = join(ROOT, normalize(path));
  if (!file.startsWith(ROOT)) return res.writeHead(403).end();

  if (isFile(file)) return send(res, 200, file);
  // Pages are folders with index.html (trailingSlash); send /learn/x to /learn/x/ like static hosts do.
  if (isFile(join(file, 'index.html'))) {
    if (!path.endsWith('/')) return res.writeHead(301, { Location: `${path}/` }).end();
    return send(res, 200, join(file, 'index.html'));
  }
  const notFound = join(ROOT, '404.html');
  if (isFile(notFound)) return send(res, 404, notFound);
  res.writeHead(404).end('Not found');
}).listen(PORT, () => console.log(`Serving out/ at http://localhost:${PORT}`));
