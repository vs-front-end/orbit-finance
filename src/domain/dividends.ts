import type { AssetClass, Transaction } from './types';

export type DividendEvent = {
  ticker: string;
  exDate: string;
  amount: number;
};

export type ReceivedDividend = {
  ticker: string;
  exDate: string;
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

export function withholdingRate(
  assetClass: AssetClass | null,
  exDate: string,
): number {
  if (!assetClass) return 0;

  let rate = 0;
  for (const bracket of WITHHOLDING[assetClass]) {
    if (bracket.from <= exDate) rate = bracket.rate;
  }
  return rate;
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
      const gross = quantity * event.amount;
      const tax = gross * withholdingRate(classOf(event.ticker), event.exDate);
      return {
        ticker: event.ticker,
        exDate: event.exDate,
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

function median(values: number[]): number {
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

export function estimateMonthlyAmountPerShare(
  tickerEvents: DividendEvent[],
  today: string,
): number {
  const ym = today.slice(0, 7);
  const month = today.slice(5, 7);
  const sorted = [...tickerEvents].sort((a, b) =>
    b.exDate.localeCompare(a.exDate),
  );

  if (sorted.some((event) => event.exDate.slice(0, 7) === ym)) return 0;

  const yearAgo = isoDaysBefore(today, 365);
  const trailingYear = sorted.filter((event) => event.exDate >= yearAgo);
  const distinctMonths = new Set(
    trailingYear.map((event) => event.exDate.slice(0, 7)),
  );

  if (distinctMonths.size >= 6) {
    return median(
      sorted.slice(0, RECENT_PAYMENTS).map((event) => event.amount),
    );
  }

  const threeYearsAgo = isoDaysBefore(today, 365 * 3);
  const sameMonth = sorted.filter(
    (event) =>
      event.exDate >= threeYearsAgo && event.exDate.slice(5, 7) === month,
  );
  if (sameMonth.length > 0) {
    return median(sameMonth.map((event) => event.amount));
  }

  return 0;
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
