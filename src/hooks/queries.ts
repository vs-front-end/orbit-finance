import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import type { Portfolio } from '@/domain';

import {
  assetsService,
  dividendsService,
  ledgerService,
  portfoliosService,
  quotesService,
  targetsService,
} from '@/services';

export const queryKeys = {
  user: ['user'] as const,
  assets: ['assets'] as const,
  portfolios: ['portfolios'] as const,
  portfolio: (id: string) => ['portfolios', id] as const,
  allTransactions: ['transactions'] as const,
  quotes: (tickers: string[]) => ['quotes', ...tickers] as const,
  dividends: (tickers: string[]) => ['dividends', ...tickers] as const,
  payments: (tickers: string[]) => ['payments', ...tickers] as const,
  splits: (tickers: string[]) => ['splits', ...tickers] as const,
  usdBrl: ['usd-brl'] as const,
  targets: ['targets'] as const,
  ledger: ['dividend-ledger'] as const,
};

const sessionCacheOptions = {
  staleTime: Infinity,
  gcTime: Infinity,
  refetchOnWindowFocus: false,
};

export function useAssets() {
  return useQuery({
    queryKey: queryKeys.assets,
    queryFn: () => assetsService.list(),
    ...sessionCacheOptions,
  });
}

export function usePortfolios() {
  return useQuery({
    queryKey: queryKeys.portfolios,
    queryFn: () => portfoliosService.list(),
    ...sessionCacheOptions,
  });
}

export function usePortfolio(id: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.portfolio(id),
    queryFn: () => portfoliosService.get(id),
    initialData: () =>
      queryClient
        .getQueryData<Portfolio[]>(queryKeys.portfolios)
        ?.find((portfolio) => portfolio.id === id),
    ...sessionCacheOptions,
  });
}

export function useAllTransactions() {
  return useQuery({
    queryKey: queryKeys.allTransactions,
    queryFn: () => portfoliosService.listAllTransactions(),
    ...sessionCacheOptions,
  });
}

export function useAllTickers(): string[] {
  const { data } = useAllTransactions();

  return [
    ...new Set((data ?? []).map((transaction) => transaction.ticker)),
  ].sort();
}

export function useQuotes() {
  const tickers = useAllTickers();

  return useQuery({
    queryKey: queryKeys.quotes(tickers),
    queryFn: () => quotesService.getQuotes(tickers),
    enabled: tickers.length > 0,
    ...sessionCacheOptions,
    placeholderData: keepPreviousData,
  });
}

export function useDividendEvents() {
  const tickers = useAllTickers();

  return useQuery({
    queryKey: queryKeys.dividends(tickers),
    queryFn: () => dividendsService.getDividends(tickers),
    enabled: tickers.length > 0,
    ...sessionCacheOptions,
    placeholderData: keepPreviousData,
  });
}

export function useDividendPayments() {
  const tickers = useAllTickers();

  return useQuery({
    queryKey: queryKeys.payments(tickers),
    queryFn: () => dividendsService.getPayments(tickers),
    enabled: tickers.length > 0,
    ...sessionCacheOptions,
    placeholderData: keepPreviousData,
  });
}

export function useSplits() {
  const tickers = useAllTickers();

  return useQuery({
    queryKey: queryKeys.splits(tickers),
    queryFn: () => dividendsService.getSplits(tickers),
    enabled: tickers.length > 0,
    ...sessionCacheOptions,
    placeholderData: keepPreviousData,
  });
}

export function useStoredDividends() {
  return useQuery({
    queryKey: queryKeys.ledger,
    queryFn: () => ledgerService.list(),
    ...sessionCacheOptions,
  });
}

export function useUsdBrlRate() {
  return useQuery({
    queryKey: queryKeys.usdBrl,
    queryFn: () => quotesService.getUsdBrlRate(),
    ...sessionCacheOptions,
  });
}

export function useUsdBrlSeries() {
  return useQuery({
    queryKey: ['usd-brl-series'],
    queryFn: () => quotesService.getUsdBrlSeries(),
    ...sessionCacheOptions,
  });
}

export function useTargets() {
  return useQuery({
    queryKey: queryKeys.targets,
    queryFn: () => targetsService.getTargets(),
    ...sessionCacheOptions,
  });
}
