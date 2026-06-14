import { Skeleton } from '@stellar-ui-kit/web';

import { useDividendsForecast } from '@/hooks';
import { formatMoney } from '@/utils';

import { StatCard } from '@/components';

const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(
  new Date(),
);

const brl = (value: number) => formatMoney(value, 'BRL');

export function DividendsSummaryCard() {
  const {
    receivedBRL,
    pendingBRL,
    expectedBRL,
    totalReceivedBRL,
    monthlyAverageBRL,
    isLoading,
  } = useDividendsForecast();

  if (isLoading) {
    return (
      <>
        <Skeleton className='h-full min-h-20 w-full' />
        <Skeleton className='h-full min-h-20 w-full' />
      </>
    );
  }

  if (totalReceivedBRL === 0 && expectedBRL === 0) {
    return null;
  }

  return (
    <>
      <StatCard
        label='Proventos · total'
        sub={`média ${brl(monthlyAverageBRL)}/mês`}
      >
        <span className='text-success-text'>{brl(totalReceivedBRL)}</span>
      </StatCard>

      <StatCard
        label={`Proventos · ${monthLabel}`}
        sub={`${brl(receivedBRL)} recebido · ${brl(pendingBRL)} a receber`}
      >
        <span className='text-success-text'>{brl(expectedBRL)}</span>
      </StatCard>
    </>
  );
}
