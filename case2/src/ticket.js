import { estimateBatch } from './pricing.js';
import { calcParkingFee } from './pricing.js';
import { closeTicket, getTicket } from './lot.js';

export function checkoutTicket({ ticketId, exitAt, lostTicket = false } = {}) {
  const ticket = getTicket(ticketId);
  if (!ticket) {
    return { ok: false, code: 'NOT_FOUND', message: '票据不存在或已结算' };
  }

  const fee = calcParkingFee({
    vehicleType: ticket.vehicleType,
    entryAt: ticket.entryAt,
    exitAt,
    isMember: ticket.isMember,
    lostTicket,
  });

  closeTicket(ticketId);

  return {
    ok: true,
    ticketId,
    plateNo: ticket.plateNo,
    vehicleType: ticket.vehicleType,
    isMember: ticket.isMember,
    stayMinutes: fee.stayMinutes,
    billableHours: fee.billableHours,
    finalCents: fee.finalCents,
    rulesApplied: fee.rulesApplied,
    exitAt,
    lostTicket,
  };
}

export function buildPeakTickets({ count = 500, exitAt }) {
  const exitMs = new Date(exitAt).getTime();
  return Array.from({ length: count }, (_, index) => {
    const stayMinutes = 20 + (index % 180);
    return {
      ticketId: `P${String(index + 1).padStart(4, '0')}`,
      plateNo: `测试${String(index + 1).padStart(4, '0')}`,
      vehicleType: index % 5 === 0 ? 'large' : 'small',
      isMember: index % 3 === 0,
      entryAt: new Date(exitMs - stayMinutes * 60000).toISOString(),
      exitAt,
    };
  });
}

export function estimatePeakRelease({ count = 500, exitAt }) {
  return estimateBatch(buildPeakTickets({ count, exitAt }), exitAt);
}
