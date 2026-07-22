import test from 'node:test';
import assert from 'node:assert/strict';
import { formatMinutes, formatMoney, summarizeBatch } from '../src/parking-client.js';

test('formatMoney 按元显示两位小数', () => {
  assert.equal(formatMoney(1200), '¥12.00');
});

test('formatMinutes 支持分钟和小时混合展示', () => {
  assert.equal(formatMinutes(15), '15分钟');
  assert.equal(formatMinutes(100), '1小时40分钟');
  assert.equal(formatMinutes(120), '2小时');
});

test('summarizeBatch 输出适合页面展示的摘要', () => {
  const text = summarizeBatch({
    count: 200,
    totalCents: 240000,
    avgCents: 1200,
    durationMs: 8,
  });
  assert.match(text, /200 辆车已完成估算/);
  assert.match(text, /总费用 ¥2400.00/);
  assert.match(text, /接口耗时 8ms/);
});
