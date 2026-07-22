export function formatMoney(cents) {
  return `¥${(cents / 100).toFixed(2)}`;
}

export function formatMinutes(totalMinutes) {
  const minutes = Math.max(0, totalMinutes || 0);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}分钟`;
  if (rest === 0) return `${hours}小时`;
  return `${hours}小时${rest}分钟`;
}

export function summarizeBatch({ count, totalCents, avgCents, durationMs }) {
  return `${count} 辆车已完成估算，总费用 ${formatMoney(totalCents)}，均价 ${formatMoney(avgCents)}，接口耗时 ${durationMs}ms。`;
}
