import { z } from 'zod';

import type { DividendEvent } from '@/domain';

import { toYahooSymbol } from '../quotes';
import { supabase } from '../supabase';

const eventSchema = z.object({
  ticker: z.string(),
  exDate: z.string(),
  amount: z.number(),
});

export type DividendsService = {
  getDividends: (tickers: string[]) => Promise<DividendEvent[]>;
};

export const dividendsService: DividendsService = {
  async getDividends(tickers) {
    if (tickers.length === 0) return [];

    const { data, error } = await supabase.functions.invoke('quotes-us', {
      body: {
        dividends: tickers.map((ticker) => ({
          ticker,
          symbol: toYahooSymbol(ticker),
        })),
      },
    });
    if (error) throw new Error(error.message);

    return z.array(eventSchema).parse(data);
  },
};
