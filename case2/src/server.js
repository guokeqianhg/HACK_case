import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { getActiveCount, listActiveTickets, seedLot } from './lot.js';
import { checkoutTicket, estimatePeakRelease } from './ticket.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DEMO_AS_OF = process.env.DEMO_AS_OF || '2026-07-22T10:00:00+08:00';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

function sendJson(res, code, obj) {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

function isLocalRequest(req) {
  const addr = req.socket?.remoteAddress || '';
  return addr === '127.0.0.1' || addr === '::1' || addr === '::ffff:127.0.0.1';
}

function canResetForTest(req) {
  return process.env.ENABLE_TEST_RESET === '1' || process.env.NODE_ENV === 'test' || isLocalRequest(req);
}

async function readBody(req) {
  let body = '';
  req.on('data', (chunk) => (body += chunk));
  await new Promise((resolve) => req.on('end', resolve));
  if (!body) return {};
  return JSON.parse(body);
}

export function createServer() {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    if (req.method === 'GET' && url.pathname === '/api/config') {
      return sendJson(res, 200, {
        lotName: '北区停车场',
        capacity: 120,
        activeCount: getActiveCount(),
        demoAsOf: DEMO_AS_OF,
        demoAsOfLabel: '2026-07-22 10:00',
      });
    }

    if (req.method === 'GET' && url.pathname === '/api/tickets') {
      return sendJson(res, 200, listActiveTickets(DEMO_AS_OF));
    }

    if (req.method === 'POST' && url.pathname === '/api/test/reset') {
      if (!canResetForTest(req)) {
        return sendJson(res, 403, { ok: false, message: 'test reset disabled' });
      }
      seedLot();
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === 'POST' && url.pathname === '/api/checkout') {
      try {
        const payload = await readBody(req);
        const result = checkoutTicket({
          ticketId: payload.ticketId,
          exitAt: payload.exitAt || DEMO_AS_OF,
          lostTicket: payload.lostTicket === true,
        });
        return sendJson(res, result.ok ? 200 : 404, result);
      } catch {
        return sendJson(res, 400, { ok: false, code: 'BAD_JSON', message: 'bad json' });
      }
    }

    if (req.method === 'POST' && url.pathname === '/api/peak-estimate') {
      try {
        const payload = await readBody(req);
        const count = Math.max(0, Math.min(5000, Number(payload.count) || 500));
        const result = estimatePeakRelease({ count, exitAt: payload.exitAt || DEMO_AS_OF });
        return sendJson(res, 200, result);
      } catch {
        return sendJson(res, 400, { ok: false, code: 'BAD_JSON', message: 'bad json' });
      }
    }

    if (req.method === 'GET' && !url.pathname.startsWith('/api')) {
      const rel = url.pathname === '/' ? '/public/index.html' : url.pathname;
      const fp = path.normalize(path.join(ROOT, rel));
      if (!fp.startsWith(ROOT) || !existsSync(fp)) {
        res.writeHead(404);
        return res.end('Not Found');
      }
      const buf = await readFile(fp);
      res.writeHead(200, { 'content-type': MIME[path.extname(fp)] || 'application/octet-stream' });
      return res.end(buf);
    }

    res.writeHead(404);
    res.end('Not Found');
  });
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const port = process.env.PORT || 3000;
  const host = process.env.HOST || '127.0.0.1';
  createServer().listen(port, host, () => console.log(`SUT running on http://${host}:${port}`));
}
