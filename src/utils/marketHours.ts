const MARKET_OPEN_HOUR = 10;
const MARKET_CLOSE_HOUR = 18;

export function isMarketOpen(date = new Date()): boolean {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'short',
    hour: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(date);

  const weekday = parts.find((part) => part.type === 'weekday')?.value;
  const hour = Number(parts.find((part) => part.type === 'hour')?.value);

  if (weekday === 'Sat' || weekday === 'Sun') return false;

  return hour >= MARKET_OPEN_HOUR && hour < MARKET_CLOSE_HOUR;
}
