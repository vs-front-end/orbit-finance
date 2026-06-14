import { describe, expect, it } from 'vitest';

import {
  buildPositions,
  enrichPosition,
  summarizePositions,
  type Position,
} from './positions';
import type { Quote, Transaction, TransactionSide } from './types';

function tx(
  ticker: string,
  side: TransactionSide,
  quantity: number,
  unitPrice: number,
  executedAt: string,
): Transaction {
  return {
    id: `${ticker}-${side}-${executedAt}`,
    portfolioId: 'p1',
    ticker,
    side,
    quantity,
    unitPrice,
    executedAt,
  };
}

function quote(price: number, previousClose: number): Quote {
  return {
    ticker: 'X',
    price,
    previousClose,
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('buildPositions', () => {
  it('weights average price across buys', () => {
    const [position] = buildPositions([
      tx('AAPL', 'buy', 10, 100, '2026-01-01T00:00:00.000Z'),
      tx('AAPL', 'buy', 10, 200, '2026-01-02T00:00:00.000Z'),
    ]);

    expect(position).toMatchObject({
      ticker: 'AAPL',
      quantity: 20,
      avgPrice: 150,
      investedValue: 3000,
    });
  });

  it('keeps average price on sell and reduces invested value', () => {
    const [position] = buildPositions([
      tx('AAPL', 'buy', 10, 100, '2026-01-01T00:00:00.000Z'),
      tx('AAPL', 'sell', 4, 130, '2026-01-02T00:00:00.000Z'),
    ]);

    expect(position).toMatchObject({
      quantity: 6,
      avgPrice: 100,
      investedValue: 600,
    });
  });

  it('drops fully sold positions', () => {
    const positions = buildPositions([
      tx('AAPL', 'buy', 5, 100, '2026-01-01T00:00:00.000Z'),
      tx('AAPL', 'sell', 5, 120, '2026-01-02T00:00:00.000Z'),
    ]);

    expect(positions).toHaveLength(0);
  });

  it('processes transactions in chronological order regardless of input order', () => {
    const [position] = buildPositions([
      tx('AAPL', 'sell', 5, 130, '2026-01-02T00:00:00.000Z'),
      tx('AAPL', 'buy', 10, 100, '2026-01-01T00:00:00.000Z'),
    ]);

    expect(position).toMatchObject({ quantity: 5, avgPrice: 100 });
  });
});

describe('enrichPosition', () => {
  const base: Position = {
    ticker: 'AAPL',
    quantity: 10,
    avgPrice: 100,
    investedValue: 1000,
  };

  it('falls back to invested value with no quote', () => {
    expect(enrichPosition(base, null)).toMatchObject({
      marketValue: 1000,
      dailyPL: 0,
      dailyPLPercent: 0,
      netPL: 0,
      netPLPercent: 0,
    });
  });

  it('computes daily and net P/L from the quote', () => {
    const view = enrichPosition(base, quote(120, 110));

    expect(view.marketValue).toBe(1200);
    expect(view.dailyPL).toBe(100);
    expect(view.dailyPLPercent).toBeCloseTo(9.0909, 4);
    expect(view.netPL).toBe(200);
    expect(view.netPLPercent).toBe(20);
  });

  it('guards against a zero previous close', () => {
    const view = enrichPosition(base, quote(120, 0));
    expect(view.dailyPLPercent).toBe(0);
  });
});

describe('summarizePositions', () => {
  it('aggregates totals and splits gains from losses', () => {
    const winner = enrichPosition(
      { ticker: 'A', quantity: 10, avgPrice: 100, investedValue: 1000 },
      quote(120, 110),
    );
    const loser = enrichPosition(
      { ticker: 'B', quantity: 10, avgPrice: 100, investedValue: 1000 },
      quote(80, 90),
    );

    const summary = summarizePositions([winner, loser]);

    expect(summary.marketValue).toBe(2000);
    expect(summary.investedValue).toBe(2000);
    expect(summary.netPL).toBe(0);
    expect(summary.dailyPL).toBe(0);
    expect(summary.gains).toBe(200);
    expect(summary.losses).toBe(-200);
  });
});
