import { z } from 'zod';

import { assetSchema, type Asset } from '@/domain';

import { supabase } from '../supabase';
import { upsertDynamicAsset } from './catalog';

const enrichSchema = z.array(
  z.object({
    ticker: z.string(),
    sector: z.string(),
  }),
);

function yahooSymbol(asset: Asset): string {
  if (asset.assetClass === 'crypto') return `${asset.ticker}-USD`;
  if (asset.assetClass === 'stock-br' || asset.assetClass === 'fii') {
    return `${asset.ticker}.SA`;
  }
  return asset.ticker;
}

export async function repairAssetSectors(): Promise<boolean> {
  const { data, error } = await supabase.from('assets').select('*');
  if (error) throw new Error(error.message);

  const assets = z.array(assetSchema).parse(data);
  const outros = assets.filter((asset) => asset.sector === 'Outros');
  if (outros.length === 0) return false;

  const updates = new Map<string, string>();

  const { data: enriched, error: enrichError } =
    await supabase.functions.invoke('quotes-us', {
      body: {
        enrichSectors: outros.map((asset) => ({
          ticker: asset.ticker,
          symbol: yahooSymbol(asset),
          assetClass: asset.assetClass,
        })),
      },
    });
  if (!enrichError) {
    for (const row of enrichSchema.parse(enriched)) {
      if (row.sector !== 'Outros') updates.set(row.ticker, row.sector);
    }
  }

  if (updates.size === 0) return false;

  await Promise.all(
    [...updates.entries()].map(async ([ticker, sector]) => {
      const { error: updateError } = await supabase
        .from('assets')
        .update({ sector })
        .eq('ticker', ticker);
      if (updateError) throw new Error(updateError.message);
    }),
  );

  for (const asset of assets) {
    const sector = updates.get(asset.ticker);
    if (sector) upsertDynamicAsset({ ...asset, sector });
  }

  return true;
}
