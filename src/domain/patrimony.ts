import type { PatrimonyItem, PatrimonyKind } from './types';

export type CdiRatePoint = { date: string; daily: number };

export type PatrimonyValuation = PatrimonyItem & {
  current: number;
  gain: number;
};

export function isFinancial(kind: PatrimonyKind): boolean {
  return kind === 'cash' || kind === 'reserve';
}

export function accrueCdi(
  principal: number,
  cdiPercent: number,
  series: CdiRatePoint[],
  since: string,
): number {
  return series
    .filter((point) => point.date > since)
    .reduce(
      (value, point) => value * (1 + point.daily * (cdiPercent / 100)),
      principal,
    );
}

function yearsBetween(since: string, today: string): number {
  const ms =
    Date.parse(`${today}T00:00:00Z`) - Date.parse(`${since}T00:00:00Z`);
  return Math.max(0, ms / (365.25 * 24 * 60 * 60 * 1000));
}

function currentValue(
  item: PatrimonyItem,
  series: CdiRatePoint[],
  today: string,
): number {
  const since = item.referenceDate ?? today;

  if (item.kind === 'reserve') {
    return accrueCdi(item.value, item.cdiPercent ?? 0, series, since);
  }
  if (item.kind === 'property') {
    return (
      item.value *
      (1 + (item.annualRate ?? 0) / 100) ** yearsBetween(since, today)
    );
  }
  if (item.kind === 'vehicle') {
    return (
      item.value *
      (1 - (item.annualRate ?? 0) / 100) ** yearsBetween(since, today)
    );
  }
  return item.value;
}

export function valuePatrimonyItem(
  item: PatrimonyItem,
  series: CdiRatePoint[],
  today: string,
): PatrimonyValuation {
  const current = currentValue(item, series, today);
  return { ...item, current, gain: current - item.value };
}
