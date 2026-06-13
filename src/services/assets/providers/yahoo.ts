import { z } from 'zod';

import { assetClassSchema, currencySchema } from '@/domain';

import { supabase } from '../../supabase';
import type { AssetHit } from '../catalog';

const responseSchema = z.array(
  z.object({
    ticker: z.string(),
    name: z.string(),
    assetClass: assetClassSchema,
    sector: z.string(),
    currency: currencySchema,
  }),
);

export async function searchYahoo(
  term: string,
  market: 'BR' | 'US' = 'US',
): Promise<AssetHit[]> {
  const { data, error } = await supabase.functions.invoke('quotes-us', {
    body: { search: term, market },
  });
  if (error) throw error;

  return responseSchema.parse(data).map((hit) => ({ ...hit, price: null }));
}
