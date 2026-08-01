export function toTradeDateIso(date: Date, time: string): string {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);

  return new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      hours,
      minutes,
    ),
  ).toISOString();
}

export function tradeDateOf(iso: string): Date {
  const date = new Date(iso);

  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function tradeTimeOf(iso: string): string {
  const date = new Date(iso);
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
}
