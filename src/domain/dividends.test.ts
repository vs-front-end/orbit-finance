import { describe, expect, it } from 'vitest';

import {
  computeReceivedDividends,
  estimateMonthlyAmountPerShare,
  makeFxLookup,
  projectPendingDividends,
  totalReceived,
  totalsInBRL,
  withholdingRate,
  type DividendEvent,
} from './dividends';
import type { AssetClass, Transaction, TransactionSide } from './types';

function tx(
  ticker: string,
  side: TransactionSide,
  quantity: number,
  executedAt: string,
): Transaction {
  return {
    id: `${ticker}-${side}-${executedAt}`,
    portfolioId: 'p1',
    ticker,
    side,
    quantity,
    unitPrice: 10,
    executedAt,
  };
}

const events: DividendEvent[] = [
  { ticker: 'MXRF11', exDate: '2026-03-01', amount: 0.1 },
  { ticker: 'MXRF11', exDate: '2026-04-01', amount: 0.1 },
];

const asFii = () => 'fii' as AssetClass;
const asUs = () => 'stock-us' as AssetClass;

describe('withholdingRate', () => {
  it('charges 30% only on US stocks', () => {
    expect(withholdingRate('stock-us', '2026-01-01')).toBe(0.3);
    expect(withholdingRate('fii', '2026-01-01')).toBe(0);
    expect(withholdingRate('stock-br', '2026-01-01')).toBe(0);
    expect(withholdingRate('crypto', '2026-01-01')).toBe(0);
    expect(withholdingRate(null, '2026-01-01')).toBe(0);
  });

  it('is driven by the ex-date, not the current rate', () => {
    expect(withholdingRate('stock-us', '1999-12-31')).toBe(0.3);
  });
});

describe('computeReceivedDividends', () => {
  it('multiplies the per-share amount by the quantity held on the ex-date', () => {
    const received = computeReceivedDividends(
      [tx('MXRF11', 'buy', 100, '2026-02-10T12:00:00.000Z')],
      events,
      asFii,
    );

    expect(received).toHaveLength(2);
    expect(received[0]).toMatchObject({
      exDate: '2026-04-01',
      quantity: 100,
      gross: 10,
      tax: 0,
      received: 10,
    });
  });

  it('applies the 30% withholding to US dividends (net received)', () => {
    const received = computeReceivedDividends(
      [tx('AAPL', 'buy', 100, '2026-02-10T12:00:00.000Z')],
      [{ ticker: 'AAPL', exDate: '2026-03-01', amount: 1 }],
      asUs,
    );

    expect(received[0]).toMatchObject({ gross: 100, tax: 30, received: 70 });
  });

  it('only counts shares bought strictly before the ex-date', () => {
    const received = computeReceivedDividends(
      [
        tx('MXRF11', 'buy', 50, '2026-02-10T12:00:00.000Z'),
        tx('MXRF11', 'buy', 50, '2026-04-01T09:00:00.000Z'),
      ],
      events,
      asFii,
    );

    expect(received.find((d) => d.exDate === '2026-03-01')?.quantity).toBe(50);
    expect(received.find((d) => d.exDate === '2026-04-01')?.quantity).toBe(50);
  });

  it('drops events with no eligible position and sorts newest first', () => {
    const received = computeReceivedDividends(
      [tx('MXRF11', 'buy', 100, '2026-03-15T12:00:00.000Z')],
      events,
      asFii,
    );

    expect(received).toHaveLength(1);
    expect(received[0].exDate).toBe('2026-04-01');
  });

  it('accounts for sells reducing the eligible quantity', () => {
    const received = computeReceivedDividends(
      [
        tx('MXRF11', 'buy', 100, '2026-01-10T12:00:00.000Z'),
        tx('MXRF11', 'sell', 60, '2026-03-20T12:00:00.000Z'),
      ],
      events,
      asFii,
    );

    expect(received.find((d) => d.exDate === '2026-03-01')?.quantity).toBe(100);
    expect(received.find((d) => d.exDate === '2026-04-01')?.quantity).toBe(40);
  });
});

describe('totalReceived', () => {
  it('sums the net received amounts', () => {
    const received = computeReceivedDividends(
      [tx('MXRF11', 'buy', 100, '2026-02-10T12:00:00.000Z')],
      events,
      asFii,
    );
    expect(totalReceived(received)).toBeCloseTo(20, 10);
  });
});

describe('makeFxLookup', () => {
  const fx = makeFxLookup([
    { date: '2026-03-01', rate: 5.0 },
    { date: '2026-04-01', rate: 5.5 },
  ]);

  it('picks the rate in effect on the given date', () => {
    expect(fx('2026-03-01')).toBe(5.0);
    expect(fx('2026-04-10')).toBe(5.5);
  });

  it('carries the last quote forward on weekends/holidays', () => {
    expect(fx('2026-03-15')).toBe(5.0);
  });

  it('falls back to the first quote before the series starts', () => {
    expect(fx('2026-01-01')).toBe(5.0);
  });
});

describe('estimateMonthlyAmountPerShare', () => {
  const today = '2026-06-14';

  const monthlyFii: DividendEvent[] = [
    '2025-07-01',
    '2025-08-01',
    '2025-09-01',
    '2025-10-01',
    '2025-11-01',
    '2025-12-01',
    '2026-01-01',
    '2026-02-01',
    '2026-03-01',
    '2026-04-01',
    '2026-05-01',
  ].map((exDate) => ({ ticker: 'MXRF11', exDate, amount: 0.1 }));

  it('projects a monthly payer that has not paid this month (median)', () => {
    expect(estimateMonthlyAmountPerShare(monthlyFii, today)).toBeCloseTo(
      0.1,
      6,
    );
  });

  it('returns 0 when it already paid this month', () => {
    const withJune = [
      ...monthlyFii,
      { ticker: 'MXRF11', exDate: '2026-06-02', amount: 0.1 },
    ];
    expect(estimateMonthlyAmountPerShare(withJune, today)).toBe(0);
  });

  it('returns 0 for a seasonal payer out of its month', () => {
    const mayOnly: DividendEvent[] = [
      { ticker: 'PETR4', exDate: '2024-05-10', amount: 2 },
      { ticker: 'PETR4', exDate: '2026-05-10', amount: 2 },
    ];
    expect(estimateMonthlyAmountPerShare(mayOnly, today)).toBe(0);
  });

  it('projects a seasonal payer in its month (median of same-month history)', () => {
    const juneEachYear: DividendEvent[] = [
      { ticker: 'PETR4', exDate: '2024-06-20', amount: 1 },
      { ticker: 'PETR4', exDate: '2025-06-20', amount: 1.2 },
    ];
    expect(estimateMonthlyAmountPerShare(juneEachYear, today)).toBeCloseTo(
      1.1,
      6,
    );
  });
});

describe('projectPendingDividends', () => {
  it('nets withholding and scales by current quantity', () => {
    const events: DividendEvent[] = [
      { ticker: 'AAPL', exDate: '2024-06-20', amount: 1 },
      { ticker: 'AAPL', exDate: '2025-06-20', amount: 1 },
    ];
    const pending = projectPendingDividends(
      events,
      [{ ticker: 'AAPL', quantity: 10 }],
      asUs,
      '2026-06-14',
    );
    expect(pending).toHaveLength(1);
    expect(pending[0].gross).toBeCloseTo(10, 6);
    expect(pending[0].tax).toBeCloseTo(3, 6);
    expect(pending[0].pending).toBeCloseTo(7, 6);
  });

  it('drops positions with no expected payment this month', () => {
    const events: DividendEvent[] = [
      { ticker: 'PETR4', exDate: '2025-05-10', amount: 2 },
    ];
    const pending = projectPendingDividends(
      events,
      [{ ticker: 'PETR4', quantity: 100 }],
      asUs,
      '2026-06-14',
    );
    expect(pending).toHaveLength(0);
  });
});

describe('totalsInBRL', () => {
  it('converts each dividend by the rate of its own ex-date', () => {
    const received = computeReceivedDividends(
      [tx('AAPL', 'buy', 100, '2026-02-10T12:00:00.000Z')],
      [
        { ticker: 'AAPL', exDate: '2026-03-01', amount: 1 },
        { ticker: 'AAPL', exDate: '2026-04-01', amount: 1 },
      ],
      asUs,
    );
    const fx = makeFxLookup([
      { date: '2026-03-01', rate: 5 },
      { date: '2026-04-01', rate: 6 },
    ]);

    const { receivedBRL, taxBRL } = totalsInBRL(received, fx);
    expect(receivedBRL).toBeCloseTo(770, 6);
    expect(taxBRL).toBeCloseTo(330, 6);
  });
});
