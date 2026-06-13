import { useState } from 'react';

import {
  Button,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@stellar-ui-kit/web';

import { Plus, Trash2 } from 'lucide-react';

import type { Portfolio } from '@/domain';
import { useIncomes, useRemoveIncome } from '@/hooks';
import { formatDate, formatMoney, formatPercent } from '@/utils';

import { Table, TCell, THeadCell, TRow } from './Table';

import { AddIncomeDialog } from './AddIncomeDialog';

type IncomesTabProps = {
  portfolio: Portfolio;
  tickers: string[];
  investedValue: number;
};

export function IncomesTab({
  portfolio,
  tickers,
  investedValue,
}: IncomesTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data } = useIncomes(portfolio.id);
  const removeIncome = useRemoveIncome(portfolio.id);

  const incomes = [...(data ?? [])].sort((a, b) =>
    b.receivedAt.localeCompare(a.receivedAt),
  );
  const total = incomes.reduce((sum, income) => sum + income.amount, 0);
  const yieldOnCost = investedValue > 0 ? (total / investedValue) * 100 : 0;

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <span className='text-xs text-muted'>
          Total recebido:{' '}
          <span className='font-medium text-success-text'>
            {formatMoney(total, portfolio.currency)}
          </span>{' '}
          · Yield on cost: {formatPercent(yieldOnCost, false)}
        </span>
        <Button
          size='sm'
          onClick={() => setDialogOpen(true)}
          disabled={tickers.length === 0}
        >
          <Plus />
          <span className='hidden sm:inline'>Novo provento</span>
        </Button>
      </div>

      {incomes.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Sem proventos</EmptyTitle>
            <EmptyDescription>
              Registre dividendos, JCP e rendimentos recebidos para acompanhar o
              yield das posições.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Table>
          <thead>
            <tr>
              <THeadCell>Data</THeadCell>
              <THeadCell>Ativo</THeadCell>
              <THeadCell className='text-right'>Valor</THeadCell>
              <THeadCell />
            </tr>
          </thead>
          <tbody>
            {incomes.map((income) => (
              <TRow key={income.id}>
                <TCell className='text-muted'>
                  {formatDate(income.receivedAt)}
                </TCell>
                <TCell className='font-medium'>{income.ticker}</TCell>
                <TCell className='text-right font-medium text-success-text'>
                  {formatMoney(income.amount, portfolio.currency)}
                </TCell>
                <TCell className='w-10 text-right'>
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    aria-label='Excluir provento'
                    onClick={() => removeIncome.mutate(income.id)}
                  >
                    <Trash2 className='text-error-text' />
                  </Button>
                </TCell>
              </TRow>
            ))}
          </tbody>
        </Table>
      )}

      {dialogOpen && (
        <AddIncomeDialog
          portfolio={portfolio}
          tickers={tickers}
          onClose={() => setDialogOpen(false)}
        />
      )}
    </div>
  );
}
