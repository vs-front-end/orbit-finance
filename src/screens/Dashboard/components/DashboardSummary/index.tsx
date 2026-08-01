import { PLValue, StatCard } from '@/components';
import { formatMoney } from '@/utils';

const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'long' });

type ConsolidatedSummary = {
  marketValue: number;
  investedValue: number;
  netPL: number;
  netPLPercent: number;
};

type DashboardSummaryProps = {
  consolidated: ConsolidatedSummary;
  estimatedMonthlyDividends: number;
  totalDividends: number;
  totalPL: number;
};

export function DashboardSummary({
  consolidated,
  estimatedMonthlyDividends,
  totalDividends,
  totalPL,
}: DashboardSummaryProps) {
  const month = monthFormatter
    .format(new Date())
    .replace(/^./, (letter) => letter.toUpperCase());

  return (
    <div className='grid grid-cols-1 gap-3 xs:grid-cols-2 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-6'>
      <StatCard label='Total investido'>
        {formatMoney(consolidated.investedValue, 'BRL')}
      </StatCard>
      <StatCard label='Valor de mercado'>
        {formatMoney(consolidated.marketValue, 'BRL')}
      </StatCard>
      <StatCard
        label={`Estimativa de ${month}`}
        sub='Proventos previstos no mês'
      >
        {formatMoney(estimatedMonthlyDividends, 'BRL')}
      </StatCard>
      <StatCard label='Recebidos no total' sub='Desde o primeiro evento'>
        {formatMoney(totalDividends, 'BRL')}
      </StatCard>
      <StatCard label='P/L em aberto'>
        <PLValue
          value={consolidated.netPL}
          currency='BRL'
          percent={consolidated.netPLPercent}
        />
      </StatCard>
      <StatCard label='P/L total'>
        <PLValue value={totalPL} currency='BRL' />
      </StatCard>
    </div>
  );
}
