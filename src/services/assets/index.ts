import { z } from 'zod';

import { assetSchema, type Asset, type Currency } from '@/domain';

import { supabase } from '../supabase';
import {
  findAsset,
  setDynamicAssets,
  upsertDynamicAsset,
  type AssetHit,
} from './catalog';
import { searchCoinGecko } from './providers/coingecko';
import { searchYahoo } from './providers/yahoo';
import { repairAssetSectors } from './repairSectors';

export type AssetsService = {
  search: (query: string, currency: Currency) => Promise<AssetHit[]>;
  list: () => Promise<Asset[]>;
  register: (asset: Asset) => Promise<void>;
  repairSectors: () => Promise<boolean>;
  get: (ticker: string) => Promise<Asset | null>;
};

export const assetsService: AssetsService = {
  async search(query, currency) {
    const term = query.trim();
    if (term.length < 2) return [];

    const sources =
      currency === 'BRL'
        ? [searchYahoo(term, 'BR')]
        : [searchYahoo(term, 'US'), searchCoinGecko(term)];

    const settled = await Promise.allSettled(sources);
    return settled.flatMap((result) =>
      result.status === 'fulfilled' ? result.value : [],
    );
  },

  async list() {
    const { data, error } = await supabase.from('assets').select('*');
    if (error) throw new Error(error.message);

    const assets = z.array(assetSchema).parse(data);
    setDynamicAssets(assets);
    return assets;
  },

  async register(asset) {
    upsertDynamicAsset(asset);
    const { error } = await supabase.from('assets').upsert(
      {
        ticker: asset.ticker,
        name: asset.name,
        assetClass: asset.assetClass,
        sector: asset.sector,
        currency: asset.currency,
      },
      { onConflict: 'user_id,ticker' },
    );
    if (error) throw new Error(error.message);
  },

  async repairSectors() {
    return repairAssetSectors();
  },

  async get(ticker) {
    return findAsset(ticker);
  },
};

export { findAsset, type AssetHit } from './catalog';
