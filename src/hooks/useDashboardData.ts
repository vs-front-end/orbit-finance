import { useEffect } from 'react';

import { makeFxLookup, summarizePositions, type Quote } from '@/domain';
import { historyService } from '@/services';

import {
  usePortfolios,
  useQuotes,
  useUsdBrlRate,
  useUsdBrlSeries,
} from './queries';
import { useAdjustedTransactions } from './useAdjustedTransactions';
import { buildPositionViews } from './usePositionViews';

function convertQuotes(quotes: Quote[] | undefined, rate: number): Quote[] {
  return (quotes ?? []).map((quote) => ({
    ...quote,
    price: quote.price * rate,
    previousClose: quote.previousClose * rate,
  }));
}

export function useDashboardData() {
  const portfoliosQuery = usePortfolios();
  const { transactions, isLoading: transactionsLoading } =
    useAdjustedTransactions();
  const quotesQuery = useQuotes();
  const rateQuery = useUsdBrlRate();
  const fxQuery = useUsdBrlSeries();

  const rate = rateQuery.data ?? 0;
  const fxSeries = fxQuery.data ?? [];
  const usdToBrlAt = makeFxLookup(fxSeries);

  const portfolios = portfoliosQuery.data ?? [];

  const perPortfolio = portfolios.map((portfolio) => {
    const own = transactions.filter((tx) => tx.portfolioId === portfolio.id);
    const views = buildPositionViews(own, quotesQuery.data);
    const isUsd = portfolio.currency === 'USD';

    // Custo pelo câmbio da data da compra, mercado pelo câmbio de hoje. Sem
    // série de câmbio ainda, o dólar atual é a melhor aproximação.
    const rateAt =
      isUsd && fxSeries.length > 0 ? usdToBrlAt : () => (isUsd ? rate : 1);

    const viewsBRL = buildPositionViews(
      own,
      convertQuotes(quotesQuery.data, isUsd ? rate : 1),
      (tx) => tx.unitPrice * rateAt(tx.executedAt.slice(0, 10)),
    );

    return {
      portfolio,
      views,
      summary: summarizePositions(views),
      summaryBRL: summarizePositions(viewsBRL),
    };
  });

  const dataReady =
    !portfoliosQuery.isLoading && !transactionsLoading && quotesQuery.isSuccess;

  useEffect(() => {
    if (!dataReady) return;

    const flag = `orbit.snapshot.${new Date().toISOString().slice(0, 10)}`;
    if (localStorage.getItem(flag)) return;

    const positioned = perPortfolio.filter(({ views }) => views.length > 0);
    const allQuotesReady = positioned.every(({ views }) =>
      views.every((view) => view.quote !== null),
    );
    const entries = positioned
      .filter(
        ({ summary, views }) =>
          summary.marketValue > 0 && views.every((view) => view.quote !== null),
      )
      .map(({ portfolio, summary }) => ({
        portfolioId: portfolio.id,
        value: summary.marketValue,
        currency: portfolio.currency,
      }));

    if (entries.length === 0) return;

    if (allQuotesReady) localStorage.setItem(flag, '1');
    historyService
      .recordSnapshot(entries)
      .catch(() => localStorage.removeItem(flag));
  }, [dataReady, quotesQuery.dataUpdatedAt]);

  const totals = perPortfolio.reduce(
    (acc, { summaryBRL }) => ({
      marketValue: acc.marketValue + summaryBRL.marketValue,
      investedValue: acc.investedValue + summaryBRL.investedValue,
      dailyPL: acc.dailyPL + summaryBRL.dailyPL,
      netPL: acc.netPL + summaryBRL.netPL,
      gains: acc.gains + summaryBRL.gains,
      losses: acc.losses + summaryBRL.losses,
      missingQuotes: acc.missingQuotes + summaryBRL.missingQuotes,
    }),
    {
      marketValue: 0,
      investedValue: 0,
      dailyPL: 0,
      netPL: 0,
      gains: 0,
      losses: 0,
      missingQuotes: 0,
    },
  );

  const previousValue = totals.marketValue - totals.dailyPL;

  const consolidated = {
    ...totals,
    dailyPLPercent:
      previousValue > 0 ? (totals.dailyPL / previousValue) * 100 : 0,
    netPLPercent:
      totals.investedValue > 0
        ? (totals.netPL / totals.investedValue) * 100
        : 0,
  };

  return {
    perPortfolio,
    consolidated,
    usdBrlRate: rate,
    isLoading:
      portfoliosQuery.isLoading ||
      transactionsLoading ||
      rateQuery.isLoading ||
      quotesQuery.isLoading,
    isFetchingQuotes: quotesQuery.isFetching,
    quotesUpdatedAt: quotesQuery.dataUpdatedAt,
    refetchQuotes: quotesQuery.refetch,
  };
}
