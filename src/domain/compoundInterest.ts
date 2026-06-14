export type CompoundRow = {
  month: number;
  interest: number;
  invested: number;
  totalInterest: number;
  balance: number;
};

export type CompoundSchedule = {
  rows: CompoundRow[];
  balance: number;
  invested: number;
  totalInterest: number;
};

export function toMonthlyRate(
  ratePercent: number,
  period: 'yearly' | 'monthly',
): number {
  return period === 'yearly' ? (1 + ratePercent) ** (1 / 12) - 1 : ratePercent;
}

export function buildCompoundSchedule(params: {
  initialAmount: number;
  monthlyAmount: number;
  monthlyRate: number;
  months: number;
}): CompoundSchedule {
  const { initialAmount, monthlyAmount, monthlyRate, months } = params;

  const rows: CompoundRow[] = [];
  let balance = initialAmount;
  let invested = initialAmount;
  let totalInterest = 0;

  for (let month = 0; month < months; month++) {
    const interest = balance * monthlyRate;
    totalInterest += interest;
    balance += interest;
    rows.push({ month, interest, invested, totalInterest, balance });
    balance += monthlyAmount;
    invested += monthlyAmount;
  }

  return { rows, balance, invested, totalInterest };
}
