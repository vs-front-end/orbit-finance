import { z } from 'zod';

import type { Transaction } from './types';

export const splitEventSchema = z.object({
  ticker: z.string(),
  date: z.string(),
  ratio: z.number().positive(),
});

export type SplitEvent = z.infer<typeof splitEventSchema>;

// O Yahoo devolve preço e provento já ajustados por desdobramento. As
// transações guardam o que foi executado na época, então precisam ser
// trazidas para a mesma base antes de qualquer cálculo.
export function adjustForSplits(
  transactions: Transaction[],
  splits: SplitEvent[],
): Transaction[] {
  if (splits.length === 0) return transactions;

  const byTicker = new Map<string, SplitEvent[]>();
  for (const split of splits) {
    const current = byTicker.get(split.ticker) ?? [];
    current.push(split);
    byTicker.set(split.ticker, current);
  }

  return transactions.map((transaction) => {
    const tickerSplits = byTicker.get(transaction.ticker) ?? [];
    const executedOn = transaction.executedAt.slice(0, 10);

    const factor = tickerSplits
      .filter((split) => split.date > executedOn)
      .reduce((total, split) => total * split.ratio, 1);

    if (factor === 1) return transaction;

    return {
      ...transaction,
      quantity: transaction.quantity * factor,
      unitPrice: transaction.unitPrice / factor,
    };
  });
}
