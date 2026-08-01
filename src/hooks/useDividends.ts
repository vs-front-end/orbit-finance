import {
  attachPaymentDates,
  computeReceivedDividends,
  mergeLedger,
  splitByPayment,
  type LedgerDividend,
} from '@/domain';
import { findAsset } from '@/services';

import {
  useDividendEvents,
  useDividendPayments,
  useStoredDividends,
} from './queries';
import { useAdjustedTransactions } from './useAdjustedTransactions';

const classOf = (ticker: string) => findAsset(ticker)?.assetClass ?? null;

function sum(
  entries: LedgerDividend[],
  valueOf: (entry: LedgerDividend) => number,
): number {
  return entries.reduce((total, entry) => total + valueOf(entry), 0);
}

export function usePortfolioDividends(portfolioId: string) {
  const { transactions: all, isLoading } = useAdjustedTransactions();
  const eventsQuery = useDividendEvents();
  const paymentsQuery = useDividendPayments();
  const ledgerQuery = useStoredDividends();

  const transactions = all.filter((tx) => tx.portfolioId === portfolioId);
  const events = attachPaymentDates(
    eventsQuery.data ?? [],
    paymentsQuery.data ?? [],
  );
  const computed = computeReceivedDividends(transactions, events, classOf);
  const stored = (ledgerQuery.data ?? []).filter(
    (entry) => entry.portfolioId === portfolioId,
  );

  const entries = mergeLedger(portfolioId, computed, stored);
  const today = new Date().toISOString().slice(0, 10);
  const { paid, pending } = splitByPayment(entries, today);

  return {
    entries,
    paid,
    pending,
    total: sum(paid, (entry) => entry.received),
    pendingTotal: sum(pending, (entry) => entry.received),
    tax: sum(paid, (entry) => entry.tax),
    isLoading:
      isLoading ||
      eventsQuery.isLoading ||
      paymentsQuery.isLoading ||
      ledgerQuery.isLoading,
  };
}
