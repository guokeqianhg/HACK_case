import { calcParkingFee } from './pricing.js';

export const DEFAULT_TICKETS = [
  { ticketId: 'T1001', plateNo: '粤A1001', vehicleType: 'small', entryAt: '2026-07-22T08:20:00+08:00', isMember: false },
  { ticketId: 'T1002', plateNo: '京B2002', vehicleType: 'small', entryAt: '2026-07-22T08:10:00+08:00', isMember: true },
  { ticketId: 'T1003', plateNo: '沪C3003', vehicleType: 'large', entryAt: '2026-07-22T07:05:00+08:00', isMember: false },
  { ticketId: 'T1004', plateNo: '浙D4004', vehicleType: 'small', entryAt: '2026-07-22T09:50:00+08:00', isMember: false },
];

const activeTickets = new Map();

function cloneTicket(ticket) {
  return { ...ticket };
}

export function resetLot() {
  activeTickets.clear();
}

export function seedLot(seed = DEFAULT_TICKETS) {
  resetLot();
  for (const ticket of seed) {
    activeTickets.set(ticket.ticketId, cloneTicket(ticket));
  }
}

export function getActiveCount() {
  return activeTickets.size;
}

export function getTicket(ticketId) {
  const ticket = activeTickets.get(ticketId);
  return ticket ? cloneTicket(ticket) : null;
}

export function closeTicket(ticketId) {
  const ticket = getTicket(ticketId);
  if (!ticket) return null;
  activeTickets.delete(ticketId);
  return ticket;
}

export function listActiveTickets(asOf) {
  return Array.from(activeTickets.values())
    .sort((a, b) => a.entryAt.localeCompare(b.entryAt))
    .map((ticket) => {
      const fee = calcParkingFee({
        vehicleType: ticket.vehicleType,
        entryAt: ticket.entryAt,
        exitAt: asOf,
        isMember: ticket.isMember,
      });
      return {
        ...cloneTicket(ticket),
        entryAtLabel: ticket.entryAt.slice(11, 16),
        stayMinutes: fee.stayMinutes,
        previewFeeCents: fee.finalCents,
      };
    });
}

seedLot();
