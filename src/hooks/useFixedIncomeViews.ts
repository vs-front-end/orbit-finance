import { buildFixedIncomeView, sumFixedIncomeViews } from '@/domain';

import { useFixedIncomes } from './queries';

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
