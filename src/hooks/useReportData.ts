import {
  buildPositions,
  computeRealizedPL,
  computeReceivedDividends,
  makeFxLookup,
  projectPendingDividends,
  totalPending,
  type Currency,
  type PositionView,
} from '@/domain';
import { findAsset } from '@/services';

import { useDashboardData } from './useDashboardData';
import {
  useAllTransactions,
  useDividendEvents,
  usePortfolios,
  useUsdBrlRate,
  useUsdBrlSeries,
} from './queries';

const classOf = (ticker: string) => findAsset(ticker)?.assetClass ?? null;

const MONTHS_WINDOW = 12;

export type PositionMover = {
  view: PositionView;
  currency: Currency;
  portfolioName: string;
};

export type MonthlyDividend = { ym: string; valueBRL: number };
export type AssetDividend = { ticker: string; valueBRL: number };

function lastMonths(count: number, today: string): string[] {
  const [year, month] = today.slice(0, 7).split('-').map(Number);
  const result: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    result.push(
      new Date(Date.UTC(year, month - 1 - i, 1)).toISOString().slice(0, 7),
    );
  }
  return result;
}

function monthsSince(firstExDate: string | null, today: string): number {
  if (!firstExDate) return 0;
  const [fromYear, fromMonth] = firstExDate.split('-').map(Number);
  const [toYear, toMonth] = today.split('-').map(Number);
  return (toYear - fromYear) * 12 + (toMonth - fromMonth) + 1;
}

export function useReportData() {
  const dashboard = useDashboardData();
  const portfoliosQuery = usePortfolios();
  const transactionsQuery = useAllTransactions();
  const rateQuery = useUsdBrlRate();
  const fxQuery = useUsdBrlSeries();

  const transactions = transactionsQuery.data ?? [];
  const tickers = [...new Set(transactions.map((tx) => tx.ticker))];
  const eventsQuery = useDividendEvents(tickers);
  const events = eventsQuery.data ?? [];

  const rate = rateQuery.data ?? 0;
  const usdToBrlAt = makeFxLookup(fxQuery.data ?? []);
  const today = new Date().toISOString().slice(0, 10);

  const investmentPortfolios = (portfoliosQuery.data ?? []).filter(
    (portfolio) => portfolio.kind === 'investment',
  );

  const movers: PositionMover[] = dashboard.perPortfolio
    .flatMap(({ portfolio, views }) =>
      views
        .filter((view) => view.quote !== null)
        .map((view) => ({
          view,
          currency: portfolio.currency,
          portfolioName: portfolio.name,
        })),
    )
    .sort((a, b) => b.view.netPLPercent - a.view.netPLPercent);

  const gainers = movers.filter((mover) => mover.view.netPL > 0).slice(0, 5);
  const losers = movers
    .filter((mover) => mover.view.netPL < 0)
    .sort((a, b) => a.view.netPLPercent - b.view.netPLPercent)
    .slice(0, 5);

  let realizedBRL = 0;
  let receivedBRL = 0;
  let taxBRL = 0;
  let pendingBRL = 0;
  let firstExDate: string | null = null;
  const monthMap = new Map<string, number>();
  const assetMap = new Map<string, number>();

  for (const portfolio of investmentPortfolios) {
    const own = transactions.filter((tx) => tx.portfolioId === portfolio.id);
    const isUsd = portfolio.currency === 'USD';
    const rateAt = isUsd ? usdToBrlAt : () => 1;

    realizedBRL += computeRealizedPL(own) * (isUsd ? rate : 1);

    const received = computeReceivedDividends(own, events, classOf);
    for (const dividend of received) {
      const fx = rateAt(dividend.exDate);
      const ym = dividend.exDate.slice(0, 7);
      if (!firstExDate || dividend.exDate < firstExDate) {
        firstExDate = dividend.exDate;
      }
      receivedBRL += dividend.received * fx;
      taxBRL += dividend.tax * fx;
      monthMap.set(ym, (monthMap.get(ym) ?? 0) + dividend.received * fx);
      assetMap.set(
        dividend.ticker,
        (assetMap.get(dividend.ticker) ?? 0) + dividend.received * fx,
      );
    }

    const pending = projectPendingDividends(
      events,
      buildPositions(own),
      classOf,
      today,
    );
    pendingBRL += totalPending(pending) * (isUsd ? rate : 1);
  }

  const monthly: MonthlyDividend[] = lastMonths(MONTHS_WINDOW, today).map(
    (ym) => ({
      ym,
      valueBRL: monthMap.get(ym) ?? 0,
    }),
  );
  const last12mBRL = monthly.reduce((sum, month) => sum + month.valueBRL, 0);
  const byAsset: AssetDividend[] = [...assetMap.entries()]
    .map(([ticker, valueBRL]) => ({ ticker, valueBRL }))
    .sort((a, b) => b.valueBRL - a.valueBRL);

  const invested = dashboard.consolidated.investedValue;
  const unrealizedBRL = dashboard.consolidated.netPL;
  const totalReturnBRL = unrealizedBRL + receivedBRL;
  const monthsActive = monthsSince(firstExDate, today);
  const monthlyAverageBRL = monthsActive > 0 ? receivedBRL / monthsActive : 0;

  return {
    consolidated: dashboard.consolidated,
    hasPositions: dashboard.perPortfolio.some(({ views }) => views.length > 0),
    isFetchingQuotes: dashboard.isFetchingQuotes,
    quotesUpdatedAt: dashboard.quotesUpdatedAt,
    refetchQuotes: dashboard.refetchQuotes,
    gainers,
    losers,
    realizedBRL,
    unrealizedBRL,
    invested,
    marketValue: dashboard.consolidated.marketValue,
    totalReturnBRL,
    totalReturnPercent: invested > 0 ? (totalReturnBRL / invested) * 100 : 0,
    dividends: {
      totalBRL: receivedBRL,
      taxBRL,
      pendingBRL,
      monthlyAverageBRL,
      yieldOnCost: invested > 0 ? (last12mBRL / invested) * 100 : 0,
      monthly,
      byAsset,
    },
    isLoading:
      dashboard.isLoading ||
      portfoliosQuery.isLoading ||
      transactionsQuery.isLoading ||
      rateQuery.isLoading ||
      fxQuery.isLoading ||
      (tickers.length > 0 && eventsQuery.isLoading),
  };
}
