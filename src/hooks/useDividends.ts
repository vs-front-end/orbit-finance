import {
  buildPositions,
  computeReceivedDividends,
  makeFxLookup,
  projectPendingDividends,
  totalPending,
  totalReceived,
  totalsInBRL,
  totalTax,
} from '@/domain';
import { findAsset } from '@/services';

import {
  useAllTransactions,
  useDividendEvents,
  usePortfolios,
  useTransactions,
  useUsdBrlSeries,
} from './queries';

const classOf = (ticker: string) => findAsset(ticker)?.assetClass ?? null;

export function usePortfolioDividends(portfolioId: string) {
  const transactionsQuery = useTransactions(portfolioId);
  const transactions = transactionsQuery.data ?? [];
  const tickers = [...new Set(transactions.map((tx) => tx.ticker))];
  const eventsQuery = useDividendEvents(tickers);

  const received = computeReceivedDividends(
    transactions,
    eventsQuery.data ?? [],
    classOf,
  );

  return {
    received,
    total: totalReceived(received),
    tax: totalTax(received),
    isLoading:
      transactionsQuery.isLoading ||
      (tickers.length > 0 && eventsQuery.isLoading),
  };
}

export type PortfolioDividendTotal = {
  portfolioId: string;
  name: string;
  currency: 'BRL' | 'USD';
  total: number;
  totalBRL: number;
  taxBRL: number;
};

export function useDividendsOverview() {
  const portfoliosQuery = usePortfolios();
  const transactionsQuery = useAllTransactions();
  const fxQuery = useUsdBrlSeries();

  const transactions = transactionsQuery.data ?? [];
  const tickers = [...new Set(transactions.map((tx) => tx.ticker))];
  const eventsQuery = useDividendEvents(tickers);

  const events = eventsQuery.data ?? [];
  const usdToBrlAt = makeFxLookup(fxQuery.data ?? []);

  const perPortfolio: PortfolioDividendTotal[] = (portfoliosQuery.data ?? [])
    .filter((portfolio) => portfolio.kind === 'investment')
    .map((portfolio) => {
      const own = transactions.filter((tx) => tx.portfolioId === portfolio.id);
      const received = computeReceivedDividends(own, events, classOf);
      const brlRateOf = portfolio.currency === 'USD' ? usdToBrlAt : () => 1;
      const { receivedBRL, taxBRL } = totalsInBRL(received, brlRateOf);
      return {
        portfolioId: portfolio.id,
        name: portfolio.name,
        currency: portfolio.currency,
        total: totalReceived(received),
        totalBRL: receivedBRL,
        taxBRL,
      };
    })
    .filter((entry) => entry.total > 0)
    .sort((a, b) => b.totalBRL - a.totalBRL);

  const totalBRL = perPortfolio.reduce((sum, entry) => sum + entry.totalBRL, 0);
  const taxBRL = perPortfolio.reduce((sum, entry) => sum + entry.taxBRL, 0);

  return {
    perPortfolio,
    totalBRL,
    taxBRL,
    isLoading:
      portfoliosQuery.isLoading ||
      transactionsQuery.isLoading ||
      fxQuery.isLoading ||
      (tickers.length > 0 && eventsQuery.isLoading),
  };
}

export type DividendsForecast = {
  receivedBRL: number;
  pendingBRL: number;
  expectedBRL: number;
  totalReceivedBRL: number;
  monthlyAverageBRL: number;
  isLoading: boolean;
};

function monthsSince(firstExDate: string | null, today: string): number {
  if (!firstExDate) return 0;
  const [fy, fm] = firstExDate.split('-').map(Number);
  const [ty, tm] = today.split('-').map(Number);
  return (ty - fy) * 12 + (tm - fm) + 1;
}

export function useDividendsForecast(): DividendsForecast {
  const portfoliosQuery = usePortfolios();
  const transactionsQuery = useAllTransactions();
  const fxQuery = useUsdBrlSeries();

  const transactions = transactionsQuery.data ?? [];
  const tickers = [...new Set(transactions.map((tx) => tx.ticker))];
  const eventsQuery = useDividendEvents(tickers);

  const events = eventsQuery.data ?? [];
  const usdToBrlAt = makeFxLookup(fxQuery.data ?? []);

  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = today.slice(0, 7);

  let receivedBRL = 0;
  let pendingBRL = 0;
  let totalReceivedBRL = 0;
  let firstExDate: string | null = null;

  for (const portfolio of portfoliosQuery.data ?? []) {
    if (portfolio.kind !== 'investment') continue;

    const own = transactions.filter((tx) => tx.portfolioId === portfolio.id);
    const received = computeReceivedDividends(own, events, classOf);
    const brlRateOf = portfolio.currency === 'USD' ? usdToBrlAt : () => 1;

    totalReceivedBRL += totalsInBRL(received, brlRateOf).receivedBRL;

    const thisMonth = received.filter(
      (d) => d.exDate.slice(0, 7) === currentMonth,
    );
    receivedBRL += totalsInBRL(thisMonth, brlRateOf).receivedBRL;

    for (const dividend of received) {
      if (!firstExDate || dividend.exDate < firstExDate) {
        firstExDate = dividend.exDate;
      }
    }

    const positions = buildPositions(own);
    const pending = projectPendingDividends(events, positions, classOf, today);
    pendingBRL += totalPending(pending) * brlRateOf(today);
  }

  const months = monthsSince(firstExDate, today);

  return {
    receivedBRL,
    pendingBRL,
    expectedBRL: receivedBRL + pendingBRL,
    totalReceivedBRL,
    monthlyAverageBRL: months > 0 ? totalReceivedBRL / months : 0,
    isLoading:
      portfoliosQuery.isLoading ||
      transactionsQuery.isLoading ||
      fxQuery.isLoading ||
      (tickers.length > 0 && eventsQuery.isLoading),
  };
}
