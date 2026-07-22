import test from 'node:test';
import assert from 'node:assert/strict';
import { closeTicket, getActiveCount, getTicket, listActiveTickets, seedLot } from '../src/lot.js';

const AS_OF = '2026-07-22T10:00:00+08:00';

test.beforeEach(() => seedLot());

test('初始场内有 4 辆待出场车辆', () => {
  assert.equal(getActiveCount(), 4);
  assert.equal(listActiveTickets(AS_OF).length, 4);
});

test('关闭票据后，场内车辆数减少', () => {
  const closed = closeTicket('T1001');
  assert.equal(closed?.plateNo, '粤A1001');
  assert.equal(getActiveCount(), 3);
});

test('可按 ticketId 查询车辆', () => {
  const ticket = getTicket('T1002');
  assert.equal(ticket?.isMember, true);
  assert.equal(ticket?.plateNo, '京B2002');
});

test('列表中可看到预计费用', () => {
  const list = listActiveTickets(AS_OF);
  const target = list.find((item) => item.ticketId === 'T1004');
  assert.equal(target?.previewFeeCents, 0);
  assert.equal(target?.stayMinutes, 10);
});
