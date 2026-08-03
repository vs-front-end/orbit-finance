import {
  attachPaymentDates,
  averageMonthlyReceived,
  computeReceivedDividends,
  makeFxLookup,
  mergeLedger,
  monthlyReceivedSeries,
  splitByPayment,
  topDividendPayers,
  type DividendPayer,
  type MonthlyDividend,
} from '@/domain';
import { findAsset } from '@/services';

import { useDashboardData } from './useDashboardData';
import {
  isAwaiting,
  useDividendEvents,
  useDividendPayments,
  useMarketDataEnabled,
  usePortfolios,
  useStoredDividends,
  useUsdBrlRate,
  useUsdBrlSeries,
} from './queries';
import { useAdjustedTransactions } from './useAdjustedTransactions';
import { useDividendFreeze } from './useDividendFreeze';

const classOf = (ticker: string) => findAsset(ticker)?.assetClass ?? null;

export type DashboardMover = {
  ticker: string;
  netPLPercent: number;
  netPL: number;
};

export type DashboardDividendsInsight = {
  totalBRL: number;
  announcedBRL: number;
  pendingBRL: number;
  estimatedMonthlyBRL: number;
  monthlyAverageBRL: number;
  monthlySeries: MonthlyDividend[];
  topPayers: DividendPayer[];
};

function rankMovers(
  rows: Array<{
    ticker: string;
    netPL: number;
    investedValue: number;
    hasQuote: boolean;
  }>,
): DashboardMover[] {
  const byTicker = new Map<string, { netPL: number; investedValue: number }>();

  for (const row of rows) {
    if (!row.hasQuote) continue;

    const current = byTicker.get(row.ticker) ?? {
      netPL: 0,
      investedValue: 0,
    };
    current.netPL += row.netPL;
    current.investedValue += row.investedValue;
    byTicker.set(row.ticker, current);
  }

  return [...byTicker.entries()]
    .map(([ticker, entry]) => ({
      ticker,
      netPL: entry.netPL,
      netPLPercent:
        entry.investedValue > 0 ? (entry.netPL / entry.investedValue) * 100 : 0,
    }))
    .filter((entry) => entry.netPL !== 0)
    .sort((a, b) => b.netPLPercent - a.netPLPercent);
}

export function useDashboardOverview() {
  const dashboard = useDashboardData();
  const portfoliosQuery = usePortfolios();
  const rateQuery = useUsdBrlRate();
  const fxQuery = useUsdBrlSeries();
  const marketDataEnabled = useMarketDataEnabled();

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
  const currentMonth = today.slice(0, 7);

  const investmentPortfolios = portfoliosQuery.data ?? [];

  let receivedBRL = 0;
  let announcedBRL = 0;
  let monthBRL = 0;
  const paidBRL: Array<{
    ticker: string;
    paymentDate: string;
    received: number;
  }> = [];

  for (const portfolio of investmentPortfolios) {
    const ownTransactions = transactions.filter(
      (transaction) => transaction.portfolioId === portfolio.id,
    );
    const isUsd = portfolio.currency === 'USD';
    const rateAt =
      isUsd && fxSeries.length > 0 ? usdToBrlAt : () => (isUsd ? rate : 1);

    const merged = mergeLedger(
      portfolio.id,
      computeReceivedDividends(ownTransactions, events, classOf),
      (ledgerQuery.data ?? []).filter(
        (entry) => entry.portfolioId === portfolio.id,
      ),
    );
    const { paid, pending: unpaid } = splitByPayment(merged, today);

    if (!isUsd) {
      for (const dividend of paid) {
        receivedBRL += dividend.received;
        paidBRL.push({
          ticker: dividend.ticker,
          paymentDate: dividend.paymentDate,
          received: dividend.received,
        });
      }

      for (const dividend of merged) {
        if (dividend.paymentDate.slice(0, 7) === currentMonth) {
          monthBRL += dividend.received;
        }
      }
    }

    for (const dividend of unpaid) {
      announcedBRL += dividend.received * rateAt(dividend.paymentDate);
    }
  }

  const movers = rankMovers(
    dashboard.perPortfolio.flatMap(({ viewsBRL }) =>
      viewsBRL.map((view) => ({
        ticker: view.ticker,
        netPL: view.netPL,
        investedValue: view.investedValue,
        hasQuote: view.hasQuote,
      })),
    ),
  );

  const dividends: DashboardDividendsInsight = {
    totalBRL: receivedBRL,
    announcedBRL,
    pendingBRL: 0,
    estimatedMonthlyBRL: monthBRL,
    monthlyAverageBRL: averageMonthlyReceived(paidBRL, today),
    monthlySeries: monthlyReceivedSeries(paidBRL, today),
    topPayers: topDividendPayers(paidBRL),
  };

  return {
    ...dashboard,
    dividends,
    movers,
    topGainers: movers.filter((mover) => mover.netPLPercent > 0).slice(0, 5),
    topLosers: movers
      .filter((mover) => mover.netPLPercent < 0)
      .reverse()
      .slice(0, 5),
    isFetchingQuotes:
      dashboard.isFetchingQuotes ||
      eventsQuery.isFetching ||
      paymentsQuery.isFetching,
    refetchQuotes: async () => {
      await Promise.all([
        dashboard.refetchQuotes(),
        eventsQuery.refetch(),
        paymentsQuery.refetch(),
      ]);
    },
    isLoading:
      dashboard.isLoading ||
      portfoliosQuery.isLoading ||
      transactionsLoading ||
      rateQuery.isLoading ||
      fxQuery.isLoading ||
      isAwaiting(eventsQuery, marketDataEnabled) ||
      isAwaiting(paymentsQuery, marketDataEnabled) ||
      ledgerQuery.isLoading,
  };
}
