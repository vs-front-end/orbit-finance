import { useState } from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  Text,
} from '@stellar-ui-kit/web';

import { useDashboardHistory, type HistoryChartSeries } from '@/hooks';

import { EvolutionChartCard } from '../EvolutionChartCard';

type EvolutionView = 'patrimony' | 'portfolios';

type EvolutionContentProps = {
  isLoading: boolean;
  hasHistory: boolean;
  view: EvolutionView;
  onViewChange: (view: EvolutionView) => void;
  period: string;
  onPeriodChange: (period: string) => void;
  consolidatedSeries: HistoryChartSeries[];
  portfolioSeries: HistoryChartSeries[];
};

function EvolutionContent({
  isLoading,
  hasHistory,
  view,
  onViewChange,
  period,
  onPeriodChange,
  consolidatedSeries,
  portfolioSeries,
}: EvolutionContentProps) {
  if (isLoading) {
    return <Skeleton className='h-60 w-full' />;
  }

  if (!hasHistory) {
    return (
      <Card className='gap-3 py-3 sm:py-4'>
        <CardHeader className='px-4 sm:px-5'>
          <CardTitle className='text-sm'>Evolução do patrimônio</CardTitle>
        </CardHeader>
        <CardContent className='mt-0 flex flex-col items-center gap-1.5 px-4 py-8 text-center sm:px-5'>
          <Text as='p' className='text-sm font-medium'>
            Coletando dados de evolução
          </Text>
          <Text as='p' styleVariant='muted' className='max-w-xs text-xs'>
            Os gráficos aparecem depois de dois dias de uso. Cada visita
            registra o valor do dia.
          </Text>
        </CardContent>
      </Card>
    );
  }

  const seriesByView: Record<EvolutionView, HistoryChartSeries[]> = {
    patrimony: consolidatedSeries,
    portfolios: portfolioSeries,
  };

  return (
    <EvolutionChartCard
      view={view}
      onViewChange={onViewChange}
      period={period}
      onPeriodChange={onPeriodChange}
      series={seriesByView[view]}
    />
  );
}

export function DashboardEvolution() {
  const [period, setPeriod] = useState('90');
  const [view, setView] = useState<EvolutionView>('patrimony');
  const history = useDashboardHistory(Number(period));

  return (
    <section>
      <EvolutionContent
        isLoading={history.isLoading}
        hasHistory={history.hasHistory}
        view={view}
        onViewChange={setView}
        period={period}
        onPeriodChange={setPeriod}
        consolidatedSeries={history.consolidatedSeries}
        portfolioSeries={history.portfolioSeries}
      />
    </section>
  );
}
