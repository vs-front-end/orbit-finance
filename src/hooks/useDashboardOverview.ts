import {
  attachPaymentDates,
  buildPositions,
  computeRealizedEvents,
  computeReceivedDividends,
  makeFxLookup,
  mergeLedger,
  projectPendingDividends,
  splitByPayment,
  totalPending,
} from '@/domain';
import { findAsset } from '@/services';

import { useDashboardData } from './useDashboardData';
import {
  useDividendEvents,
  useDividendPayments,
  usePortfolios,
  useStoredDividends,
  useUsdBrlRate,
  useUsdBrlSeries,
} from './queries';
import { useAdjustedTransactions } from './useAdjustedTransactions';
import { useDividendFreeze } from './useDividendFreeze';

const classOf = (ticker: string) => findAsset(ticker)?.assetClass ?? null;

export function useDashboardOverview() {
  const dashboard = useDashboardData();
  const portfoliosQuery = usePortfolios();
  const rateQuery = useUsdBrlRate();
  const fxQuery = useUsdBrlSeries();

  const { transactions, isLoading: transactionsLoading } =
    useAdjustedTransactions();
  const eventsQuery = useDividendEvents();
  const paymentsQuery = useDividendPayments();
  const ledgerQuery = useStoredDividends();

  useDividendFreeze();

  const events = attachPaymentDates(
    eventsQuery.data ?? [],
    paymentsQuery.data ?? [],
  );
  const rate = rateQuery.data ?? 0;
  const fxSeries = fxQuery.data ?? [];
  const usdToBrlAt = makeFxLookup(fxSeries);
  const today = new Date().toISOString().slice(0, 10);

  const investmentPortfolios = portfoliosQuery.data ?? [];

  let receivedBRL = 0;
  let announcedBRL = 0;
  let realizedBRL = 0;
  let pendingBRL = 0;

  for (const portfolio of investmentPortfolios) {
    const ownTransactions = transactions.filter(
      (transaction) => transaction.portfolioId === portfolio.id,
    );
    const isUsd = portfolio.currency === 'USD';
    const rateAt =
      isUsd && fxSeries.length > 0 ? usdToBrlAt : () => (isUsd ? rate : 1);

    for (const realized of computeRealizedEvents(ownTransactions)) {
      realizedBRL += realized.amount * rateAt(realized.date);
    }

    const merged = mergeLedger(
      portfolio.id,
      computeReceivedDividends(ownTransactions, events, classOf),
      (ledgerQuery.data ?? []).filter(
        (entry) => entry.portfolioId === portfolio.id,
      ),
    );
    const { paid, pending: unpaid } = splitByPayment(merged, today);

    // Câmbio da data do pagamento: é quando o dinheiro virou real de fato.
    for (const dividend of paid) {
      receivedBRL += dividend.received * rateAt(dividend.paymentDate);
    }

    for (const dividend of unpaid) {
      announcedBRL += dividend.received * rateAt(dividend.paymentDate);
    }

    const pending = projectPendingDividends(
      events,
      buildPositions(ownTransactions),
      classOf,
      today,
    );
    pendingBRL += totalPending(pending) * (isUsd ? rate : 1);
  }

  return {
    ...dashboard,
    dividends: {
      totalBRL: receivedBRL,
      announcedBRL,
      pendingBRL,
      estimatedMonthlyBRL: pendingBRL,
    },
    totalPLBRL: dashboard.consolidated.netPL + realizedBRL,
    isFetchingQuotes: dashboard.isFetchingQuotes || eventsQuery.isFetching,
    refetchQuotes: async () => {
      await Promise.all([dashboard.refetchQuotes(), eventsQuery.refetch()]);
    },
    isLoading:
      dashboard.isLoading ||
      portfoliosQuery.isLoading ||
      transactionsLoading ||
      rateQuery.isLoading ||
      fxQuery.isLoading ||
      eventsQuery.isLoading,
  };
}
