import { adjustForSplits } from '@/domain';

import { useAllTransactions, useSplits } from './queries';

// Base única de transações do app, já normalizada por desdobramento. Cada tela
// filtra o recorte que precisa em vez de abrir uma query própria.
export function useAdjustedTransactions() {
  const transactionsQuery = useAllTransactions();
  const splitsQuery = useSplits();

  return {
    transactions: adjustForSplits(
      transactionsQuery.data ?? [],
      splitsQuery.data ?? [],
    ),
    isLoading: transactionsQuery.isLoading || splitsQuery.isLoading,
  };
}
