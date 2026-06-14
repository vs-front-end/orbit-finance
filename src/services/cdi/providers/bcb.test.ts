import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getBcbCdiSeries } from './bcb';

const latestRow = { data: '11/06/2026', valor: '0.053400' };

function mockFetch(
  handlers: Record<
    string,
    () => Promise<{
      ok: boolean;
      status?: number;
      json: () => Promise<unknown>;
    }>
  >,
) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const handler = Object.entries(handlers).find(([key]) =>
        url.includes(key),
      );
      if (!handler) throw new Error(`unexpected fetch: ${url}`);
      return handler[1]();
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('getBcbCdiSeries', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-14T12:00:00Z'));
  });
  it('returns each business day with its own rate from the BCB range', async () => {
    mockFetch({
      ultimos: async () => ({
        ok: true,
        json: async () => [latestRow],
      }),
      dados: async () => ({
        ok: true,
        json: async () => [
          { data: '01/06/2026', valor: '0.050000' },
          { data: '02/06/2026', valor: '0.040000' },
        ],
      }),
    });

    const series = await getBcbCdiSeries('2026-06-01');

    expect(series).toEqual([
      { date: '2026-06-01', daily: 0.0005 },
      { date: '2026-06-02', daily: 0.0004 },
    ]);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/dataFinal=11%2F06%2F2026/),
    );
  });

  it('returns an empty series when the reference date is after the latest quote', async () => {
    mockFetch({
      ultimos: async () => ({
        ok: true,
        json: async () => [latestRow],
      }),
    });

    const series = await getBcbCdiSeries('2026-06-14');

    expect(series).toEqual([]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('returns an empty series for a future reference date', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const series = await getBcbCdiSeries('2099-01-01');

    expect(series).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns an empty series when the BCB range has no data', async () => {
    mockFetch({
      ultimos: async () => ({
        ok: true,
        json: async () => [latestRow],
      }),
      dados: async () => ({
        ok: false,
        status: 404,
        json: async () => ({}),
      }),
    });

    const series = await getBcbCdiSeries('2026-06-11');

    expect(series).toEqual([]);
  });
});
