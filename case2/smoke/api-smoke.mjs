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

await fetch(`${base}/api/test/reset`, { method: 'POST' });

const config = await (await fetch(`${base}/api/config`)).json();
check('配置接口返回演示结算时间', config.demoAsOf === '2026-07-22T10:00:00+08:00');

const tickets = await (await fetch(`${base}/api/tickets`)).json();
check('初始有 4 辆待出场车辆', tickets.length === 4);
check('T1001 预计费用为 ¥12.00', tickets.find((item) => item.ticketId === 'T1001')?.previewFeeCents === 1200);

const checkout = await (await fetch(`${base}/api/checkout`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ ticketId: 'T1001', exitAt: config.demoAsOf }),
})).json();
check('T1001 出场成功', checkout.ok === true && checkout.finalCents === 1200);

const ticketsAfter = await (await fetch(`${base}/api/tickets`)).json();
check('出场后剩余 3 辆车', ticketsAfter.length === 3);

const missing = await (await fetch(`${base}/api/checkout`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ ticketId: 'T9999', exitAt: config.demoAsOf }),
})).json();
check('不存在票据被拒绝', missing.ok === false && missing.code === 'NOT_FOUND');

const peak = await (await fetch(`${base}/api/peak-estimate`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ count: 200, exitAt: config.demoAsOf }),
})).json();
check('高峰估算返回 200 辆车', peak.ok === true && peak.count === 200);
check('高峰估算返回总费用和均价', peak.totalCents > 0 && peak.avgCents > 0);

server.close();
server.closeAllConnections?.();
console.log(failures === 0 ? '\n✅ ALL SMOKE PASS' : `\n❌ ${failures} SMOKE FAILED`);
process.exitCode = failures === 0 ? 0 : 1;
