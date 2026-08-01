import {
  keepPreviousData,
  type QueryClient,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import type { DividendEvent, Portfolio, Quote, Transaction } from '@/domain';

import {
  assetsService,
  dividendsService,
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
  quotes: (tickers: string[]) => ['quotes', ...tickers] as const,
  dividends: (tickers: string[]) => ['dividends', ...tickers] as const,
  usdBrl: ['usd-brl'] as const,
  targets: ['targets'] as const,
};

const sessionCacheOptions = {
  staleTime: Infinity,
  gcTime: Infinity,
  refetchOnWindowFocus: false,
};

function getCachedQuotes(
  queryClient: QueryClient,
  tickers: string[],
): Quote[] | undefined {
  const quoteByTicker = new Map<string, Quote>();
  const cachedQueries = queryClient.getQueriesData<Quote[]>({
    queryKey: ['quotes'],
  });

  for (const [, quotes] of cachedQueries) {
    for (const quote of quotes ?? []) {
      quoteByTicker.set(quote.ticker, quote);
    }
  }

  const quotes = tickers.flatMap((ticker) => {
    const quote = quoteByTicker.get(ticker);
    return quote === undefined ? [] : [quote];
  });

  return quotes.length === tickers.length ? quotes : undefined;
}

function getCachedDividendEvents(
  queryClient: QueryClient,
  tickers: string[],
): DividendEvent[] | undefined {
  const eventsByKey = new Map<string, DividendEvent>();
  const cachedTickers = new Set<string>();
  const cachedQueries = queryClient.getQueriesData<DividendEvent[]>({
    queryKey: ['dividends'],
  });

  for (const [queryKey, events] of cachedQueries) {
    for (const part of queryKey.slice(1)) {
      if (typeof part === 'string') cachedTickers.add(part);
    }

    for (const event of events ?? []) {
      eventsByKey.set(`${event.ticker}-${event.exDate}`, event);
    }
  }

  const events = [...eventsByKey.values()];
  return tickers.every((ticker) => cachedTickers.has(ticker))
    ? events.filter((event) => tickers.includes(event.ticker))
    : undefined;
}

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

export function useTransactions(portfolioId: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.transactions(portfolioId),
    queryFn: () => portfoliosService.listTransactions(portfolioId),
    initialData: () =>
      queryClient
        .getQueryData<Transaction[]>(queryKeys.allTransactions)
        ?.filter((transaction) => transaction.portfolioId === portfolioId),
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

export function useQuotes(tickers: string[]) {
  const queryClient = useQueryClient();
  const sorted = [...tickers].sort();

  return useQuery({
    queryKey: queryKeys.quotes(sorted),
    queryFn: () => quotesService.getQuotes(sorted),
    enabled: sorted.length > 0,
    ...sessionCacheOptions,
    placeholderData: keepPreviousData,
    initialData: () => getCachedQuotes(queryClient, sorted),
  });
}

export function useDividendEvents(tickers: string[]) {
  const queryClient = useQueryClient();
  const sorted = [...tickers].sort();

  return useQuery({
    queryKey: queryKeys.dividends(sorted),
    queryFn: () => dividendsService.getDividends(sorted),
    enabled: sorted.length > 0,
    initialData: () => getCachedDividendEvents(queryClient, sorted),
    ...sessionCacheOptions,
    placeholderData: keepPreviousData,
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
