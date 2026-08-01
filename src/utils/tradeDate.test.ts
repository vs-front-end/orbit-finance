import { describe, expect, it } from 'vitest';
import { toTradeDateIso, tradeDateOf, tradeTimeOf } from './tradeDate';

describe('toTradeDateIso', () => {
  it('keeps the chosen day when the trade is registered at night', () => {
    const iso = toTradeDateIso(new Date(2026, 6, 16), '21:30');

    expect(iso.slice(0, 10)).toBe('2026-07-16');
  });

  it('keeps the chosen day when registered in the morning', () => {
    const iso = toTradeDateIso(new Date(2026, 6, 16), '10:00');

    expect(iso.slice(0, 10)).toBe('2026-07-16');
  });

  it('keeps the chosen day at either end of the clock', () => {
    expect(toTradeDateIso(new Date(2026, 6, 16), '00:00').slice(0, 10)).toBe(
      '2026-07-16',
    );
    expect(toTradeDateIso(new Date(2026, 6, 16), '23:59').slice(0, 10)).toBe(
      '2026-07-16',
    );
  });

  it('round-trips back to the same day and time', () => {
    const iso = toTradeDateIso(new Date(2026, 6, 16), '21:30');
    const date = tradeDateOf(iso);

    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(6);
    expect(date.getDate()).toBe(16);
    expect(tradeTimeOf(iso)).toBe('21:30');
  });
});
