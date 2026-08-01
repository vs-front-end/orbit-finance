import type { Quote, Transaction } from './types';

export type Position = {
  ticker: string;
  quantity: number;
  avgPrice: number;
  investedValue: number;
};

export type PositionView = Position & {
  quote: Quote | null;
  hasQuote: boolean;
  marketValue: number;
  dailyPL: number;
  dailyPLPercent: number;
  netPL: number;
  netPLPercent: number;
};

export type PLSummary = {
  marketValue: number;
  investedValue: number;
  dailyPL: number;
  dailyPLPercent: number;
  netPL: number;
  netPLPercent: number;
  gains: number;
  losses: number;
  missingQuotes: number;
};

export type PriceOf = (transaction: Transaction) => number;

const nativePrice: PriceOf = (transaction) => transaction.unitPrice;

export function buildPositions(
  transactions: Transaction[],
  priceOf: PriceOf = nativePrice,
): Position[] {
  const sorted = [...transactions].sort((a, b) =>
    a.executedAt.localeCompare(b.executedAt),
  );
  const byTicker = new Map<string, Position>();

  for (const tx of sorted) {
    const current = byTicker.get(tx.ticker) ?? {
      ticker: tx.ticker,
      quantity: 0,
      avgPrice: 0,
      investedValue: 0,
    };

    if (tx.side === 'buy') {
      const unitPrice = priceOf(tx);
      const totalCost =
        current.quantity * current.avgPrice + tx.quantity * unitPrice;

      current.quantity += tx.quantity;
      current.avgPrice = totalCost / current.quantity;
    } else {
      current.quantity = Math.max(0, current.quantity - tx.quantity);
    }

    current.investedValue = current.quantity * current.avgPrice;
    byTicker.set(tx.ticker, current);
  }

  return [...byTicker.values()].filter((position) => position.quantity > 1e-8);
}

export function enrichPosition(
  position: Position,
  quote: Quote | null,
): PositionView {
  if (!quote) {
    return {
      ...position,
      quote: null,
      hasQuote: false,
      marketValue: position.investedValue,
      dailyPL: 0,
      dailyPLPercent: 0,
      netPL: 0,
      netPLPercent: 0,
    };
  }

  const marketValue = position.quantity * quote.price;
  const dailyPL = position.quantity * (quote.price - quote.previousClose);
  const previousValue = position.quantity * quote.previousClose;
  const netPL = marketValue - position.investedValue;

  return {
    ...position,
    quote,
    hasQuote: true,
    marketValue,
    dailyPL,
    dailyPLPercent: previousValue > 0 ? (dailyPL / previousValue) * 100 : 0,
    netPL,
    netPLPercent:
      position.investedValue > 0 ? (netPL / position.investedValue) * 100 : 0,
  };
}

export function summarizePositions(views: PositionView[]): PLSummary {
  const marketValue = sum(views.map((v) => v.marketValue));
  const investedValue = sum(views.map((v) => v.investedValue));
  const dailyPL = sum(views.map((v) => v.dailyPL));
  const netPL = marketValue - investedValue;
  const previousValue = marketValue - dailyPL;

  return {
    marketValue,
    investedValue,
    dailyPL,
    dailyPLPercent: previousValue > 0 ? (dailyPL / previousValue) * 100 : 0,
    netPL,
    netPLPercent: investedValue > 0 ? (netPL / investedValue) * 100 : 0,
    gains: sum(views.map((v) => v.netPL).filter((value) => value > 0)),
    losses: sum(views.map((v) => v.netPL).filter((value) => value < 0)),
    missingQuotes: views.filter((view) => !view.hasQuote).length,
  };
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
