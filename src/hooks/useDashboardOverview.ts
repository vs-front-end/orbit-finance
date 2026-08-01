import {
  buildPositions,
  computeRealizedPL,
  computeReceivedDividends,
  makeFxLookup,
  projectPendingDividends,
  totalPending,
} from '@/domain';
import { findAsset } from '@/services';

import { useDashboardData } from './useDashboardData';
import {
  useAllTransactions,
  useDividendEvents,
  usePortfolios,
  useUsdBrlRate,
  useUsdBrlSeries,
} from './queries';

const classOf = (ticker: string) => findAsset(ticker)?.assetClass ?? null;

export function useDashboardOverview() {
  const dashboard = useDashboardData();
  const portfoliosQuery = usePortfolios();
  const transactionsQuery = useAllTransactions();
  const rateQuery = useUsdBrlRate();
  const fxQuery = useUsdBrlSeries();

  const transactions = transactionsQuery.data ?? [];
  const tickers = [
    ...new Set(transactions.map((transaction) => transaction.ticker)),
  ];
  const eventsQuery = useDividendEvents(tickers);
  const events = eventsQuery.data ?? [];
  const rate = rateQuery.data ?? 0;
  const usdToBrlAt = makeFxLookup(fxQuery.data ?? []);
  const today = new Date().toISOString().slice(0, 10);

  const investmentPortfolios = (portfoliosQuery.data ?? []).filter(
    (portfolio) => portfolio.kind === 'investment',
  );

  let receivedBRL = 0;
  let realizedBRL = 0;
  let pendingBRL = 0;

  for (const portfolio of investmentPortfolios) {
    const ownTransactions = transactions.filter(
      (transaction) => transaction.portfolioId === portfolio.id,
    );
    const isUsd = portfolio.currency === 'USD';
    const rateAt = isUsd ? usdToBrlAt : () => 1;
    realizedBRL += computeRealizedPL(ownTransactions) * (isUsd ? rate : 1);
    const received = computeReceivedDividends(ownTransactions, events, classOf);

    for (const dividend of received) {
      const fx = rateAt(dividend.exDate);
      const valueBRL = dividend.received * fx;
      receivedBRL += valueBRL;
    }

    const pending = projectPendingDividends(
      events,
      buildPositions(ownTransactions),
      classOf,
      today,
    );
    pendingBRL += totalPending(pending) * (isUsd ? rate : 1);
  }

  return {
    ...dashboard,
    dividends: {
      totalBRL: receivedBRL,
      pendingBRL,
      estimatedMonthlyBRL: pendingBRL,
    },
    totalPLBRL: dashboard.consolidated.netPL + realizedBRL,
    isLoading:
      dashboard.isLoading ||
      portfoliosQuery.isLoading ||
      transactionsQuery.isLoading ||
      rateQuery.isLoading ||
      fxQuery.isLoading ||
      (tickers.length > 0 && eventsQuery.isLoading),
  };
}
