import { useQuery } from '@tanstack/react-query';

import type { ChartSeries } from '@/components/Charts';
import type { CashFlow, Currency } from '@/domain';
import { timeWeightedReturn } from '@/domain';
import { historyService, quotesService } from '@/services';

import { useDashboardData } from './useDashboardData';
import { useAllTransactions, useUsdBrlRate } from './queries';

export function useStatsData(days: number) {
  const dashboard = useDashboardData();
  const rateQuery = useUsdBrlRate();
  const transactionsQuery = useAllTransactions();
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

  const investedBRL = dashboard.perPortfolio.reduce(
    (sum, { portfolio, summary }) =>
      sum + toBRL(summary.investedValue, portfolio.currency),
    0,
  );

  const currencyByPortfolio = new Map<string, Currency>(
    dashboard.perPortfolio.map(({ portfolio }) => [
      portfolio.id,
      portfolio.currency,
    ]),
  );
  const flows: CashFlow[] = (transactionsQuery.data ?? []).flatMap((tx) => {
    const currency = currencyByPortfolio.get(tx.portfolioId);
    if (!currency) return [];
    const cost = tx.quantity * tx.unitPrice;
    const signed = tx.side === 'buy' ? cost : -cost;
    return [{ t: Date.parse(tx.executedAt), amount: toBRL(signed, currency) }];
  });

  const historyPoints = consolidatedSeries[0]?.points ?? [];
  const periodReturn = timeWeightedReturn(historyPoints, flows);

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
    isLoading:
      dashboard.isLoading ||
      historyQuery.isLoading ||
      rateQuery.isLoading ||
      transactionsQuery.isLoading ||
      benchmarkQuery.isLoading,
  };
}
