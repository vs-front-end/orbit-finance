import { z } from 'zod';

import { env } from '@/config';

const responseSchema = z.array(z.object({ valor: z.string() })).min(1);

export async function getBcbCdiAnnual(): Promise<number> {
  const response = await fetch(
    `${env.VITE_BCB_SGS_URL}/bcdata.sgs.12/dados/ultimos/1?formato=json`,
  );
  if (!response.ok) throw new Error(`bcb: HTTP ${response.status}`);

  const data = responseSchema.parse(await response.json());
  const latest = data[data.length - 1];
  const daily = Number(latest?.valor) / 100;
  if (!Number.isFinite(daily) || daily <= 0)
    throw new Error('bcb: taxa inválida');

  return (1 + daily) ** 252 - 1;
}
