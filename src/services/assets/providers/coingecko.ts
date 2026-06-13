import { z } from 'zod';

import { env } from '@/config';

import type { AssetHit } from '../catalog';

const responseSchema = z.object({
  coins: z.array(z.object({ name: z.string(), symbol: z.string() })),
});

export async function searchCoinGecko(term: string): Promise<AssetHit[]> {
  const response = await fetch(
    `${env.VITE_COINGECKO_API_URL}/search?query=${encodeURIComponent(term)}`,
  );
  if (!response.ok)
    throw new Error(`coingecko search: HTTP ${response.status}`);

  const data = responseSchema.parse(await response.json());

  return data.coins.slice(0, 8).map((coin) => ({
    ticker: coin.symbol.toUpperCase(),
    name: coin.name,
    assetClass: 'crypto',
    sector: 'Criptomoedas',
    currency: 'USD',
    price: null,
  }));
}
