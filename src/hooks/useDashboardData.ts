import { useEffect } from 'react';

import type { AllocationSlice } from '@/components/Charts';
import { summarizePositions, type Currency, type PositionView } from '@/domain';
import { findAsset, historyService } from '@/services';

import {
  useAllTransactions,
  usePortfolios,
  useQuotes,
  useUsdBrlRate,
} from './queries';
import { buildPositionViews } from './usePositionViews';

const CLASS_LABELS: Record<string, string> = {
  fii: 'FIIs',
  'stock-br': 'Ações BR',
  'stock-us': 'Ações US',
  crypto: 'Cripto',
};

export function useDashboardData() {
  const portfoliosQuery = usePortfolios();
  const transactionsQuery = useAllTransactions();

  const transactions = transactionsQuery.data ?? [];
  const tickers = [...new Set(transactions.map((tx) => tx.ticker))];
  const quotesQuery = useQuotes(tickers);
  const rateQuery = useUsdBrlRate();

  const rate = rateQuery.data ?? 0;
  const toBRL = (value: number, currency: Currency) =>
    currency === 'USD' ? value * rate : value;

  const portfolios = (portfoliosQuery.data ?? []).filter(
    (p) => p.kind === 'investment',
  );

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

  const allViewsBRL: { view: PositionView; valueBRL: number }[] =
    perPortfolio.flatMap(({ portfolio, views }) =>
      views.map((view) => ({
        view,
        valueBRL: toBRL(view.marketValue, portfolio.currency),
      })),
    );

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

  const byPortfolio: AllocationSlice[] = perPortfolio
    .map(({ portfolio, summary }) => ({
      label: portfolio.name,
      value: toBRL(summary.marketValue, portfolio.currency),
    }))
    .filter((slice) => slice.value > 0);

  const byClass = groupSlices(allViewsBRL, ({ view }) => {
    const assetClass = findAsset(view.ticker)?.assetClass;
    return assetClass ? CLASS_LABELS[assetClass] : 'Outros';
  });

  const bySector = groupSlices(
    allViewsBRL,
    ({ view }) => findAsset(view.ticker)?.sector ?? 'Outros',
  );

  return {
    perPortfolio,
    consolidated,
    usdBrlRate: rate,
    allocations: { byPortfolio, byClass, bySector: topSlices(bySector, 6) },
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

function groupSlices(
  items: { view: PositionView; valueBRL: number }[],
  getLabel: (item: { view: PositionView; valueBRL: number }) => string,
): AllocationSlice[] {
  const groups = new Map<string, number>();

  for (const item of items) {
    const label = getLabel(item);
    groups.set(label, (groups.get(label) ?? 0) + item.valueBRL);
  }

  return [...groups.entries()]
    .map(([label, value]) => ({ label, value }))
    .filter((slice) => slice.value > 0)
    .sort((a, b) => b.value - a.value);
}

function topSlices(slices: AllocationSlice[], max: number): AllocationSlice[] {
  if (slices.length <= max) return slices;
  const top = slices.slice(0, max - 1);

  const rest = slices
    .slice(max - 1)
    .reduce((total, slice) => total + slice.value, 0);

  return [...top, { label: 'Outros', value: rest }];
}
