import { z } from 'zod';

import { env } from '@/config';

const responseSchema = z.object({
  USDBRL: z.object({ bid: z.string() }),
});

export async function getAwesomeUsdBrl(): Promise<number> {
  const response = await fetch(`${env.VITE_AWESOMEAPI_URL}/last/USD-BRL`);
  if (!response.ok) throw new Error(`awesomeapi: HTTP ${response.status}`);

  const data = responseSchema.parse(await response.json());
  const rate = Number(data.USDBRL.bid);
  if (!Number.isFinite(rate) || rate <= 0)
    throw new Error('awesomeapi: cotação inválida');
  return rate;
}
