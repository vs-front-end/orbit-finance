import { useQuery } from '@tanstack/react-query';

import type { ChartSeries } from '@/components/Charts';
import type { Currency, PositionView } from '@/domain';
import { historyService, quotesService } from '@/services';

import { useDashboardData } from './useDashboardData';
import { useUsdBrlRate } from './queries';

export type PositionMover = {
  view: PositionView;
  currency: Currency;
  portfolioName: string;
};

export function useStatsData(days: number) {
  const dashboard = useDashboardData();
  const rateQuery = useUsdBrlRate();
  const rate = rateQuery.data ?? 0;

  const historyQuery = useQuery({
    queryKey: ['history', days],
    queryFn: () => historyService.getHistory(days),
    staleTime: Infinity,
  });

  const benchmarkQuery = useQuery({
    queryKey: ['benchmark', days],
    queryFn: () => quotesService.getBenchmarkReturns(days),
    staleTime: 60 * 60 * 1000,
  });

  const histories = historyQuery.data ?? [];
  const toBRL = (value: number, currency: Currency) =>
    currency === 'USD' ? value * rate : value;

  const portfolioSeries: ChartSeries[] = histories.map((history) => ({
    id: history.portfolioId,
    label: history.name,
    points: history.points.map((point) => ({
      t: point.t,
      value: toBRL(point.value, history.currency),
    })),
  }));

  const first = portfolioSeries[0];
  const consolidatedSeries: ChartSeries[] = first
    ? [
        {
          id: 'consolidated',
          label: 'Patrimônio',
          points: first.points.map((point, index) => ({
            t: point.t,
            value: portfolioSeries.reduce(
              (sum, series) => sum + (series.points[index]?.value ?? 0),
              0,
            ),
          })),
        },
      ]
    : [];

  const movers: PositionMover[] = dashboard.perPortfolio
    .flatMap(({ portfolio, views }) =>
      views
        .filter((view) => view.quote !== null)
        .map((view) => ({
          view,
          currency: portfolio.currency,
          portfolioName: portfolio.name,
        })),
    )
    .sort((a, b) => b.view.netPLPercent - a.view.netPLPercent);

  const gainers = movers.filter((m) => m.view.netPL > 0).slice(0, 5);
  const losers = movers
    .filter((m) => m.view.netPL < 0)
    .sort((a, b) => a.view.netPLPercent - b.view.netPLPercent)
    .slice(0, 5);

  const investedBRL = dashboard.perPortfolio.reduce(
    (sum, { portfolio, summary }) =>
      sum + toBRL(summary.investedValue, portfolio.currency),
    0,
  );

  const historyPoints = consolidatedSeries[0]?.points ?? [];
  const firstHistoryValue = historyPoints[0]?.value ?? 0;
  const periodReturn =
    firstHistoryValue > 0
      ? ((dashboard.consolidated.marketValue - firstHistoryValue) /
          firstHistoryValue) *
        100
      : null;

  const benchmark = benchmarkQuery.data ?? { ibov: null, sp500: null };

  return {
    consolidated: dashboard.consolidated,
    investedBRL,
    totalReturnPercent:
      investedBRL > 0
        ? ((dashboard.consolidated.marketValue - investedBRL) / investedBRL) *
          100
        : 0,
    periodReturn,
    benchmarkIbov: benchmark.ibov,
    benchmarkSp500: benchmark.sp500,
    consolidatedSeries,
    portfolioSeries,
    hasHistory: (consolidatedSeries[0]?.points.length ?? 0) >= 2,
    gainers,
    losers,
    best: movers[0] ?? null,
    worst: movers.length > 0 ? (movers[movers.length - 1] ?? null) : null,
    isLoading:
      dashboard.isLoading ||
      historyQuery.isLoading ||
      rateQuery.isLoading ||
      benchmarkQuery.isLoading,
  };
}
