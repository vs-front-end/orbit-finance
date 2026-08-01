import { describe, expect, it } from 'vitest';
import {
  dividendId,
  isFreezable,
  mergeLedger,
  pendingFreeze,
  splitByPayment,
  type StoredDividend,
} from './ledger';
import type { ReceivedDividend } from './dividends';

const HOJE = '2026-08-01';

const computado = (
  ticker: string,
  exDate: string,
  overrides: Partial<ReceivedDividend> = {},
): ReceivedDividend => ({
  ticker,
  exDate,
  paymentDate: '2026-07-24',
  estimatedPayment: false,
  label: 'RENDIMENTO',
  amountPerShare: 0.92,
  quantity: 13,
  gross: 11.96,
  tax: 0,
  received: 11.96,
  ...overrides,
});

const gravado = (
  ticker: string,
  exDate: string,
  overrides: Partial<StoredDividend> = {},
): StoredDividend => ({
  id: dividendId('p1', ticker, exDate),
  portfolioId: 'p1',
  ticker,
  exDate,
  paymentDate: '2026-07-24',
  label: 'RENDIMENTO',
  amountPerShare: 0.92,
  quantity: 13,
  gross: 11.96,
  tax: 0,
  received: 11.96,
  currency: 'BRL',
  estimatedPayment: false,
  editedManually: false,
  ...overrides,
});

describe('isFreezable', () => {
  it('freezes what B3 confirmed once the payment date passed', () => {
    expect(isFreezable(computado('XPML11', '2026-07-20'), HOJE)).toBe(true);
  });

  it('does not freeze a confirmed payment still in the future', () => {
    expect(
      isFreezable(
        computado('XPML11', '2026-07-20', { paymentDate: '2026-08-24' }),
        HOJE,
      ),
    ).toBe(false);
  });

  it('holds an estimated payment until the ex-date is old enough', () => {
    const recente = computado('AAPL', '2026-07-20', {
      estimatedPayment: true,
      paymentDate: '2026-07-30',
    });

    expect(isFreezable(recente, HOJE)).toBe(false);
  });

  it('freezes an estimated payment after the grace period', () => {
    const antigo = computado('AAPL', '2026-05-01', {
      estimatedPayment: true,
      paymentDate: '2026-05-11',
    });

    expect(isFreezable(antigo, HOJE)).toBe(true);
  });
});

describe('mergeLedger', () => {
  it('keeps a stored dividend the API no longer returns', () => {
    const merged = mergeLedger('p1', [], [gravado('XPML11', '2021-01-20')]);

    expect(merged).toHaveLength(1);
    expect(merged[0].stored).toBe(true);
  });

  it('lets the stored value win over the recomputed one', () => {
    const merged = mergeLedger(
      'p1',
      [computado('XPML11', '2026-07-20', { received: 99 })],
      [gravado('XPML11', '2026-07-20', { received: 11.96 })],
    );

    expect(merged).toHaveLength(1);
    expect(merged[0].received).toBe(11.96);
  });

  it('adds computed dividends that are not frozen yet', () => {
    const merged = mergeLedger(
      'p1',
      [computado('XPML11', '2026-07-20'), computado('BTLG11', '2026-07-16')],
      [gravado('XPML11', '2026-07-20')],
    );

    expect(merged).toHaveLength(2);
    expect(merged.filter((entry) => entry.stored)).toHaveLength(1);
  });

  it('sorts by payment date, newest first', () => {
    const merged = mergeLedger(
      'p1',
      [
        computado('A', '2026-01-10', { paymentDate: '2026-02-01' }),
        computado('B', '2026-07-10', { paymentDate: '2027-04-30' }),
        computado('C', '2026-06-10', { paymentDate: '2026-08-31' }),
      ],
      [],
    );

    expect(merged.map((entry) => entry.ticker)).toEqual(['B', 'C', 'A']);
  });
});

describe('pendingFreeze', () => {
  it('skips what is already stored', () => {
    const pending = pendingFreeze(
      'p1',
      [computado('XPML11', '2026-07-20')],
      [gravado('XPML11', '2026-07-20')],
      HOJE,
    );

    expect(pending).toHaveLength(0);
  });

  it('returns only what is freezable', () => {
    const pending = pendingFreeze(
      'p1',
      [
        computado('XPML11', '2026-07-20'),
        computado('BTLG11', '2026-07-16', { paymentDate: '2026-09-01' }),
      ],
      [],
      HOJE,
    );

    expect(pending.map((entry) => entry.ticker)).toEqual(['XPML11']);
  });
});

describe('procedência da data', () => {
  it('keeps the estimated flag after freezing', () => {
    const merged = mergeLedger(
      'p1',
      [],
      [gravado('XPML11', '2022-03-21', { estimatedPayment: true })],
    );

    expect(merged[0].estimatedPayment).toBe(true);
    expect(merged[0].stored).toBe(true);
  });

  it('treats a confirmed stored payment as confirmed', () => {
    const merged = mergeLedger('p1', [], [gravado('XPML11', '2026-07-20')]);

    expect(merged[0].estimatedPayment).toBe(false);
  });
});

describe('splitByPayment', () => {
  const HOJE_SPLIT = '2026-08-01';

  it('counts as received only what was already paid', () => {
    const { paid, pending } = splitByPayment(
      [
        { paymentDate: '2026-07-24' },
        { paymentDate: '2026-08-01' },
        { paymentDate: '2026-08-31' },
        { paymentDate: '2027-04-30' },
      ],
      HOJE_SPLIT,
    );

    expect(paid.map((e) => e.paymentDate)).toEqual([
      '2026-07-24',
      '2026-08-01',
    ]);
    expect(pending.map((e) => e.paymentDate)).toEqual([
      '2026-08-31',
      '2027-04-30',
    ]);
  });

  it('treats today as already paid', () => {
    const { paid } = splitByPayment([{ paymentDate: HOJE_SPLIT }], HOJE_SPLIT);

    expect(paid).toHaveLength(1);
  });
});
