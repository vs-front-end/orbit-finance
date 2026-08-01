import { adjustForSplits } from '@/domain';

import {
  isAwaiting,
  useAllTransactions,
  useAssets,
  useMarketDataEnabled,
  useSplits,
} from './queries';

// Base única de transações do app, já normalizada por desdobramento. Cada tela
// filtra o recorte que precisa em vez de abrir uma query própria.
export function useAdjustedTransactions() {
  const assetsQuery = useAssets();
  const transactionsQuery = useAllTransactions();
  const splitsQuery = useSplits();
  const marketDataEnabled = useMarketDataEnabled();

  return {
    transactions: adjustForSplits(
      transactionsQuery.data ?? [],
      splitsQuery.data ?? [],
    ),
    isLoading:
      assetsQuery.isLoading ||
      transactionsQuery.isLoading ||
      isAwaiting(splitsQuery, marketDataEnabled),
  };
}
