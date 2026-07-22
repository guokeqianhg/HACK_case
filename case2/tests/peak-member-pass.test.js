import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPeakTickets } from '../src/ticket.js';

const EXIT_AT = '2026-07-22T10:00:00+08:00';

test('大型车在高峰放行队列中自动标记为会员快速通行', () => {
  const tickets = buildPeakTickets({ count: 6, exitAt: EXIT_AT });
  assert.equal(tickets[5].vehicleType, 'large');
  assert.equal(tickets[5].isMember, true);
});
