import { useState } from 'react';

import { useDashboardHistory, useDashboardOverview } from '@/hooks';

import { NewPortfolioDialog } from '../AppShell/NewPortfolioDialog';
import { DashboardAllocation } from './components/DashboardAllocation';
import { DashboardEmptyState } from './components/DashboardEmptyState';
import { DashboardEvolution } from './components/DashboardEvolution';
import { DashboardHeader } from './components/DashboardHeader';
import { DashboardHighlights } from './components/DashboardHighlights';
import { DashboardProventos } from './components/DashboardProventos';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { DashboardSummary } from './components/DashboardSummary';
import { PortfolioCard } from './PortfolioCard';

export function Dashboard() {
  const [period, setPeriod] = useState('90');
  const [newPortfolioOpen, setNewPortfolioOpen] = useState(false);
  const data = useDashboardOverview();
  const history = useDashboardHistory(Number(period));

  if (data.isLoading || history.isLoading) return <DashboardSkeleton />;
  if (data.perPortfolio.length === 0) return <DashboardEmptyState />;

  return (
    <div className='flex min-w-0 flex-col gap-3 sm:gap-4'>
      <DashboardHeader
        updatedAt={data.quotesUpdatedAt}
        isFetching={data.isFetchingQuotes}
        onRefresh={() => void data.refetchQuotes()}
        onNewPortfolio={() => setNewPortfolioOpen(true)}
      />
      <DashboardSummary
        consolidated={data.consolidated}
        estimatedMonthlyDividends={data.dividends.estimatedMonthlyBRL}
        totalDividends={data.dividends.totalBRL}
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

      <div className='grid min-w-0 gap-3 sm:gap-4 xl:grid-cols-2'>
        <DashboardProventos
          series={data.dividends.monthlySeries}
          monthlyAverage={data.dividends.monthlyAverageBRL}
        />
        <DashboardHighlights
          gainers={data.topGainers}
          losers={data.topLosers}
          payers={data.dividends.topPayers}
        />
      </div>

      <DashboardAllocation slices={data.allocations.byPortfolio} />

      <NewPortfolioDialog
        open={newPortfolioOpen}
        onOpenChange={setNewPortfolioOpen}
      />
    </div>
  );
}
