import type { Transaction } from './types';

export function computeRealizedPL(transactions: Transaction[]): number {
  const sorted = [...transactions].sort((a, b) =>
    a.executedAt.localeCompare(b.executedAt),
  );
  const state = new Map<string, { quantity: number; avgPrice: number }>();
  let realized = 0;

  for (const tx of sorted) {
    const current = state.get(tx.ticker) ?? { quantity: 0, avgPrice: 0 };

    if (tx.side === 'buy') {
      const totalCost =
        current.quantity * current.avgPrice + tx.quantity * tx.unitPrice;
      current.quantity += tx.quantity;
      current.avgPrice =
        current.quantity > 0 ? totalCost / current.quantity : 0;
    } else {
      const sold = Math.min(tx.quantity, current.quantity);
      realized += sold * (tx.unitPrice - current.avgPrice);
      current.quantity = Math.max(0, current.quantity - tx.quantity);
    }

    state.set(tx.ticker, current);
  }

  return realized;
}
