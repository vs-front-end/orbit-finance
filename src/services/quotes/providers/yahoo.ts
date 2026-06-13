import { z } from 'zod';

import { quoteSchema, type Quote } from '@/domain';

import { supabase } from '../../supabase';

const responseSchema = z.array(quoteSchema);

export async function getYahooQuotes(tickers: string[]): Promise<Quote[]> {
  if (tickers.length === 0) return [];

  const { data, error } = await supabase.functions.invoke('quotes-us', {
    body: { symbols: tickers.map((ticker) => ticker.toUpperCase()) },
  });
  if (error) throw error;

  return responseSchema.parse(data);
}
