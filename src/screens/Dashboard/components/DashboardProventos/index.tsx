import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Text,
} from '@stellar-ui-kit/web';

import type { MonthlyDividend } from '@/domain';
import { formatMoney, formatMoneyCompact } from '@/utils';

import { BarChart } from '../BarChart';

type DashboardProventosProps = {
  series: MonthlyDividend[];
  monthlyAverage: number;
};

const monthLabel = new Intl.DateTimeFormat('pt-BR', {
  month: 'short',
  year: '2-digit',
  timeZone: 'UTC',
});

function formatMonth(ym: string): string {
  return monthLabel
    .format(new Date(`${ym}-01T12:00:00Z`))
    .replace('.', '')
    .replace(' de ', ' ')
    .toUpperCase();
}

export function DashboardProventos({
  series,
  monthlyAverage,
}: DashboardProventosProps) {
  const hasData = series.some((entry) => entry.total > 0);

  return (
    <Card className='min-w-0 gap-3 py-3 sm:py-4'>
      <CardHeader className='px-4 sm:px-5'>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between'>
          <div className='flex min-w-0 flex-col gap-0.5'>
            <CardTitle className='text-sm'>Proventos</CardTitle>
            <Text as='p' styleVariant='muted' className='text-xs'>
              Recebidos por mês
            </Text>
          </div>
          {hasData && (
            <Text as='p' styleVariant='muted' className='shrink-0 text-xs'>
              Média mensal:{' '}
              <span className='font-medium text-foreground'>
                {formatMoney(monthlyAverage, 'BRL')}
              </span>
            </Text>
          )}
        </div>
      </CardHeader>
      <CardContent className='mt-0 min-w-0 px-4 sm:px-5'>
        {hasData ? (
          <BarChart
            items={series.map((entry) => ({
              id: entry.month,
              label: formatMonth(entry.month),
              value: entry.total,
            }))}
            formatValue={(value) => formatMoneyCompact(value, 'BRL')}
          />
        ) : (
          <div className='flex flex-col items-center gap-1.5 py-8 text-center'>
            <Text as='p' className='text-sm font-medium'>
              Nenhum provento recebido ainda
            </Text>
            <Text as='p' styleVariant='muted' className='max-w-xs text-xs'>
              O calendário aparece depois do primeiro pagamento liquidado.
            </Text>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
