export type RebalanceWeights = { valueBRL: number; targetPercent: number };

export type RebalanceComputed = {
  currentPercent: number;
  targetValue: number;
  diff: number;
};

export type RebalancePlan<T extends RebalanceWeights> = {
  currentTotal: number;
  plannedTotal: number;
  targetSum: number;
  rows: (T & RebalanceComputed)[];
};

export function buildRebalancePlan<T extends RebalanceWeights>(
  items: T[],
  extraContribution: number,
): RebalancePlan<T> {
  const currentTotal = items.reduce((sum, item) => sum + item.valueBRL, 0);
  const plannedTotal = currentTotal + extraContribution;
  const targetSum = items.reduce((sum, item) => sum + item.targetPercent, 0);

  const rows = items.map((item) => {
    const targetValue = (item.targetPercent / 100) * plannedTotal;
    return {
      ...item,
      currentPercent:
        currentTotal > 0 ? (item.valueBRL / currentTotal) * 100 : 0,
      targetValue,
      diff: targetValue - item.valueBRL,
    };
  });

  return { currentTotal, plannedTotal, targetSum, rows };
}
