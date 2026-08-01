import { PLValue, StatCard } from '@/components';
import { formatMoney } from '@/utils';

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
  return (
    <div className='grid grid-cols-1 gap-3 xs:grid-cols-2 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-6'>
      <StatCard label='Total investido'>
        {formatMoney(consolidated.investedValue, 'BRL')}
      </StatCard>
      <StatCard label='Valor de mercado'>
        {formatMoney(consolidated.marketValue, 'BRL')}
      </StatCard>
      <StatCard label='Proventos estimados'>
        {formatMoney(estimatedMonthlyDividends, 'BRL')}
      </StatCard>
      <StatCard label='Proventos recebidos'>
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
