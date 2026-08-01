import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { Currency } from '@/domain';
import { historyService } from '@/services';

import { useUsdBrlRate } from './queries';

type HistoryChartPoint = { t: number; value: number };

export type HistoryChartSeries = {
  id: string;
  label: string;
  points: HistoryChartPoint[];
};

function consolidateSeries(series: HistoryChartSeries[]): HistoryChartSeries[] {
  const totals = new Map<number, number>();

  for (const portfolio of series) {
    for (const point of portfolio.points) {
      totals.set(point.t, (totals.get(point.t) ?? 0) + point.value);
    }
  }

  const points = [...totals.entries()]
    .map(([t, value]) => ({ t, value }))
    .sort((first, second) => first.t - second.t);

  return points.length > 0
    ? [{ id: 'consolidated', label: 'Patrimônio', points }]
    : [];
}

export function useDashboardHistory(days: number) {
  const historyQuery = useQuery({
    queryKey: ['history', days],
    queryFn: () => historyService.getHistory(days),
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
  const rateQuery = useUsdBrlRate();
  const rate = rateQuery.data ?? 0;
  const toBRL = (value: number, currency: Currency) =>
    currency === 'USD' ? value * rate : value;

  const portfolioSeries: HistoryChartSeries[] = (historyQuery.data ?? []).map(
    (history) => ({
      id: history.portfolioId,
      label: history.name,
      points: history.points.map((point) => ({
        t: point.t,
        value: toBRL(point.value, history.currency),
      })),
    }),
  );
  const consolidatedSeries = consolidateSeries(portfolioSeries);

  return {
    consolidatedSeries,
    portfolioSeries,
    hasHistory: (consolidatedSeries[0]?.points.length ?? 0) >= 2,
    isLoading: historyQuery.isLoading || rateQuery.isLoading,
  };
}
