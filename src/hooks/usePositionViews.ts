import {
  buildPositions,
  enrichPosition,
  summarizePositions,
  type PositionView,
  type PriceOf,
  type Quote,
  type Transaction,
} from '@/domain';

import { useQuotes } from './queries';
import { useAdjustedTransactions } from './useAdjustedTransactions';

export function buildPositionViews(
  transactions: Transaction[],
  quotes: Quote[] | undefined,
  priceOf?: PriceOf,
): PositionView[] {
  const quoteByTicker = new Map(
    (quotes ?? []).map((quote) => [quote.ticker, quote]),
  );
  return buildPositions(transactions, priceOf).map((position) =>
    enrichPosition(position, quoteByTicker.get(position.ticker) ?? null),
  );
}

export function usePortfolioPositions(portfolioId: string) {
  const { transactions: all, isLoading } = useAdjustedTransactions();
  const quotesQuery = useQuotes();

  const transactions = all.filter((tx) => tx.portfolioId === portfolioId);
  const views = buildPositionViews(transactions, quotesQuery.data);

  return {
    views,
    summary: summarizePositions(views),
    transactions,
    isLoading,
    isFetchingQuotes: quotesQuery.isFetching,
    quotesUpdatedAt: quotesQuery.dataUpdatedAt,
    refetchQuotes: quotesQuery.refetch,
  };
}
