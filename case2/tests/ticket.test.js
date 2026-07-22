import test from 'node:test';
import assert from 'node:assert/strict';
import { getActiveCount, seedLot } from '../src/lot.js';
import { checkoutTicket, estimatePeakRelease } from '../src/ticket.js';

const EXIT_AT = '2026-07-22T10:00:00+08:00';

test.beforeEach(() => seedLot());

test('出场成功返回金额并移除车辆', () => {
  const result = checkoutTicket({ ticketId: 'T1001', exitAt: EXIT_AT });
  assert.equal(result.ok, true);
  assert.equal(result.finalCents, 1200);
  assert.equal(result.plateNo, '粤A1001');
  assert.equal(getActiveCount(), 3);
});

test('不存在票据时返回 NOT_FOUND', () => {
  const result = checkoutTicket({ ticketId: 'T9999', exitAt: EXIT_AT });
  assert.equal(result.ok, false);
  assert.equal(result.code, 'NOT_FOUND');
});

test('高峰估算返回 count 和平均价', () => {
  const result = estimatePeakRelease({ count: 50, exitAt: EXIT_AT });
  assert.equal(result.ok, true);
  assert.equal(result.count, 50);
  assert.ok(result.totalCents > 0);
  assert.ok(result.avgCents > 0);
});
