import { useState } from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
  Text,
} from '@stellar-ui-kit/web';

import { LineChart } from '@/components/Charts';
import { useStatsData } from '@/hooks';
import { formatMoney, formatPercent } from '@/utils';

import { PLValue, StatCard } from '@/components';

import { DividendsCard } from './DividendsCard';
import { TopMoversCard } from './TopMoversCard';

const PERIODS = [
  { value: '30', label: '1M' },
  { value: '90', label: '3M' },
  { value: '180', label: '6M' },
  { value: '365', label: '1A' },
  { value: '36500', label: 'Total' },
];

function formatCompact(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

function formatChartDate(t: number): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(t));
}

export function Stats() {
  const [period, setPeriod] = useState('90');
  const {
    consolidated,
    investedBRL,
    totalReturnPercent,
    consolidatedSeries,
    portfolioSeries,
    periodReturn,
    benchmarkIbov,
    benchmarkSp500,
    hasHistory,
    gainers,
    losers,
    best,
    worst,
    isLoading,
  } = useStatsData(Number(period));

  if (isLoading) {
    return (
      <div className='flex flex-col gap-3 sm:gap-4'>
        <Skeleton className='h-10 w-64' />
        <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className='h-24 w-full' />
          ))}
        </div>
        <Skeleton className='h-72 w-full' />
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-3 sm:gap-4'>
      <header className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <Text as='h2' className='text-2xl sm:text-3xl'>
            Estatísticas
          </Text>
          <Text as='p' styleVariant='muted' className='text-xs sm:text-sm'>
            Evolução e desempenho consolidados em BRL
          </Text>
        </div>
        <Tabs value={period} onValueChange={setPeriod}>
          <TabsList>
            {PERIODS.map(({ value, label }) => (
              <TabsTrigger key={value} value={value}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </header>

      <div className='flex flex-col gap-3 sm:gap-4'>
        <div className='grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4'>
          <StatCard label='Total investido'>
            {formatMoney(investedBRL, 'BRL')}
          </StatCard>
          <StatCard label='Retorno total'>
            <PLValue value={totalReturnPercent} />
          </StatCard>
          <StatCard
            label='Melhor posição'
            hint={best ? best.portfolioName : undefined}
          >
            {best ? (
              <span className='flex items-baseline gap-2'>
                {best.view.ticker}
                <PLValue value={best.view.netPLPercent} className='text-sm' />
              </span>
            ) : (
              '-'
            )}
          </StatCard>
          <StatCard
            label='Pior posição'
            hint={worst ? worst.portfolioName : undefined}
          >
            {worst ? (
              <span className='flex items-baseline gap-2'>
                {worst.view.ticker}
                <PLValue value={worst.view.netPLPercent} className='text-sm' />
              </span>
            ) : (
              '-'
            )}
          </StatCard>
        </div>

        <div className='grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4'>
          <StatCard label='Você no período'>
            {periodReturn !== null ? (
              <PLValue value={periodReturn} />
            ) : (
              <span className='text-sm text-muted'>Sem histórico ainda</span>
            )}
          </StatCard>
          <StatCard label='Ibovespa'>
            {benchmarkIbov !== null ? (
              <PLValue value={benchmarkIbov} />
            ) : (
              <span className='text-sm text-muted'>-</span>
            )}
          </StatCard>
          <StatCard label='S&P 500'>
            {benchmarkSp500 !== null ? (
              <PLValue value={benchmarkSp500} />
            ) : (
              <span className='text-sm text-muted'>-</span>
            )}
          </StatCard>
        </div>
      </div>

      {hasHistory ? (
        <>
          <Card className='gap-3 py-3 sm:py-4'>
            <CardHeader className='px-4 sm:px-5'>
              <CardTitle className='flex flex-wrap items-baseline justify-between gap-2 text-sm'>
                Evolução do patrimônio
                <span className='text-xs font-normal text-muted'>
                  {formatMoney(consolidated.marketValue, 'BRL')} hoje ·{' '}
                  {formatPercent(totalReturnPercent)} desde o aporte
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className='mt-0 px-4 sm:px-5'>
              <LineChart
                series={consolidatedSeries}
                formatValue={formatCompact}
                formatTooltipValue={(value) => formatMoney(value, 'BRL')}
                formatDate={formatChartDate}
              />
            </CardContent>
          </Card>

          <Card className='gap-3 py-3 sm:py-4'>
            <CardHeader className='px-4 sm:px-5'>
              <CardTitle className='text-sm'>Evolução por carteira</CardTitle>
            </CardHeader>
            <CardContent className='mt-0 px-4 sm:px-5'>
              <LineChart
                series={portfolioSeries}
                formatValue={formatCompact}
                formatTooltipValue={(value) => formatMoney(value, 'BRL')}
                formatDate={formatChartDate}
              />
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className='gap-3 py-3 sm:py-4'>
          <CardHeader className='px-4 sm:px-5'>
            <CardTitle className='text-sm'>Evolução do patrimônio</CardTitle>
          </CardHeader>
          <CardContent className='mt-0 flex flex-col items-center gap-1.5 px-4 py-8 text-center sm:px-5'>
            <Text as='p' className='text-sm font-medium'>
              Coletando dados de evolução
            </Text>
            <Text as='p' styleVariant='muted' className='max-w-xs text-xs'>
              O gráfico aparece depois de 2 dias de uso. Cada visita grava o
              valor do dia. Volte amanhã pra ver a primeira linha.
            </Text>
          </CardContent>
        </Card>
      )}

      <DividendsCard />

      <div className='grid gap-3 sm:gap-4 md:grid-cols-2'>
        <TopMoversCard title='Maiores ganhos' movers={gainers} />
        <TopMoversCard title='Maiores perdas' movers={losers} />
      </div>
    </div>
  );
}
