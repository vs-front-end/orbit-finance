import { describe, expect, it } from 'vitest';
import { attachPaymentDates, type DividendPayment } from './payments';

const payment = (
  ticker: string,
  dataCom: string,
  paymentDate: string,
): DividendPayment => ({
  ticker,
  dataCom,
  paymentDate,
  rate: 0.92,
  label: 'RENDIMENTO',
});

const xpml: DividendPayment[] = [
  payment('XPML11', '2026-07-17', '2026-07-24'),
  payment('XPML11', '2026-06-18', '2026-06-25'),
  payment('XPML11', '2026-05-18', '2026-05-25'),
];

describe('attachPaymentDates', () => {
  it('uses the real payment date when the ex-date follows a known data-com', () => {
    const [result] = attachPaymentDates(
      [{ ticker: 'XPML11', exDate: '2026-07-20' }],
      xpml,
    );

    expect(result.paymentDate).toBe('2026-07-24');
    expect(result.estimatedPayment).toBe(false);
  });

  it('estimates older events from the median lag of the same ticker', () => {
    const [result] = attachPaymentDates(
      [{ ticker: 'XPML11', exDate: '2024-03-19' }],
      xpml,
    );

    expect(result.paymentDate).toBe('2024-03-25');
    expect(result.estimatedPayment).toBe(true);
  });

  it('lands the estimate in the same month as the real payment', () => {
    const [result] = attachPaymentDates(
      [{ ticker: 'HSML11', exDate: '2026-07-01' }],
      [
        payment('HSML11', '2026-06-30', '2026-07-07'),
        payment('HSML11', '2026-05-29', '2026-06-08'),
      ],
    );

    expect(result.paymentDate.slice(0, 7)).toBe('2026-07');
  });

  it('falls back to a default lag for tickers with no B3 data', () => {
    const [result] = attachPaymentDates(
      [{ ticker: 'IRDM11', exDate: '2026-07-02' }],
      xpml,
    );

    expect(result.paymentDate).toBe('2026-07-12');
    expect(result.estimatedPayment).toBe(true);
  });

  it('keeps the original fields untouched', () => {
    const [result] = attachPaymentDates(
      [{ ticker: 'XPML11', exDate: '2026-07-20', received: 11.96 }],
      xpml,
    );

    expect(result.received).toBe(11.96);
  });
});

describe('imposto por rótulo', () => {
  const jcp: DividendPayment = {
    ticker: 'PETR4',
    dataCom: '2026-06-01',
    paymentDate: '2026-08-20',
    rate: 0.35,
    label: 'JRS CAP PROPRIO',
  };

  it('marks a matched JCP with its label', () => {
    const [result] = attachPaymentDates(
      [{ ticker: 'PETR4', exDate: '2026-06-02' }],
      [jcp],
    );

    expect(result.paymentLabel).toBe('JRS CAP PROPRIO');
    expect(result.estimatedPayment).toBe(false);
  });

  it('leaves the label empty when the payment is only estimated', () => {
    const [result] = attachPaymentDates(
      [{ ticker: 'PETR4', exDate: '2020-06-02' }],
      [jcp],
    );

    expect(result.paymentLabel).toBe('');
    expect(result.estimatedPayment).toBe(true);
  });
});
