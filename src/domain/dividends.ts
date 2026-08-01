import type { AssetClass, Transaction } from './types';

export type DividendEvent = {
  ticker: string;
  exDate: string;
  amount: number;
  paymentDate?: string;
  estimatedPayment?: boolean;
  paymentLabel?: string;
};

export type ReceivedDividend = {
  ticker: string;
  exDate: string;
  paymentDate: string;
  estimatedPayment: boolean;
  label: string;
  amountPerShare: number;
  quantity: number;
  gross: number;
  tax: number;
  received: number;
};

type WithholdingBracket = { from: string; rate: number };

const WITHHOLDING: Record<AssetClass, WithholdingBracket[]> = {
  'stock-us': [{ from: '1970-01-01', rate: 0.3 }],
  fii: [{ from: '1970-01-01', rate: 0 }],
  'stock-br': [{ from: '1970-01-01', rate: 0 }],
  crypto: [{ from: '1970-01-01', rate: 0 }],
};

const JCP: WithholdingBracket[] = [
  { from: '1970-01-01', rate: 0.15 },
  { from: '2026-01-01', rate: 0.175 },
];

function isJcp(label: string | undefined): boolean {
  return (label ?? '').toUpperCase().includes('JRS CAP PROPRIO');
}

function rateAt(brackets: WithholdingBracket[], date: string): number {
  let rate = 0;

  for (const bracket of brackets) {
    if (bracket.from <= date) rate = bracket.rate;
  }

  return rate;
}

export function withholdingRate(
  assetClass: AssetClass | null,
  paidAt: string,
  label?: string,
): number {
  if (isJcp(label)) return rateAt(JCP, paidAt);
  if (!assetClass) return 0;

  return rateAt(WITHHOLDING[assetClass], paidAt);
}

function quantityOnExDate(
  transactions: Transaction[],
  ticker: string,
  exDate: string,
): number {
  let quantity = 0;

  for (const tx of transactions) {
    if (tx.ticker !== ticker) continue;
    if (tx.executedAt.slice(0, 10) >= exDate) continue;
    quantity += tx.side === 'buy' ? tx.quantity : -tx.quantity;
  }

  return Math.max(0, quantity);
}

export function computeReceivedDividends(
  transactions: Transaction[],
  events: DividendEvent[],
  classOf: (ticker: string) => AssetClass | null,
): ReceivedDividend[] {
  return events
    .map((event) => {
      const quantity = quantityOnExDate(
        transactions,
        event.ticker,
        event.exDate,
      );

      const paidAt = event.paymentDate ?? event.exDate;
      const gross = quantity * event.amount;
      const tax =
        gross *
        withholdingRate(classOf(event.ticker), paidAt, event.paymentLabel);

      return {
        ticker: event.ticker,
        exDate: event.exDate,
        paymentDate: event.paymentDate ?? event.exDate,
        estimatedPayment: event.estimatedPayment ?? true,
        label: event.paymentLabel ?? '',
        amountPerShare: event.amount,
        quantity,
        gross,
        tax,
        received: gross - tax,
      };
    })
    .filter((dividend) => dividend.gross > 0)
    .sort((a, b) => b.exDate.localeCompare(a.exDate));
}

export function totalReceived(dividends: ReceivedDividend[]): number {
  return dividends.reduce((sum, dividend) => sum + dividend.received, 0);
}

export function totalTax(dividends: ReceivedDividend[]): number {
  return dividends.reduce((sum, dividend) => sum + dividend.tax, 0);
}

const RECENT_PAYMENTS = 6;

export function median(values: number[]): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function isoDaysBefore(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);

  return d.toISOString().slice(0, 10);
}

function paidAt(event: DividendEvent): string {
  return event.paymentDate ?? event.exDate;
}

export function estimateMonthlyAmountPerShare(
  tickerEvents: DividendEvent[],
  today: string,
): number {
  const ym = today.slice(0, 7);
  const month = today.slice(5, 7);
  const sorted = [...tickerEvents].sort((a, b) =>
    paidAt(b).localeCompare(paidAt(a)),
  );

  if (sorted.some((event) => paidAt(event).slice(0, 7) === ym)) return 0;

  const yearAgo = isoDaysBefore(today, 365);
  const trailingYear = sorted.filter((event) => paidAt(event) >= yearAgo);
  const distinctMonths = new Set(
    trailingYear.map((event) => paidAt(event).slice(0, 7)),
  );

  if (distinctMonths.size >= 6) {
    return median(
      sorted.slice(0, RECENT_PAYMENTS).map((event) => event.amount),
    );
  }

  const threeYearsAgo = isoDaysBefore(today, 365 * 3);
  const sameMonth = sorted.filter(
    (event) =>
      paidAt(event) >= threeYearsAgo && paidAt(event).slice(5, 7) === month,
  );

  return sameMonth.length > 0
    ? median(sameMonth.map((event) => event.amount))
    : 0;
}

export type PendingDividend = {
  ticker: string;
  amountPerShare: number;
  quantity: number;
  gross: number;
  tax: number;
  pending: number;
};

export function projectPendingDividends(
  events: DividendEvent[],
  positions: { ticker: string; quantity: number }[],
  classOf: (ticker: string) => AssetClass | null,
  today: string,
): PendingDividend[] {
  return positions
    .map((position) => {
      const tickerEvents = events.filter(
        (event) => event.ticker === position.ticker,
      );

      const amountPerShare = estimateMonthlyAmountPerShare(tickerEvents, today);
      const gross = amountPerShare * position.quantity;
      const tax = gross * withholdingRate(classOf(position.ticker), today);

      return {
        ticker: position.ticker,
        amountPerShare,
        quantity: position.quantity,
        gross,
        tax,
        pending: gross - tax,
      };
    })
    .filter((dividend) => dividend.gross > 0);
}

export function totalPending(dividends: PendingDividend[]): number {
  return dividends.reduce((sum, dividend) => sum + dividend.pending, 0);
}

export type FxPoint = { date: string; rate: number };

export function makeFxLookup(series: FxPoint[]): (date: string) => number {
  const sorted = [...series].sort((a, b) => a.date.localeCompare(b.date));

  return (date) => {
    let rate = sorted[0]?.rate ?? 0;

    for (const point of sorted) {
      if (point.date > date) break;
      rate = point.rate;
    }

    return rate;
  };
}

export function totalsInBRL(
  dividends: ReceivedDividend[],
  brlRateOf: (exDate: string) => number,
): { receivedBRL: number; taxBRL: number } {
  return dividends.reduce(
    (acc, dividend) => {
      const rate = brlRateOf(dividend.exDate);

      return {
        receivedBRL: acc.receivedBRL + dividend.received * rate,
        taxBRL: acc.taxBRL + dividend.tax * rate,
      };
    },
    { receivedBRL: 0, taxBRL: 0 },
  );
}

export type MonthlyDividend = { month: string; total: number };

type PaidSlice = { paymentDate: string; received: number };

function shiftMonth(ym: string, delta: number): string {
  const date = new Date(`${ym}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + delta);
  return date.toISOString().slice(0, 7);
}

function lastCompleteMonth(today: string): string {
  return shiftMonth(today.slice(0, 7), -1);
}

function monthRange(from: string, to: string): string[] {
  if (from > to) return [];

  const months: string[] = [];
  for (let cursor = from; cursor <= to; cursor = shiftMonth(cursor, 1)) {
    months.push(cursor);
  }
  return months;
}

function totalsByMonth(dividends: PaidSlice[]): Map<string, number> {
  const byMonth = new Map<string, number>();

  for (const dividend of dividends) {
    const month = dividend.paymentDate.slice(0, 7);
    byMonth.set(month, (byMonth.get(month) ?? 0) + dividend.received);
  }

  return byMonth;
}

export function averageMonthlyReceived(
  dividends: PaidSlice[],
  today: string,
): number {
  if (dividends.length === 0) return 0;

  const end = lastCompleteMonth(today);
  const first = [...dividends]
    .map((dividend) => dividend.paymentDate.slice(0, 7))
    .sort()[0];

  if (!first || first > end) return 0;

  const months = monthRange(first, end);
  const total = dividends
    .filter((dividend) => dividend.paymentDate.slice(0, 7) <= end)
    .reduce((sum, dividend) => sum + dividend.received, 0);

  return months.length > 0 ? total / months.length : 0;
}

export function monthlyReceivedSeries(
  dividends: PaidSlice[],
  today: string,
  window = 12,
): MonthlyDividend[] {
  const end = lastCompleteMonth(today);
  const byMonth = totalsByMonth(dividends);
  const start = shiftMonth(end, -(window - 1));

  return monthRange(start, end).map((month) => ({
    month,
    total: byMonth.get(month) ?? 0,
  }));
}

export type DividendPayer = { ticker: string; received: number };

export function topDividendPayers(
  dividends: Array<PaidSlice & { ticker: string }>,
  limit = 5,
): DividendPayer[] {
  const byTicker = new Map<string, number>();

  for (const dividend of dividends) {
    byTicker.set(
      dividend.ticker,
      (byTicker.get(dividend.ticker) ?? 0) + dividend.received,
    );
  }

  return [...byTicker.entries()]
    .map(([ticker, received]) => ({ ticker, received }))
    .sort((a, b) => b.received - a.received)
    .slice(0, limit);
}
