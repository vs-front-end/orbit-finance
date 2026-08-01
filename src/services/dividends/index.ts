import { z } from 'zod';

import {
  dividendPaymentSchema,
  splitEventSchema,
  type DividendEvent,
  type DividendPayment,
  type SplitEvent,
} from '@/domain';

import { toYahooSymbol } from '../quotes';
import { supabase } from '../supabase';

const eventSchema = z.object({
  ticker: z.string(),
  exDate: z.string(),
  amount: z.number(),
});

export type DividendsService = {
  getDividends: (tickers: string[]) => Promise<DividendEvent[]>;
  getPayments: (tickers: string[]) => Promise<DividendPayment[]>;
  getSplits: (tickers: string[]) => Promise<SplitEvent[]>;
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

  async getPayments(tickers) {
    const brazilian = tickers.filter((ticker) =>
      /^[A-Z]{4}\d{1,2}B?$/.test(ticker),
    );
    if (brazilian.length === 0) return [];

    const { data, error } = await supabase.functions.invoke('quotes-us', {
      body: { payments: brazilian.map((ticker) => ({ ticker })) },
    });
    if (error) throw new Error(error.message);

    return z.array(dividendPaymentSchema).parse(data);
  },

  async getSplits(tickers) {
    if (tickers.length === 0) return [];

    const { data, error } = await supabase.functions.invoke('quotes-us', {
      body: {
        splits: tickers.map((ticker) => ({
          ticker,
          symbol: toYahooSymbol(ticker),
        })),
      },
    });
    if (error) throw new Error(error.message);

    return z.array(splitEventSchema).parse(data);
  },
};
