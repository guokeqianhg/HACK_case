import test from 'node:test';
import assert from 'node:assert/strict';
import { estimatePeakRelease } from '../src/ticket.js';

const EXIT_AT = '2026-07-22T10:00:00+08:00';

test('高峰放行统计会员车辆数', () => {
  const result = estimatePeakRelease({ count: 6, exitAt: EXIT_AT });
  assert.equal(result.count, 6);
  assert.equal(result.memberCount, 2);
});
