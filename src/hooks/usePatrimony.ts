import {
  isFinancial,
  valuePatrimonyItem,
  type PatrimonyValuation,
} from '@/domain';

import { useCdiSeries, usePatrimonyItems } from './queries';

export type PatrimonyOverview = {
  financial: PatrimonyValuation[];
  assets: PatrimonyValuation[];
  financialTotal: number;
  assetsTotal: number;
  isLoading: boolean;
};

const sumCurrent = (items: PatrimonyValuation[]) =>
  items.reduce((total, item) => total + item.current, 0);

export function usePatrimony(): PatrimonyOverview {
  const itemsQuery = usePatrimonyItems();
  const items = itemsQuery.data ?? [];

  const reserveDates = items
    .filter((item) => item.kind === 'reserve' && item.referenceDate)
    .map((item) => item.referenceDate as string)
    .sort();
  const since = reserveDates[0] ?? null;

  const cdiQuery = useCdiSeries(since);
  const series = cdiQuery.data ?? [];
  const today = new Date().toISOString().slice(0, 10);

  const valued = items.map((item) => valuePatrimonyItem(item, series, today));
  const financial = valued.filter((item) => isFinancial(item.kind));
  const assets = valued.filter((item) => !isFinancial(item.kind));

  return {
    financial,
    assets,
    financialTotal: sumCurrent(financial),
    assetsTotal: sumCurrent(assets),
    isLoading: itemsQuery.isLoading || (since !== null && cdiQuery.isLoading),
  };
}
