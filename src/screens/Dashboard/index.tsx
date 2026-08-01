import { useState } from 'react';

import { useDashboardHistory, useDashboardOverview } from '@/hooks';

import { DashboardEmptyState } from './components/DashboardEmptyState';
import { DashboardEvolution } from './components/DashboardEvolution';
import { DashboardHeader } from './components/DashboardHeader';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { DashboardSummary } from './components/DashboardSummary';
import { PortfolioCard } from './PortfolioCard';

export function Dashboard() {
  const [period, setPeriod] = useState('90');
  const data = useDashboardOverview();
  const history = useDashboardHistory(Number(period));

  if (data.isLoading || history.isLoading) return <DashboardSkeleton />;
  if (data.perPortfolio.length === 0) return <DashboardEmptyState />;

  return (
    <div className='flex flex-col gap-3 sm:gap-4'>
      <DashboardHeader
        updatedAt={data.quotesUpdatedAt}
        isFetching={data.isFetchingQuotes}
        onRefresh={() => void data.refetchQuotes()}
      />
      <DashboardSummary
        consolidated={data.consolidated}
        estimatedMonthlyDividends={data.dividends.estimatedMonthlyBRL}
        totalDividends={data.dividends.totalBRL}
        totalPL={data.totalPLBRL}
      />

      <div className='grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-4'>
        {data.perPortfolio.map(({ portfolio, summary }) => (
          <PortfolioCard
            key={portfolio.id}
            portfolio={portfolio}
            summary={summary}
          />
        ))}
      </div>

      <DashboardEvolution
        period={period}
        onPeriodChange={setPeriod}
        hasHistory={history.hasHistory}
        consolidatedSeries={history.consolidatedSeries}
        portfolioSeries={history.portfolioSeries}
      />
    </div>
  );
}
