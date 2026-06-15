import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Skeleton,
  Text,
} from '@stellar-ui-kit/web';

import { useReportData } from '@/hooks';
import { formatMoney } from '@/utils';

import { PLValue, RefreshIndicator, StatCard } from '@/components';

import { DividendsReportCard } from './DividendsReportCard';
import { RealizedCard } from './RealizedCard';
import { ResultBreakdownCard } from './ResultBreakdownCard';
import { TopMoversCard } from './TopMoversCard';

export function Report() {
  const data = useReportData();
  const { consolidated, dividends } = data;

  if (data.isLoading) {
    return (
      <div className='flex flex-col gap-3 sm:gap-4'>
        <Skeleton className='h-10 w-64' />
        <div className='grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6'>
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className='h-24 w-full' />
          ))}
        </div>
        <Skeleton className='h-64 w-full' />
      </div>
    );
  }

  if (!data.hasPositions) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Sem dados pra relatório</EmptyTitle>
          <EmptyDescription>
            Adicione transações em uma carteira de investimento pra ver
            resultado, proventos e composição.
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
            Relatórios
          </Text>
          <Text as='p' styleVariant='muted' className='text-xs sm:text-sm'>
            Resultado, proventos e composição em BRL
          </Text>
        </div>
        <div className='ml-auto'>
          <RefreshIndicator
            updatedAt={data.quotesUpdatedAt}
            isFetching={data.isFetchingQuotes}
            onRefresh={() => void data.refetchQuotes()}
          />
        </div>
      </header>

      <div className='grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4'>
        <StatCard label='Total investido'>
          {formatMoney(consolidated.investedValue, 'BRL')}
        </StatCard>
        <StatCard label='Valorização'>
          <PLValue
            value={consolidated.netPL}
            currency='BRL'
            percent={consolidated.netPLPercent}
          />
        </StatCard>
        <StatCard label='Ganhos' hint='Posições no positivo'>
          <PLValue value={consolidated.gains} currency='BRL' />
        </StatCard>
        <StatCard label='Perdas' hint='Posições no negativo'>
          <PLValue value={consolidated.losses} currency='BRL' />
        </StatCard>
      </div>

      <div className='grid gap-3 sm:gap-4 md:grid-cols-2'>
        <ResultBreakdownCard
          invested={consolidated.investedValue}
          valorization={consolidated.netPL}
          dividends={dividends.totalBRL}
          totalReturnBRL={data.totalReturnBRL}
          totalReturnPercent={data.totalReturnPercent}
        />
        <RealizedCard
          realized={data.realizedBRL}
          unrealized={data.unrealizedBRL}
        />
      </div>

      <div className='grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4'>
        <StatCard label='Recebido total'>
          <span className='text-success-text'>
            {formatMoney(dividends.totalBRL, 'BRL')}
          </span>
        </StatCard>
        <StatCard label='Média mensal' sub='histórico'>
          {formatMoney(dividends.monthlyAverageBRL, 'BRL')}
        </StatCard>
        <StatCard label='Yield on cost' hint='Proventos no ano ÷ custo'>
          <PLValue value={dividends.yieldOnCost} />
        </StatCard>
        <StatCard label='A receber' sub='neste mês'>
          <span className='text-success-text'>
            {formatMoney(dividends.pendingBRL, 'BRL')}
          </span>
        </StatCard>
      </div>

      <DividendsReportCard
        monthly={dividends.monthly}
        byAsset={dividends.byAsset}
        totalBRL={dividends.totalBRL}
        taxBRL={dividends.taxBRL}
      />

      <div className='grid gap-3 sm:gap-4 md:grid-cols-2'>
        <TopMoversCard title='Maiores ganhos' movers={data.gainers} />
        <TopMoversCard title='Maiores perdas' movers={data.losers} />
      </div>
    </div>
  );
}
