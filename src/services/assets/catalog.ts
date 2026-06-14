import type { Asset } from '@/domain';

export type AssetHit = Asset & { price: number | null };

const dynamicByTicker = new Map<string, Asset>();

export function setDynamicAssets(assets: Asset[]): void {
  dynamicByTicker.clear();
  for (const asset of assets)
    dynamicByTicker.set(asset.ticker.toUpperCase(), asset);
}

export function upsertDynamicAsset(asset: Asset): void {
  dynamicByTicker.set(asset.ticker.toUpperCase(), asset);
}

export function findAsset(ticker: string): Asset | null {
  return dynamicByTicker.get(ticker.toUpperCase()) ?? null;
}
