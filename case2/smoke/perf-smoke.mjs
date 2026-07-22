import { createServer } from '../src/server.js';

const server = createServer();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const base = `http://127.0.0.1:${port}`;

let failures = 0;
function check(name, cond) {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`);
  if (!cond) failures += 1;
}

const cases = [300, 1000, 3000];
for (const count of cases) {
  const data = await (await fetch(`${base}/api/peak-estimate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ count, exitAt: '2026-07-22T10:00:00+08:00' }),
  })).json();

  check(`${count} 辆车高峰估算成功`, data.ok === true && data.count === count);
  check(`${count} 辆车返回耗时字段`, Number.isInteger(data.durationMs) && data.durationMs >= 0);
  console.log(`INFO  count=${count} total=${data.totalCents} avg=${data.avgCents} duration=${data.durationMs}ms`);
}

server.close();
server.closeAllConnections?.();
console.log(failures === 0 ? '\n✅ PERF SMOKE PASS' : `\n❌ ${failures} PERF CHECK FAILED`);
process.exitCode = failures === 0 ? 0 : 1;
