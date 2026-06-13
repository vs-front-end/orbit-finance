import { z } from 'zod';

import { supabase } from '../../supabase';

const responseSchema = z.object({
  ibov: z.number().nullable(),
  sp500: z.number().nullable(),
});

export type BenchmarkReturns = z.infer<typeof responseSchema>;

export async function getBenchmarkReturns(
  days: number,
): Promise<BenchmarkReturns> {
  const { data, error } = await supabase.functions.invoke('quotes-us', {
    body: { indexDays: days },
  });
  if (error) throw error;

  return responseSchema.parse(data);
}
