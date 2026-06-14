import { keepPreviousData, useQuery } from '@tanstack/react-query';

import {
  assetsService,
  cdiService,
  dividendsService,
  patrimonyService,
  portfoliosService,
  quotesService,
  targetsService,
} from '@/services';

export const queryKeys = {
  user: ['user'] as const,
  assets: ['assets'] as const,
  portfolios: ['portfolios'] as const,
  portfolio: (id: string) => ['portfolios', id] as const,
  transactions: (portfolioId: string) => ['transactions', portfolioId] as const,
  allTransactions: ['transactions'] as const,
  watchItems: (portfolioId: string) => ['watch-items', portfolioId] as const,
  quotes: (tickers: string[]) => ['quotes', ...tickers] as const,
  dividends: (tickers: string[]) => ['dividends', ...tickers] as const,
  usdBrl: ['usd-brl'] as const,
  cdi: ['cdi'] as const,
  targets: ['targets'] as const,
  patrimonyItems: ['patrimony-items'] as const,
};

export function useAssets() {
  return useQuery({
    queryKey: queryKeys.assets,
    queryFn: () => assetsService.list(),
    staleTime: Infinity,
  });
}

export function usePortfolios() {
  return useQuery({
    queryKey: queryKeys.portfolios,
    queryFn: () => portfoliosService.list(),
  });
}

export function usePortfolio(id: string) {
  return useQuery({
    queryKey: queryKeys.portfolio(id),
    queryFn: () => portfoliosService.get(id),
  });
}

export function useTransactions(portfolioId: string) {
  return useQuery({
    queryKey: queryKeys.transactions(portfolioId),
    queryFn: () => portfoliosService.listTransactions(portfolioId),
  });
}

export function useAllTransactions() {
  return useQuery({
    queryKey: queryKeys.allTransactions,
    queryFn: () => portfoliosService.listAllTransactions(),
  });
}

export function useWatchItems(portfolioId: string) {
  return useQuery({
    queryKey: queryKeys.watchItems(portfolioId),
    queryFn: () => portfoliosService.listWatchItems(portfolioId),
  });
}

export function useQuotes(tickers: string[]) {
  const sorted = [...tickers].sort();

  return useQuery({
    queryKey: queryKeys.quotes(sorted),
    queryFn: () => quotesService.getQuotes(sorted),
    enabled: sorted.length > 0,
    staleTime: 300_000,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });
}

export function useDividendEvents(tickers: string[]) {
  const sorted = [...tickers].sort();

  return useQuery({
    queryKey: queryKeys.dividends(sorted),
    queryFn: () => dividendsService.getDividends(sorted),
    enabled: sorted.length > 0,
    staleTime: 12 * 60 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useUsdBrlRate() {
  return useQuery({
    queryKey: queryKeys.usdBrl,
    queryFn: () => quotesService.getUsdBrlRate(),
    staleTime: Infinity,
  });
}

export function useUsdBrlSeries() {
  return useQuery({
    queryKey: ['usd-brl-series'],
    queryFn: () => quotesService.getUsdBrlSeries(),
    staleTime: 12 * 60 * 60 * 1000,
  });
}

export function useCdiAnnual() {
  return useQuery({
    queryKey: queryKeys.cdi,
    queryFn: () => cdiService.getCdiAnnual(),
    staleTime: Infinity,
  });
}

export function useCdiSeries(since: string | null) {
  return useQuery({
    queryKey: ['cdi-series', since],
    queryFn: () => cdiService.getCdiSeries(since ?? ''),
    enabled: since !== null,
    staleTime: 12 * 60 * 60 * 1000,
  });
}

export function useTargets() {
  return useQuery({
    queryKey: queryKeys.targets,
    queryFn: () => targetsService.getTargets(),
  });
}

export function usePatrimonyItems() {
  return useQuery({
    queryKey: queryKeys.patrimonyItems,
    queryFn: () => patrimonyService.list(),
  });
}
