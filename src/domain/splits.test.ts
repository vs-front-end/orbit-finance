import { describe, expect, it } from 'vitest';
import { adjustForSplits } from './splits';
import type { Transaction } from './types';

const tx = (
  id: string,
  ticker: string,
  executedAt: string,
  quantity: number,
  unitPrice: number,
): Transaction => ({
  id,
  portfolioId: 'p1',
  ticker,
  side: 'buy',
  quantity,
  unitPrice,
  executedAt,
});

describe('adjustForSplits', () => {
  it('does nothing without splits', () => {
    const transactions = [tx('1', 'AAPL', '2019-01-10T12:00:00Z', 10, 40)];

    expect(adjustForSplits(transactions, [])).toEqual(transactions);
  });

  it('scales quantity up and price down for trades before the split', () => {
    const [result] = adjustForSplits(
      [tx('1', 'AAPL', '2019-01-10T12:00:00Z', 10, 200)],
      [{ ticker: 'AAPL', date: '2020-08-31', ratio: 4 }],
    );

    expect(result.quantity).toBe(40);
    expect(result.unitPrice).toBe(50);
  });

  it('keeps the total cost of the position unchanged', () => {
    const before = tx('1', 'AAPL', '2019-01-10T12:00:00Z', 10, 200);
    const [after] = adjustForSplits(
      [before],
      [{ ticker: 'AAPL', date: '2020-08-31', ratio: 4 }],
    );

    expect(after.quantity * after.unitPrice).toBe(
      before.quantity * before.unitPrice,
    );
  });

  it('leaves trades after the split untouched', () => {
    const [result] = adjustForSplits(
      [tx('1', 'AAPL', '2021-01-10T12:00:00Z', 10, 130)],
      [{ ticker: 'AAPL', date: '2020-08-31', ratio: 4 }],
    );

    expect(result.quantity).toBe(10);
    expect(result.unitPrice).toBe(130);
  });

  it('compounds successive splits', () => {
    const [result] = adjustForSplits(
      [tx('1', 'AAPL', '2013-01-10T12:00:00Z', 1, 500)],
      [
        { ticker: 'AAPL', date: '2014-06-09', ratio: 7 },
        { ticker: 'AAPL', date: '2020-08-31', ratio: 4 },
      ],
    );

    expect(result.quantity).toBe(28);
    expect(result.unitPrice).toBeCloseTo(500 / 28, 10);
  });

  it('only touches the ticker that split', () => {
    const [aapl, petr] = adjustForSplits(
      [
        tx('1', 'AAPL', '2019-01-10T12:00:00Z', 10, 200),
        tx('2', 'PETR4', '2019-01-10T12:00:00Z', 10, 20),
      ],
      [{ ticker: 'AAPL', date: '2020-08-31', ratio: 4 }],
    );

    expect(aapl.quantity).toBe(40);
    expect(petr.quantity).toBe(10);
  });
});
