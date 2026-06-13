import type { Asset } from '@/domain';

export type AssetHit = Asset & { price: number | null };

export const ASSET_CATALOG: Asset[] = [
  {
    ticker: 'PVBI11',
    name: 'FII VBI Prime Properties',
    assetClass: 'fii',
    sector: 'Lajes Corporativas',
    currency: 'BRL',
  },
  {
    ticker: 'BRCO11',
    name: 'FII Bresco Logística',
    assetClass: 'fii',
    sector: 'Logística',
    currency: 'BRL',
  },
  {
    ticker: 'XPML11',
    name: 'FII XP Malls',
    assetClass: 'fii',
    sector: 'Shoppings',
    currency: 'BRL',
  },
  {
    ticker: 'HSML11',
    name: 'FII HSI Mall',
    assetClass: 'fii',
    sector: 'Shoppings',
    currency: 'BRL',
  },
  {
    ticker: 'BTLG11',
    name: 'FII BTG Pactual Logística',
    assetClass: 'fii',
    sector: 'Logística',
    currency: 'BRL',
  },
  {
    ticker: 'HGLG11',
    name: 'FII CSHG Logística',
    assetClass: 'fii',
    sector: 'Logística',
    currency: 'BRL',
  },
  {
    ticker: 'KNRI11',
    name: 'FII Kinea Renda Imobiliária',
    assetClass: 'fii',
    sector: 'Híbrido',
    currency: 'BRL',
  },
  {
    ticker: 'MXRF11',
    name: 'FII Maxi Renda',
    assetClass: 'fii',
    sector: 'Papel',
    currency: 'BRL',
  },

  {
    ticker: 'BPAC11',
    name: 'BTG Pactual Unit',
    assetClass: 'stock-br',
    sector: 'Financeiro',
    currency: 'BRL',
  },
  {
    ticker: 'ITUB4',
    name: 'Itaú Unibanco PN',
    assetClass: 'stock-br',
    sector: 'Financeiro',
    currency: 'BRL',
  },
  {
    ticker: 'SBSP3',
    name: 'Sabesp ON',
    assetClass: 'stock-br',
    sector: 'Saneamento',
    currency: 'BRL',
  },
  {
    ticker: 'TAEE11',
    name: 'Taesa Unit',
    assetClass: 'stock-br',
    sector: 'Energia',
    currency: 'BRL',
  },
  {
    ticker: 'SAPR4',
    name: 'Sanepar PN',
    assetClass: 'stock-br',
    sector: 'Saneamento',
    currency: 'BRL',
  },
  {
    ticker: 'PSSA3',
    name: 'Porto Seguro ON',
    assetClass: 'stock-br',
    sector: 'Seguros',
    currency: 'BRL',
  },
  {
    ticker: 'ITSA4',
    name: 'Itaúsa PN',
    assetClass: 'stock-br',
    sector: 'Financeiro',
    currency: 'BRL',
  },
  {
    ticker: 'EGIE3',
    name: 'Engie Brasil ON',
    assetClass: 'stock-br',
    sector: 'Energia',
    currency: 'BRL',
  },
  {
    ticker: 'CSMG3',
    name: 'Copasa ON',
    assetClass: 'stock-br',
    sector: 'Saneamento',
    currency: 'BRL',
  },
  {
    ticker: 'CPFE3',
    name: 'CPFL Energia ON',
    assetClass: 'stock-br',
    sector: 'Energia',
    currency: 'BRL',
  },
  {
    ticker: 'MBRF3',
    name: 'Marfrig Global Foods ON',
    assetClass: 'stock-br',
    sector: 'Alimentos',
    currency: 'BRL',
  },
  {
    ticker: 'ABEV3',
    name: 'Ambev ON',
    assetClass: 'stock-br',
    sector: 'Bebidas',
    currency: 'BRL',
  },
  {
    ticker: 'WEGE3',
    name: 'WEG ON',
    assetClass: 'stock-br',
    sector: 'Bens Industriais',
    currency: 'BRL',
  },
  {
    ticker: 'VALE3',
    name: 'Vale ON',
    assetClass: 'stock-br',
    sector: 'Mineração',
    currency: 'BRL',
  },
  {
    ticker: 'PETR4',
    name: 'Petrobras PN',
    assetClass: 'stock-br',
    sector: 'Petróleo e Gás',
    currency: 'BRL',
  },

  {
    ticker: 'EWJ',
    name: 'iShares MSCI Japan ETF',
    assetClass: 'stock-us',
    sector: 'ETF Internacional',
    currency: 'USD',
  },
  {
    ticker: 'EWY',
    name: 'iShares MSCI South Korea ETF',
    assetClass: 'stock-us',
    sector: 'ETF Internacional',
    currency: 'USD',
  },
  {
    ticker: 'META',
    name: 'Meta Platforms',
    assetClass: 'stock-us',
    sector: 'Tecnologia',
    currency: 'USD',
  },
  {
    ticker: 'MSFT',
    name: 'Microsoft',
    assetClass: 'stock-us',
    sector: 'Tecnologia',
    currency: 'USD',
  },
  {
    ticker: 'GOOGL',
    name: 'Alphabet A',
    assetClass: 'stock-us',
    sector: 'Tecnologia',
    currency: 'USD',
  },
  {
    ticker: 'AVGO',
    name: 'Broadcom',
    assetClass: 'stock-us',
    sector: 'Semicondutores',
    currency: 'USD',
  },
  {
    ticker: 'AMZN',
    name: 'Amazon.com',
    assetClass: 'stock-us',
    sector: 'Tecnologia',
    currency: 'USD',
  },
  {
    ticker: 'TSM',
    name: 'Taiwan Semiconductor',
    assetClass: 'stock-us',
    sector: 'Semicondutores',
    currency: 'USD',
  },
  {
    ticker: 'AMD',
    name: 'AMD',
    assetClass: 'stock-us',
    sector: 'Semicondutores',
    currency: 'USD',
  },
  {
    ticker: 'NVDA',
    name: 'NVIDIA',
    assetClass: 'stock-us',
    sector: 'Semicondutores',
    currency: 'USD',
  },
  {
    ticker: 'AAPL',
    name: 'Apple',
    assetClass: 'stock-us',
    sector: 'Tecnologia',
    currency: 'USD',
  },
  {
    ticker: 'TSLA',
    name: 'Tesla',
    assetClass: 'stock-us',
    sector: 'Automotivo',
    currency: 'USD',
  },

  {
    ticker: 'BTC',
    name: 'Bitcoin',
    assetClass: 'crypto',
    sector: 'Criptomoedas',
    currency: 'USD',
  },
  {
    ticker: 'ETH',
    name: 'Ethereum',
    assetClass: 'crypto',
    sector: 'Criptomoedas',
    currency: 'USD',
  },
  {
    ticker: 'SOL',
    name: 'Solana',
    assetClass: 'crypto',
    sector: 'Criptomoedas',
    currency: 'USD',
  },
];

const byTicker = new Map(ASSET_CATALOG.map((entry) => [entry.ticker, entry]));

const dynamicByTicker = new Map<string, Asset>();

export function setDynamicAssets(assets: Asset[]): void {
  dynamicByTicker.clear();
  for (const asset of assets)
    dynamicByTicker.set(asset.ticker.toUpperCase(), asset);
}

export function upsertDynamicAsset(asset: Asset): void {
  dynamicByTicker.set(asset.ticker.toUpperCase(), asset);
}

export function getCatalogSector(ticker: string): string | null {
  return byTicker.get(ticker.toUpperCase())?.sector ?? null;
}

export function findAsset(ticker: string): Asset | null {
  const key = ticker.toUpperCase();
  const dynamic = dynamicByTicker.get(key);
  const catalog = byTicker.get(key);

  if (dynamic) {
    if (dynamic.sector === 'Outros' && catalog?.sector) {
      return { ...dynamic, sector: catalog.sector };
    }
    return dynamic;
  }

  return catalog ?? null;
}
