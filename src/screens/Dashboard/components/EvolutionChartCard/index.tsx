import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@stellar-ui-kit/web';

import { formatMoney } from '@/utils';

import { LineChart, type ChartSeries } from '../LineChart';

type EvolutionChartCardProps = {
  view: 'patrimony' | 'portfolios';
  onViewChange: (view: 'patrimony' | 'portfolios') => void;
  period: string;
  onPeriodChange: (period: string) => void;
  series: ChartSeries[];
};

const PERIODS = [
  { value: '30', label: '1M' },
  { value: '90', label: '3M' },
  { value: '180', label: '6M' },
  { value: '365', label: '1A' },
  { value: '36500', label: 'Total' },
];

const selectorClass =
  'h-8 w-auto gap-1 border-0 bg-background px-3 text-xs text-foreground shadow-none hover:bg-background';

function isEvolutionView(value: string): value is 'patrimony' | 'portfolios' {
  return value === 'patrimony' || value === 'portfolios';
}

function formatCompact(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

function formatChartDate(timestamp: number): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(timestamp));
}

export function EvolutionChartCard({
  view,
  onViewChange,
  period,
  onPeriodChange,
  series,
}: EvolutionChartCardProps) {
  return (
    <Card className='gap-3 py-3 sm:py-4'>
      <CardHeader className='px-4 sm:px-5'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <CardTitle className='text-sm'>Evolução</CardTitle>
          <div className='flex flex-wrap items-center gap-2'>
            <Select
              value={view}
              onValueChange={(next) => {
                if (isEvolutionView(next)) onViewChange(next);
              }}
            >
              <SelectTrigger className={selectorClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='patrimony'>Patrimônio</SelectItem>
                <SelectItem value='portfolios'>Carteira</SelectItem>
              </SelectContent>
            </Select>
            <Select value={period} onValueChange={onPeriodChange}>
              <SelectTrigger className={selectorClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIODS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className='mt-0 px-4 sm:px-5'>
        <LineChart
          series={series}
          formatValue={formatCompact}
          formatTooltipValue={(value) => formatMoney(value, 'BRL')}
          formatDate={formatChartDate}
        />
      </CardContent>
    </Card>
  );
}
