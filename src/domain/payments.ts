import { z } from 'zod';

import { median } from './dividends';

export const dividendPaymentSchema = z.object({
  ticker: z.string(),
  dataCom: z.string(),
  paymentDate: z.string(),
  rate: z.number(),
  label: z.string(),
});

export type DividendPayment = z.infer<typeof dividendPaymentSchema>;

export type WithPayment<T> = T & {
  paymentDate: string;
  estimatedPayment: boolean;
  paymentLabel: string;
};

const DAY_MS = 86_400_000;
const DEFAULT_LAG_DAYS = 10;
const MATCH_WINDOW_DAYS = 5;

function toTime(date: string): number {
  return Date.parse(`${date}T00:00:00Z`);
}

function addDays(date: string, days: number): string {
  return new Date(toTime(date) + days * DAY_MS).toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string): number {
  return Math.round((toTime(to) - toTime(from)) / DAY_MS);
}

function findPayment(
  payments: DividendPayment[],
  exDate: string,
): DividendPayment | null {
  let closest: DividendPayment | null = null;
  let smallestGap = Number.POSITIVE_INFINITY;

  for (const payment of payments) {
    const gap = daysBetween(payment.dataCom, exDate);
    if (gap < 0 || gap > MATCH_WINDOW_DAYS) continue;

    if (gap < smallestGap) {
      closest = payment;
      smallestGap = gap;
    }
  }

  return closest;
}

function estimateLagFromExDate(payments: DividendPayment[]): number {
  if (payments.length === 0) return DEFAULT_LAG_DAYS;

  const lags = payments.map((payment) =>
    daysBetween(payment.dataCom, payment.paymentDate),
  );

  return Math.max(1, median(lags) - 1);
}

export function attachPaymentDates<
  T extends { ticker: string; exDate: string },
>(items: T[], payments: DividendPayment[]): WithPayment<T>[] {
  const byTicker = new Map<string, DividendPayment[]>();

  for (const payment of payments) {
    const current = byTicker.get(payment.ticker) ?? [];
    current.push(payment);
    byTicker.set(payment.ticker, current);
  }

  const lagByTicker = new Map<string, number>();
  for (const [ticker, tickerPayments] of byTicker) {
    lagByTicker.set(ticker, estimateLagFromExDate(tickerPayments));
  }

  return items.map((item) => {
    const matched = findPayment(byTicker.get(item.ticker) ?? [], item.exDate);

    if (matched) {
      return {
        ...item,
        paymentDate: matched.paymentDate,
        estimatedPayment: false,
        paymentLabel: matched.label,
      };
    }

    const lag = lagByTicker.get(item.ticker) ?? DEFAULT_LAG_DAYS;

    // Sem o registro da B3 não dá para saber se foi dividendo ou JCP, e chutar
    // mudaria a alíquota. Fica sem rótulo.
    return {
      ...item,
      paymentDate: addDays(item.exDate, lag),
      estimatedPayment: true,
      paymentLabel: '',
    };
  });
}
