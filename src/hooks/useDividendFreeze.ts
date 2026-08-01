import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import {
  attachPaymentDates,
  computeReceivedDividends,
  dividendId,
  pendingFreeze,
  type StoredDividend,
} from '@/domain';
import { findAsset, ledgerService } from '@/services';

import {
  queryKeys,
  useDividendEvents,
  useDividendPayments,
  useMarketDataEnabled,
  usePortfolios,
  useStoredDividends,
} from './queries';
import { useAdjustedTransactions } from './useAdjustedTransactions';

const classOf = (ticker: string) => findAsset(ticker)?.assetClass ?? null;

export function useDividendFreeze() {
  const queryClient = useQueryClient();
  const portfoliosQuery = usePortfolios();
  const { transactions, isLoading: transactionsLoading } =
    useAdjustedTransactions();
  const eventsQuery = useDividendEvents();
  const paymentsQuery = useDividendPayments();
  const ledgerQuery = useStoredDividends();
  const marketDataEnabled = useMarketDataEnabled();
  const attempted = useRef(new Set<string>());

  const ready =
    !portfoliosQuery.isLoading &&
    !transactionsLoading &&
    (!marketDataEnabled ||
      (eventsQuery.isSuccess && paymentsQuery.isSuccess)) &&
    ledgerQuery.isSuccess;

  const portfolios = portfoliosQuery.data ?? [];
  const stored = ledgerQuery.data ?? [];
  const today = new Date().toISOString().slice(0, 10);

  const rows: StoredDividend[] = [];

  if (ready) {
    const events = attachPaymentDates(
      eventsQuery.data ?? [],
      paymentsQuery.data ?? [],
    );

    for (const portfolio of portfolios) {
      const own = transactions.filter((tx) => tx.portfolioId === portfolio.id);
      const computed = computeReceivedDividends(own, events, classOf);
      const ownStored = stored.filter(
        (entry) => entry.portfolioId === portfolio.id,
      );

      for (const dividend of pendingFreeze(
        portfolio.id,
        computed,
        ownStored,
        today,
      )) {
        rows.push({
          id: dividendId(portfolio.id, dividend.ticker, dividend.exDate),
          portfolioId: portfolio.id,
          ticker: dividend.ticker,
          exDate: dividend.exDate,
          paymentDate: dividend.paymentDate,
          label: dividend.label,
          amountPerShare: dividend.amountPerShare,
          quantity: dividend.quantity,
          gross: dividend.gross,
          tax: dividend.tax,
          received: dividend.received,
          currency: portfolio.currency,
          estimatedPayment: dividend.estimatedPayment,
          editedManually: false,
        });
      }
    }
  }

  const pendingIds = rows.map((row) => row.id).join('|');

  useEffect(() => {
    if (!ready || rows.length === 0) return;
    if (attempted.current.has(pendingIds)) return;

    attempted.current.add(pendingIds);

    ledgerService
      .freeze(rows)
      .then(() => queryClient.invalidateQueries({ queryKey: queryKeys.ledger }))
      .catch(() => attempted.current.delete(pendingIds));
  }, [ready, pendingIds]);
}
