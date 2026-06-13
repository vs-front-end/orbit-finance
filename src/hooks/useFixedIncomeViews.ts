import {
  buildFixedIncomeView,
  type FixedIncomeView,
  type PLSummary,
} from '@/domain';

import { useFixedIncomes } from './queries';

export type FixedIncomeTotals = {
  principal: number;
  grossValue: number;
  dailyPL: number;
};

export function sumFixedIncomeViews(
  views: FixedIncomeView[],
): FixedIncomeTotals {
  return views.reduce(
    (acc, view) => ({
      principal: acc.principal + view.principal,
      grossValue: acc.grossValue + view.grossValue,
      dailyPL: acc.dailyPL + view.dailyPL,
    }),
    { principal: 0, grossValue: 0, dailyPL: 0 },
  );
}

export function combineSummaryWithFixed(
  summary: PLSummary,
  fixed: FixedIncomeTotals,
): PLSummary {
  const marketValue = summary.marketValue + fixed.grossValue;
  const investedValue = summary.investedValue + fixed.principal;
  const dailyPL = summary.dailyPL + fixed.dailyPL;
  const netPL = marketValue - investedValue;
  const fixedNet = fixed.grossValue - fixed.principal;
  const previousValue = marketValue - dailyPL;

  return {
    marketValue,
    investedValue,
    dailyPL,
    dailyPLPercent: previousValue > 0 ? (dailyPL / previousValue) * 100 : 0,
    netPL,
    netPLPercent: investedValue > 0 ? (netPL / investedValue) * 100 : 0,
    gains: summary.gains + Math.max(0, fixedNet),
    losses: summary.losses + Math.min(0, fixedNet),
  };
}

export function useFixedIncomeViews(portfolioId: string) {
  const fixedIncomesQuery = useFixedIncomes(portfolioId);

  const views = (fixedIncomesQuery.data ?? []).map((item) =>
    buildFixedIncomeView(item),
  );

  return {
    views,
    totals: sumFixedIncomeViews(views),
    isLoading: fixedIncomesQuery.isLoading,
  };
}
