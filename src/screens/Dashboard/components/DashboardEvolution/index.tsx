import { useState } from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Text,
} from '@stellar-ui-kit/web';

import type { HistoryChartSeries } from '@/hooks';

import { EvolutionChartCard } from '../EvolutionChartCard';

type EvolutionView = 'patrimony' | 'portfolios';

type EvolutionContentProps = {
  hasHistory: boolean;
  view: EvolutionView;
  onViewChange: (view: EvolutionView) => void;
  period: string;
  onPeriodChange: (period: string) => void;
  consolidatedSeries: HistoryChartSeries[];
  portfolioSeries: HistoryChartSeries[];
};

function EvolutionContent({
  hasHistory,
  view,
  onViewChange,
  period,
  onPeriodChange,
  consolidatedSeries,
  portfolioSeries,
}: EvolutionContentProps) {
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

type DashboardEvolutionProps = {
  period: string;
  onPeriodChange: (period: string) => void;
  hasHistory: boolean;
  consolidatedSeries: HistoryChartSeries[];
  portfolioSeries: HistoryChartSeries[];
};

export function DashboardEvolution({
  period,
  onPeriodChange,
  hasHistory,
  consolidatedSeries,
  portfolioSeries,
}: DashboardEvolutionProps) {
  const [view, setView] = useState<EvolutionView>('patrimony');

  return (
    <section>
      <EvolutionContent
        hasHistory={hasHistory}
        view={view}
        onViewChange={setView}
        period={period}
        onPeriodChange={onPeriodChange}
        consolidatedSeries={consolidatedSeries}
        portfolioSeries={portfolioSeries}
      />
    </section>
  );
}
