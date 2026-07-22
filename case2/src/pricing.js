export const FREE_MINUTES = 15;
export const HOURLY_RATES = {
  small: 600,
  large: 1000,
};
export const LOST_TICKET_FLAT = {
  small: 8000,
  large: 12000,
};

function ensureDate(value, fieldName) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`bad ${fieldName}`);
  }
  return date;
}

export function normalizeVehicleType(type) {
  return type === 'large' ? 'large' : 'small';
}

export function calcStayMinutes(entryAt, exitAt) {
  const entry = ensureDate(entryAt, 'entryAt');
  const exit = ensureDate(exitAt, 'exitAt');
  return Math.max(0, Math.ceil((exit.getTime() - entry.getTime()) / 60000));
}

export function calcBillableHours(stayMinutes) {
  if (stayMinutes <= FREE_MINUTES) return 0;
  return Math.ceil((stayMinutes - FREE_MINUTES) / 60);
}

export function calcParkingFee({ vehicleType = 'small', entryAt, exitAt, isMember = false, lostTicket = false }) {
  const type = normalizeVehicleType(vehicleType);

  if (lostTicket) {
    const flat = LOST_TICKET_FLAT[type];
    return {
      vehicleType: type,
      stayMinutes: 0,
      billableHours: 0,
      originalCents: flat,
      discountCents: 0,
      finalCents: flat,
      rulesApplied: ['挂失票按一口价收费'],
    };
  }

  const stayMinutes = calcStayMinutes(entryAt, exitAt);
  const billableHours = calcBillableHours(stayMinutes);
  const originalCents = billableHours * HOURLY_RATES[type];
  const discountCents = isMember ? Math.round(originalCents * 0.1) : 0;
  const finalCents = Math.max(0, originalCents - discountCents);

  const rulesApplied = [
    `前 ${FREE_MINUTES} 分钟免费`,
    type === 'large' ? '大型车按每小时 10 元计费' : '小型车按每小时 6 元计费',
  ];
  if (isMember && originalCents > 0) {
    rulesApplied.push('会员按正常费用打 9 折');
  }

  return {
    vehicleType: type,
    stayMinutes,
    billableHours,
    originalCents,
    discountCents,
    finalCents,
    rulesApplied,
  };
}

export function estimateBatch(tickets = [], defaultExitAt) {
  const startedAt = Date.now();
  let totalCents = 0;
  let memberCount = 0;

  for (const ticket of tickets) {
    if (ticket.isMember) {
      memberCount += 1;
    }

    const fee = calcParkingFee({
      ...ticket,
      exitAt: ticket.exitAt || defaultExitAt,
    });
    totalCents += fee.finalCents;
  }

  return {
    ok: true,
    count: tickets.length,
    memberCount,
    totalCents,
    avgCents: tickets.length === 0 ? 0 : Math.round(totalCents / tickets.length),
    durationMs: Date.now() - startedAt,
  };
}

