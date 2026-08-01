import {
  attachPaymentDates,
  computeReceivedDividends,
  totalReceived,
  totalTax,
} from '@/domain';
import { findAsset } from '@/services';

import { useDividendEvents, useDividendPayments } from './queries';
import { useAdjustedTransactions } from './useAdjustedTransactions';

const classOf = (ticker: string) => findAsset(ticker)?.assetClass ?? null;

export function usePortfolioDividends(portfolioId: string) {
  const { transactions: all, isLoading } = useAdjustedTransactions();
  const eventsQuery = useDividendEvents();
  const paymentsQuery = useDividendPayments();

  const transactions = all.filter((tx) => tx.portfolioId === portfolioId);
  const events = attachPaymentDates(
    eventsQuery.data ?? [],
    paymentsQuery.data ?? [],
  );
  const received = computeReceivedDividends(transactions, events, classOf);

  return {
    received,
    total: totalReceived(received),
    tax: totalTax(received),
    isLoading: isLoading || eventsQuery.isLoading || paymentsQuery.isLoading,
  };
}
