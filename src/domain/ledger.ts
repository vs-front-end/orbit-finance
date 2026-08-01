import { z } from 'zod';

import type { ReceivedDividend } from './dividends';
import { currencySchema } from './types';

export const storedDividendSchema = z.object({
  id: z.string(),
  portfolioId: z.string(),
  ticker: z.string(),
  exDate: z.string(),
  paymentDate: z.string(),
  label: z.string(),
  amountPerShare: z.number(),
  quantity: z.number(),
  gross: z.number(),
  tax: z.number(),
  received: z.number(),
  currency: currencySchema,
  estimatedPayment: z.boolean().default(false),
  editedManually: z.boolean().default(false),
});

export type StoredDividend = z.infer<typeof storedDividendSchema>;

export type LedgerDividend = ReceivedDividend & {
  id: string;
  stored: boolean;
  editedManually: boolean;
};

const UNVERIFIED_GRACE_DAYS = 45;
const DAY_MS = 86_400_000;

export function dividendId(
  portfolioId: string,
  ticker: string,
  exDate: string,
): string {
  return `${portfolioId}-${ticker}-${exDate}`;
}

function daysSince(date: string, today: string): number {
  return Math.round(
    (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) /
      DAY_MS,
  );
}

export function isFreezable(
  dividend: ReceivedDividend,
  today: string,
): boolean {
  if (!dividend.estimatedPayment) return dividend.paymentDate <= today;

  return daysSince(dividend.exDate, today) >= UNVERIFIED_GRACE_DAYS;
}

function toLedger(stored: StoredDividend): LedgerDividend {
  return {
    id: stored.id,
    ticker: stored.ticker,
    exDate: stored.exDate,
    paymentDate: stored.paymentDate,
    estimatedPayment: stored.estimatedPayment,
    label: stored.label,
    amountPerShare: stored.amountPerShare,
    quantity: stored.quantity,
    gross: stored.gross,
    tax: stored.tax,
    received: stored.received,
    stored: true,
    editedManually: stored.editedManually,
  };
}

export function mergeLedger(
  portfolioId: string,
  computed: ReceivedDividend[],
  stored: StoredDividend[],
): LedgerDividend[] {
  const byId = new Map<string, LedgerDividend>();

  for (const entry of stored) {
    byId.set(entry.id, toLedger(entry));
  }

  for (const dividend of computed) {
    const id = dividendId(portfolioId, dividend.ticker, dividend.exDate);
    if (byId.has(id)) continue;

    byId.set(id, { ...dividend, id, stored: false, editedManually: false });
  }

  return [...byId.values()].sort((a, b) =>
    b.paymentDate.localeCompare(a.paymentDate),
  );
}

export function splitByPayment<T extends { paymentDate: string }>(
  entries: T[],
  today: string,
): { paid: T[]; pending: T[] } {
  return {
    paid: entries.filter((entry) => entry.paymentDate <= today),
    pending: entries.filter((entry) => entry.paymentDate > today),
  };
}

export function pendingFreeze(
  portfolioId: string,
  computed: ReceivedDividend[],
  stored: StoredDividend[],
  today: string,
): ReceivedDividend[] {
  const known = new Set(stored.map((entry) => entry.id));

  return computed.filter(
    (dividend) =>
      !known.has(dividendId(portfolioId, dividend.ticker, dividend.exDate)) &&
      isFreezable(dividend, today),
  );
}
