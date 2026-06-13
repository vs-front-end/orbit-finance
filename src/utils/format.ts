import type { Currency } from '@/domain';

const LOCALE = 'pt-BR';

export function formatMoney(
  value: number,
  currency: Currency,
  withSign = false,
): string {
  const formatted = new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency,
  }).format(value);
  return withSign && value > 0 ? `+${formatted}` : formatted;
}

export function formatMoneyCompact(value: number, currency: Currency): string {
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatPercent(value: number, withSign = true): string {
  const formatted = new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));
  const sign = withSign && value > 0 ? '+' : withSign && value < 0 ? '-' : '';
  return `${sign}${formatted}%`;
}

export function formatQuantity(value: number): string {
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 8 }).format(
    value,
  );
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: value < 1 ? 6 : 2,
  }).format(value);
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso));
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat(LOCALE, { timeStyle: 'medium' }).format(date);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(LOCALE, { dateStyle: 'short' }).format(
    new Date(iso),
  );
}

export function parseDecimal(value: string): number {
  const normalized = value.includes(',')
    ? value.replace(/\./g, '').replace(',', '.')
    : value;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}
