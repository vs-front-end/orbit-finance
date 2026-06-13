import type { Quote } from '@/domain';

import { findAsset } from '../assets/catalog';
import { getBenchmarkReturns as fetchBenchmarkReturns } from './providers/benchmark';
import { getAwesomeUsdBrl } from './providers/awesomeapi';
import { getYahooQuotes } from './providers/yahoo';

export type QuotesService = {
  getQuotes: (tickers: string[]) => Promise<Quote[]>;
  getUsdBrlRate: () => Promise<number>;
  getBenchmarkReturns: (days: number) => Promise<{
    ibov: number | null;
    sp500: number | null;
  }>;
};

// Yahoo via Edge Function: ações US, B3 (.SA) e cripto (-USD).
function toYahooSymbol(ticker: string): string {
  const assetClass = findAsset(ticker)?.assetClass;
  if (assetClass === 'crypto') return `${ticker}-USD`;
  if (assetClass === 'stock-br' || assetClass === 'fii') return `${ticker}.SA`;
  return ticker;
}

export const quotesService: QuotesService = {
  async getQuotes(tickers) {
    if (tickers.length === 0) return [];

    const tickerBySymbol = new Map<string, string>();
    for (const ticker of tickers) {
      tickerBySymbol.set(toYahooSymbol(ticker).toUpperCase(), ticker);
    }

    const quotes = await getYahooQuotes([...tickerBySymbol.keys()]);

    return quotes.map((quote) => ({
      ...quote,
      ticker: tickerBySymbol.get(quote.ticker.toUpperCase()) ?? quote.ticker,
    }));
  },

  async getUsdBrlRate() {
    return getAwesomeUsdBrl();
  },

  async getBenchmarkReturns(days) {
    return fetchBenchmarkReturns(days);
  },
};
