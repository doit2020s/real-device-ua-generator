import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { refreshBrowserData } from './scripts/browser-data-lib.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 8080);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.css': 'text/css; charset=utf-8' };

async function cachedData() {
  return JSON.parse(await readFile(path.join(root, 'data', 'browser-versions.json'), 'utf8'));
}

function send(response, status, body, type = 'application/json; charset=utf-8') {
  response.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  response.end(body);
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    if (url.pathname === '/api/browser-versions') {
      const data = await refreshBrowserData(await cachedData());
      return send(response, 200, JSON.stringify(data));
    }

    const requested = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
    const filePath = path.resolve(root, `.${requested}`);
    if (filePath !== root && !filePath.startsWith(`${root}${path.sep}`)) return send(response, 403, 'Forbidden', 'text/plain; charset=utf-8');
    if ((await stat(filePath)).isDirectory()) return send(response, 404, 'Not found', 'text/plain; charset=utf-8');
    const body = await readFile(filePath);
    return send(response, 200, body, types[path.extname(filePath).toLowerCase()] || 'application/octet-stream');
  } catch (error) {
    return send(response, error.code === 'ENOENT' ? 404 : 500, error.code === 'ENOENT' ? 'Not found' : `Server error: ${error.message}`, 'text/plain; charset=utf-8');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`UA Generator: http://localhost:${port}`);
  console.log('按 Ctrl+C 停止服务');
});
