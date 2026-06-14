import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Skeleton,
  Text,
} from '@stellar-ui-kit/web';

import { useDashboardData, usePatrimony } from '@/hooks';
import { formatMoney } from '@/utils';

import { PLValue, RefreshIndicator, StatCard } from '@/components';

import { AllocationCard } from './AllocationCard';
import { DividendsSummaryCard } from './DividendsSummaryCard';
import { PortfolioCard } from './PortfolioCard';

export function Dashboard() {
  const {
    perPortfolio,
    consolidated,
    allocations,
    isLoading,
    isFetchingQuotes,
    quotesUpdatedAt,
    refetchQuotes,
  } = useDashboardData();
  const { financialTotal, assetsTotal } = usePatrimony();

  const patrimonyTotal = consolidated.marketValue + financialTotal;
  const withAssets = patrimonyTotal + assetsTotal;

  if (isLoading) {
    return (
      <div className='flex flex-col gap-3 sm:gap-4'>
        <Skeleton className='h-10 w-64' />
        <div className='grid grid-cols-2 gap-3 lg:grid-cols-5'>
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className='h-24 w-full' />
          ))}
        </div>
        <Skeleton className='h-64 w-full' />
      </div>
    );
  }

  if (perPortfolio.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Nenhuma carteira de investimento</EmptyTitle>
          <EmptyDescription>
            Crie uma carteira no menu lateral para começar a acompanhar suas
            posições.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className='flex flex-col gap-3 sm:gap-4'>
      <header className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <Text as='h2' className='text-2xl sm:text-3xl'>
            Dashboard
          </Text>
          <Text as='p' styleVariant='muted' className='text-xs sm:text-sm'>
            Visão consolidada em BRL (câmbio USD/BRL atual)
          </Text>
        </div>
        <div className='ml-auto'>
          <RefreshIndicator
            updatedAt={quotesUpdatedAt}
            isFetching={isFetchingQuotes}
            onRefresh={() => void refetchQuotes()}
          />
        </div>
      </header>

      <div className='grid grid-cols-1 gap-3 xs:grid-cols-2 sm:gap-4 lg:grid-cols-4'>
        <StatCard
          label='Patrimônio'
          sub={
            assetsTotal > 0
              ? `com bens ${formatMoney(withAssets, 'BRL')}`
              : undefined
          }
        >
          {formatMoney(patrimonyTotal, 'BRL')}
        </StatCard>
        <StatCard label='Investido'>
          {formatMoney(consolidated.investedValue, 'BRL')}
        </StatCard>
        <StatCard label='Ganhos' hint='Posições no positivo'>
          <PLValue value={consolidated.gains} currency='BRL' />
        </StatCard>
        <StatCard label='Perdas' hint='Posições no negativo'>
          <PLValue value={consolidated.losses} currency='BRL' />
        </StatCard>
        <StatCard label='P/L diário'>
          <PLValue
            value={consolidated.dailyPL}
            currency='BRL'
            percent={consolidated.dailyPLPercent}
          />
        </StatCard>
        <StatCard label='P/L líquido'>
          <PLValue
            value={consolidated.netPL}
            currency='BRL'
            percent={consolidated.netPLPercent}
          />
        </StatCard>
        <DividendsSummaryCard />
      </div>

      <div className='grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3'>
        <AllocationCard
          title='Alocação por carteira'
          slices={allocations.byPortfolio}
        />
        <AllocationCard
          title='Alocação por classe'
          slices={allocations.byClass}
        />
        <AllocationCard
          title='Alocação por setor'
          slices={allocations.bySector}
        />
      </div>

      <div className='grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-4'>
        {perPortfolio.map(({ portfolio, summary, views }) => (
          <PortfolioCard
            key={portfolio.id}
            portfolio={portfolio}
            summary={summary}
            positionCount={views.length}
          />
        ))}
      </div>
    </div>
  );
}
