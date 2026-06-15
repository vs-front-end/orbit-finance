import { describe, expect, it } from 'vitest';

import { computeRealizedPL } from './realized';
import type { Transaction } from './types';

function tx(
  partial: Partial<Transaction> & Pick<Transaction, 'side'>,
): Transaction {
  return {
    id: Math.random().toString(),
    portfolioId: 'p1',
    ticker: 'PETR4',
    quantity: 10,
    unitPrice: 10,
    executedAt: '2026-01-01T00:00:00.000Z',
    ...partial,
  };
}

describe('computeRealizedPL', () => {
  it('returns 0 when there are no sells', () => {
    expect(computeRealizedPL([tx({ side: 'buy' })])).toBe(0);
  });

  it('computes profit on a sell above average cost', () => {
    const result = computeRealizedPL([
      tx({ side: 'buy', quantity: 10, unitPrice: 10 }),
      tx({
        side: 'sell',
        quantity: 5,
        unitPrice: 15,
        executedAt: '2026-02-01T00:00:00.000Z',
      }),
    ]);
    expect(result).toBe(25);
  });

  it('uses average cost across multiple buys', () => {
    const result = computeRealizedPL([
      tx({ side: 'buy', quantity: 10, unitPrice: 10 }),
      tx({
        side: 'buy',
        quantity: 10,
        unitPrice: 20,
        executedAt: '2026-01-15T00:00:00.000Z',
      }),
      tx({
        side: 'sell',
        quantity: 10,
        unitPrice: 20,
        executedAt: '2026-02-01T00:00:00.000Z',
      }),
    ]);
    expect(result).toBe(50);
  });

  it('handles losses', () => {
    const result = computeRealizedPL([
      tx({ side: 'buy', quantity: 10, unitPrice: 10 }),
      tx({
        side: 'sell',
        quantity: 10,
        unitPrice: 8,
        executedAt: '2026-02-01T00:00:00.000Z',
      }),
    ]);
    expect(result).toBe(-20);
  });
});
