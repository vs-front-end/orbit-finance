import {
  buildPositions,
  enrichPosition,
  summarizePositions,
  type PositionView,
  type Quote,
  type Transaction,
} from '@/domain';

import { useQuotes, useTransactions } from './queries';

export function buildPositionViews(
  transactions: Transaction[],
  quotes: Quote[] | undefined,
): PositionView[] {
  const quoteByTicker = new Map(
    (quotes ?? []).map((quote) => [quote.ticker, quote]),
  );
  return buildPositions(transactions).map((position) =>
    enrichPosition(position, quoteByTicker.get(position.ticker) ?? null),
  );
}

export function usePortfolioPositions(portfolioId: string) {
  const transactionsQuery = useTransactions(portfolioId);
  const transactions = transactionsQuery.data ?? [];
  const tickers = [...new Set(transactions.map((tx) => tx.ticker))];
  const quotesQuery = useQuotes(tickers);

  const views = buildPositionViews(transactions, quotesQuery.data);

  return {
    views,
    summary: summarizePositions(views),
    transactions,
    isLoading: transactionsQuery.isLoading,
    isFetchingQuotes: quotesQuery.isFetching,
    quotesUpdatedAt: quotesQuery.dataUpdatedAt,
    refetchQuotes: quotesQuery.refetch,
  };
}
