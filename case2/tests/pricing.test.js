import test from 'node:test';
import assert from 'node:assert/strict';
import { calcBillableHours, calcParkingFee, calcStayMinutes } from '../src/pricing.js';

const EXIT_AT = '2026-07-22T10:00:00+08:00';

test('15 分钟内免费', () => {
  const fee = calcParkingFee({
    vehicleType: 'small',
    entryAt: '2026-07-22T09:50:00+08:00',
    exitAt: EXIT_AT,
  });
  assert.equal(fee.finalCents, 0);
  assert.equal(fee.billableHours, 0);
});

test('小型车按每开始 1 小时 6 元收费', () => {
  const fee = calcParkingFee({
    vehicleType: 'small',
    entryAt: '2026-07-22T08:20:00+08:00',
    exitAt: EXIT_AT,
  });
  assert.equal(calcStayMinutes('2026-07-22T08:20:00+08:00', EXIT_AT), 100);
  assert.equal(calcBillableHours(100), 2);
  assert.equal(fee.finalCents, 1200);
});

test('大型车按每开始 1 小时 10 元收费', () => {
  const fee = calcParkingFee({
    vehicleType: 'large',
    entryAt: '2026-07-22T07:05:00+08:00',
    exitAt: EXIT_AT,
  });
  assert.equal(fee.billableHours, 3);
  assert.equal(fee.finalCents, 3000);
});

test('会员按正常费用打 9 折', () => {
  const fee = calcParkingFee({
    vehicleType: 'small',
    entryAt: '2026-07-22T08:10:00+08:00',
    exitAt: EXIT_AT,
    isMember: true,
  });
  assert.equal(fee.originalCents, 1200);
  assert.equal(fee.discountCents, 120);
  assert.equal(fee.finalCents, 1080);
});

test('挂失票按一口价', () => {
  const fee = calcParkingFee({
    vehicleType: 'large',
    lostTicket: true,
  });
  assert.equal(fee.finalCents, 12000);
  assert.deepEqual(fee.rulesApplied, ['挂失票按一口价收费']);
});
