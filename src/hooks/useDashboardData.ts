import { useEffect } from 'react';

import { summarizePositions, type Currency } from '@/domain';
import { historyService } from '@/services';

import {
  useAllTransactions,
  usePortfolios,
  useQuotes,
  useUsdBrlRate,
} from './queries';
import { buildPositionViews } from './usePositionViews';

export function useDashboardData() {
  const portfoliosQuery = usePortfolios();
  const transactionsQuery = useAllTransactions();

  const transactions = transactionsQuery.data ?? [];
  const tickers = [
    ...new Set(transactions.map((transaction) => transaction.ticker)),
  ];
  const quotesQuery = useQuotes(tickers);
  const rateQuery = useUsdBrlRate();

  const rate = rateQuery.data ?? 0;
  const toBRL = (value: number, currency: Currency) =>
    currency === 'USD' ? value * rate : value;

  const portfolios = portfoliosQuery.data ?? [];

  const perPortfolio = portfolios.map((portfolio) => {
    const views = buildPositionViews(
      transactions.filter((tx) => tx.portfolioId === portfolio.id),
      quotesQuery.data,
    );

    return {
      portfolio,
      views,
      summary: summarizePositions(views),
    };
  });

  const quotesReady = tickers.length === 0 || quotesQuery.isSuccess;
  const dataReady =
    !portfoliosQuery.isLoading && !transactionsQuery.isLoading && quotesReady;

  useEffect(() => {
    if (!dataReady) return;

    const flag = `orbit.snapshot.${new Date().toISOString().slice(0, 10)}`;
    if (localStorage.getItem(flag)) return;

    const positioned = perPortfolio.filter(({ views }) => views.length > 0);
    const allQuotesReady = positioned.every(({ views }) =>
      views.every((view) => view.quote !== null),
    );
    const entries = positioned
      .filter(
        ({ summary, views }) =>
          summary.marketValue > 0 && views.every((view) => view.quote !== null),
      )
      .map(({ portfolio, summary }) => ({
        portfolioId: portfolio.id,
        value: summary.marketValue,
        currency: portfolio.currency,
      }));

    if (entries.length === 0) return;

    if (allQuotesReady) localStorage.setItem(flag, '1');
    historyService
      .recordSnapshot(entries)
      .catch(() => localStorage.removeItem(flag));
  }, [dataReady, quotesQuery.dataUpdatedAt]);

  const totals = perPortfolio.reduce(
    (acc, { portfolio, summary }) => ({
      marketValue:
        acc.marketValue + toBRL(summary.marketValue, portfolio.currency),
      investedValue:
        acc.investedValue + toBRL(summary.investedValue, portfolio.currency),
      dailyPL: acc.dailyPL + toBRL(summary.dailyPL, portfolio.currency),
      netPL: acc.netPL + toBRL(summary.netPL, portfolio.currency),
      gains: acc.gains + toBRL(summary.gains, portfolio.currency),
      losses: acc.losses + toBRL(summary.losses, portfolio.currency),
    }),
    {
      marketValue: 0,
      investedValue: 0,
      dailyPL: 0,
      netPL: 0,
      gains: 0,
      losses: 0,
    },
  );

  const previousValue = totals.marketValue - totals.dailyPL;

  const consolidated = {
    ...totals,
    dailyPLPercent:
      previousValue > 0 ? (totals.dailyPL / previousValue) * 100 : 0,
    netPLPercent:
      totals.investedValue > 0
        ? (totals.netPL / totals.investedValue) * 100
        : 0,
  };

  return {
    perPortfolio,
    consolidated,
    usdBrlRate: rate,
    isLoading:
      portfoliosQuery.isLoading ||
      transactionsQuery.isLoading ||
      rateQuery.isLoading ||
      (tickers.length > 0 && quotesQuery.isLoading),
    isFetchingQuotes: quotesQuery.isFetching,
    quotesUpdatedAt: quotesQuery.dataUpdatedAt,
    refetchQuotes: quotesQuery.refetch,
  };
}
