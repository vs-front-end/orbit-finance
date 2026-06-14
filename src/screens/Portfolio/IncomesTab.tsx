import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Skeleton,
} from '@stellar-ui-kit/web';

import type { Portfolio } from '@/domain';
import { usePortfolioDividends } from '@/hooks';
import { formatDate, formatMoney, formatPercent } from '@/utils';

import { Table, TCell, THeadCell, TRow } from './Table';

type IncomesTabProps = {
  portfolio: Portfolio;
  investedValue: number;
};

export function IncomesTab({ portfolio, investedValue }: IncomesTabProps) {
  const { received, total, tax, isLoading } = usePortfolioDividends(
    portfolio.id,
  );

  if (isLoading) {
    return <Skeleton className='h-64 w-full' />;
  }

  const yieldOnCost = investedValue > 0 ? (total / investedValue) * 100 : 0;

  return (
    <div className='flex flex-col gap-3'>
      <span className='text-xs text-muted'>
        Recebido (líq.):{' '}
        <span className='font-medium text-success-text'>
          {formatMoney(total, portfolio.currency)}
        </span>
        {tax > 0 && <> · IR: {formatMoney(tax, portfolio.currency)}</>} · Yield
        on cost: {formatPercent(yieldOnCost, false)}
      </span>

      {received.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Sem proventos</EmptyTitle>
            <EmptyDescription>
              Os dividendos e rendimentos das suas posições aparecem aqui
              automaticamente, conforme o histórico de cada ativo.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Table>
          <thead>
            <tr>
              <THeadCell>Data-com</THeadCell>
              <THeadCell>Ativo</THeadCell>
              <THeadCell className='text-right'>Valor</THeadCell>
            </tr>
          </thead>
          <tbody>
            {received.map((dividend) => (
              <TRow key={`${dividend.ticker}-${dividend.exDate}`}>
                <TCell className='text-muted'>
                  {formatDate(`${dividend.exDate}T12:00:00`)}
                </TCell>
                <TCell>
                  <div className='flex flex-col'>
                    <span className='font-medium'>{dividend.ticker}</span>
                    <span className='text-xs text-muted'>
                      {dividend.quantity} ×{' '}
                      {formatMoney(dividend.amountPerShare, portfolio.currency)}
                      {dividend.tax > 0 && (
                        <>
                          {' '}
                          · IR {formatMoney(dividend.tax, portfolio.currency)}
                        </>
                      )}
                    </span>
                  </div>
                </TCell>
                <TCell className='text-right font-medium text-success-text'>
                  {formatMoney(dividend.received, portfolio.currency)}
                </TCell>
              </TRow>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
