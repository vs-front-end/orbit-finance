import { z } from 'zod';

import type { FxPoint } from '@/domain';

import { supabase } from '../../supabase';

const seriesSchema = z.array(
  z.object({
    date: z.string(),
    rate: z.number(),
  }),
);

export async function getUsdBrlSeries(): Promise<FxPoint[]> {
  const { data, error } = await supabase.functions.invoke('quotes-us', {
    body: { fx: 'USD-BRL', range: '5y' },
  });
  if (error) throw error;

  return seriesSchema.parse(data);
}
