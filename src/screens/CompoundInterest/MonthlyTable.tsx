import { formatMoney } from '@/utils';

export type CompoundRow = {
  month: number;
  interest: number;
  invested: number;
  totalInterest: number;
  balance: number;
};

export function MonthlyTable({ rows }: { rows: CompoundRow[] }) {
  return (
    <div className='max-h-96 overflow-auto rounded-xl border border-border bg-surface'>
      <table className='w-full text-xs sm:text-sm'>
        <thead className='sticky top-0 bg-surface'>
          <tr>
            <Th>Mês</Th>
            <Th className='text-right'>Juros</Th>
            <Th className='text-right'>Total investido</Th>
            <Th className='text-right'>Total juros</Th>
            <Th className='text-right'>Total acumulado</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.month}
              className='border-b border-border last:border-0'
            >
              <td className='px-3 py-2 tabular-nums text-muted'>{row.month}</td>
              <td className='px-3 py-2 text-right tabular-nums'>
                {formatMoney(row.interest, 'BRL')}
              </td>
              <td className='px-3 py-2 text-right tabular-nums'>
                {formatMoney(row.invested, 'BRL')}
              </td>
              <td className='px-3 py-2 text-right tabular-nums text-success-text'>
                {formatMoney(row.totalInterest, 'BRL')}
              </td>
              <td className='px-3 py-2 text-right tabular-nums font-medium'>
                {formatMoney(row.balance, 'BRL')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({
  className = '',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <th
      className={`whitespace-nowrap border-b border-border px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted ${className}`}
    >
      {children}
    </th>
  );
}
