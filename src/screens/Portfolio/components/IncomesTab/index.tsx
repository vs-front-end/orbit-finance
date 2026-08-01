import { useState } from 'react';

import {
  Badge,
  Button,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Skeleton,
} from '@stellar-ui-kit/web';

import { Pencil } from 'lucide-react';

import type { LedgerDividend, Portfolio } from '@/domain';
import { usePortfolioDividends } from '@/hooks';
import { formatDate, formatMoney, formatPercent } from '@/utils';

import { DividendDialog } from '../DividendDialog';
import { Table, TCell, THeadCell, TRow } from '../Table';

type IncomesTabProps = {
  portfolio: Portfolio;
  investedValue: number;
};

const asDate = (iso: string) => formatDate(`${iso}T12:00:00`);

export function IncomesTab({ portfolio, investedValue }: IncomesTabProps) {
  const { entries, total, pendingTotal, tax, isLoading } =
    usePortfolioDividends(portfolio.id);
  const today = new Date().toISOString().slice(0, 10);
  const [editing, setEditing] = useState<LedgerDividend | null>(null);

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
        {pendingTotal > 0 && (
          <>
            {' '}
            · A receber:{' '}
            <span className='font-medium text-foreground'>
              {formatMoney(pendingTotal, portfolio.currency)}
            </span>
          </>
        )}
        {tax > 0 && <> · IR: {formatMoney(tax, portfolio.currency)}</>} · Yield
        on cost: {formatPercent(yieldOnCost, false)}
      </span>

      {entries.length === 0 ? (
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
              <THeadCell>Pagamento</THeadCell>
              <THeadCell>Data-ex</THeadCell>
              <THeadCell>Ativo</THeadCell>
              <THeadCell className='text-right'>Valor</THeadCell>
              <THeadCell />
            </tr>
          </thead>
          <tbody>
            {entries.map((dividend) => (
              <TRow key={dividend.id}>
                <TCell>
                  <div className='flex items-center gap-2'>
                    <span>{asDate(dividend.paymentDate)}</span>
                    {dividend.paymentDate > today && (
                      <Badge variant='outline'>a receber</Badge>
                    )}
                    {dividend.editedManually ? (
                      <Badge variant='secondary'>ajustado</Badge>
                    ) : (
                      dividend.estimatedPayment && (
                        <Badge variant='warning'>previsto</Badge>
                      )
                    )}
                  </div>
                </TCell>
                <TCell className='text-muted'>{asDate(dividend.exDate)}</TCell>
                <TCell>
                  <div className='flex flex-col'>
                    <span className='font-medium'>{dividend.ticker}</span>
                    <span className='text-xs text-muted'>
                      {dividend.quantity} ×{' '}
                      {formatMoney(dividend.amountPerShare, portfolio.currency)}
                      {dividend.label !== '' && <> · {dividend.label}</>}
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
                <TCell className='w-10 text-right'>
                  {dividend.stored && (
                    <Button
                      variant='ghost'
                      size='icon-sm'
                      aria-label='Editar provento'
                      onClick={() => setEditing(dividend)}
                    >
                      <Pencil />
                    </Button>
                  )}
                </TCell>
              </TRow>
            ))}
          </tbody>
        </Table>
      )}

      {editing && (
        <DividendDialog
          dividend={editing}
          currency={portfolio.currency}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
