export type ReturnPoint = { t: number; value: number };
export type CashFlow = { t: number; amount: number };

export function timeWeightedReturn(
  points: ReturnPoint[],
  flows: CashFlow[],
): number | null {
  if (points.length < 2) return null;

  const sortedPoints = [...points].sort((a, b) => a.t - b.t);
  const sortedFlows = [...flows].sort((a, b) => a.t - b.t);

  let factor = 1;
  let measured = false;

  for (let i = 1; i < sortedPoints.length; i++) {
    const start = sortedPoints[i - 1];
    const end = sortedPoints[i];
    const flow = sortedFlows
      .filter((f) => f.t > start.t && f.t <= end.t)
      .reduce((sum, f) => sum + f.amount, 0);
    const invested = start.value + flow;
    if (invested <= 0) continue;
    factor *= end.value / invested;
    measured = true;
  }

  return measured ? (factor - 1) * 100 : null;
}
