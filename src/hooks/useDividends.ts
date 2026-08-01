import { computeReceivedDividends, totalReceived, totalTax } from '@/domain';
import { findAsset } from '@/services';

import { useDividendEvents, useTransactions } from './queries';

const classOf = (ticker: string) => findAsset(ticker)?.assetClass ?? null;

export function usePortfolioDividends(portfolioId: string) {
  const transactionsQuery = useTransactions(portfolioId);
  const transactions = transactionsQuery.data ?? [];
  const tickers = [...new Set(transactions.map((tx) => tx.ticker))];
  const eventsQuery = useDividendEvents(tickers);

  const received = computeReceivedDividends(
    transactions,
    eventsQuery.data ?? [],
    classOf,
  );

  return {
    received,
    total: totalReceived(received),
    tax: totalTax(received),
    isLoading:
      transactionsQuery.isLoading ||
      (tickers.length > 0 && eventsQuery.isLoading),
  };
}
