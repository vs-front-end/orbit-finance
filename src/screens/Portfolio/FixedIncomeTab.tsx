import { useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@stellar-ui-kit/web';

import { Pencil, Plus, Trash2 } from 'lucide-react';

import type { FixedIncome, Portfolio } from '@/domain';
import {
  useFixedIncomeViews,
  useRemoveFixedIncome,
  useUpdateFixedIncomeValue,
} from '@/hooks';
import { formatDate, formatMoney } from '@/utils';

import { MoneyInput, PLValue } from '@/components';

import { AddFixedIncomeDialog } from './AddFixedIncomeDialog';
import { Table, TCell, THeadCell, TRow } from './Table';

export function FixedIncomeTab({ portfolio }: { portfolio: Portfolio }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FixedIncome | null>(null);
  const [editValue, setEditValue] = useState<number | null>(null);
  const { views } = useFixedIncomeViews(portfolio.id);
  const removeFixedIncome = useRemoveFixedIncome();
  const updateValue = useUpdateFixedIncomeValue(portfolio.id);

  const openEdit = (item: FixedIncome) => {
    setEditing(item);
    setEditValue(item.currentValue);
  };

  const closeEdit = () => {
    setEditing(null);
    setEditValue(null);
  };

  const handleSaveValue = () => {
    if (!editing || editValue === null || editValue <= 0) return;
    updateValue.mutate(
      { id: editing.id, currentValue: editValue },
      { onSuccess: closeEdit },
    );
  };

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex flex-wrap items-center justify-end gap-2'>
        <Button size='sm' onClick={() => setDialogOpen(true)}>
          <Plus />
          <span className='hidden sm:inline'>Nova aplicação</span>
        </Button>
      </div>

      {views.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Sem renda fixa</EmptyTitle>
            <EmptyDescription>
              Cadastre CDB, LCI ou similar com o valor atual do extrato.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Table>
          <thead>
            <tr>
              <THeadCell>Aplicação</THeadCell>
              <THeadCell className='text-right'>Aplicado</THeadCell>
              <THeadCell className='text-right'>Valor atual</THeadCell>
              <THeadCell className='text-right'>Resultado</THeadCell>
              <THeadCell />
            </tr>
          </thead>
          <tbody>
            {views.map((view) => (
              <TRow key={view.id}>
                <TCell>
                  <div className='flex flex-col'>
                    <span className='font-medium'>{view.name}</span>
                    <span className='text-xs text-muted'>
                      desde {formatDate(view.appliedAt)}
                      {view.maturesAt
                        ? ` · vence ${formatDate(view.maturesAt)}`
                        : ''}
                    </span>
                  </div>
                </TCell>
                <TCell className='text-right'>
                  {formatMoney(view.principal, portfolio.currency)}
                </TCell>
                <TCell className='text-right font-medium'>
                  {formatMoney(view.currentValue, portfolio.currency)}
                </TCell>
                <TCell className='text-right'>
                  <PLValue value={view.yield} currency={portfolio.currency} />
                </TCell>
                <TCell className='w-20 text-right'>
                  <div className='flex justify-end gap-1'>
                    <Button
                      variant='ghost'
                      size='icon-sm'
                      aria-label={`Atualizar valor de ${view.name}`}
                      onClick={() => openEdit(view)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon-sm'
                      aria-label={`Remover ${view.name}`}
                      onClick={() => removeFixedIncome.mutate(view.id)}
                    >
                      <Trash2 className='text-error-text' />
                    </Button>
                  </div>
                </TCell>
              </TRow>
            ))}
          </tbody>
        </Table>
      )}

      {dialogOpen && (
        <AddFixedIncomeDialog
          portfolio={portfolio}
          onClose={() => setDialogOpen(false)}
        />
      )}

      {editing && (
        <Dialog open onOpenChange={(open) => !open && closeEdit()}>
          <DialogContent className='sm:max-w-sm'>
            <DialogHeader>
              <DialogTitle>Atualizar valor</DialogTitle>
            </DialogHeader>
            <MoneyInput
              label={`Valor atual (${portfolio.currency})`}
              value={editValue}
              onChange={setEditValue}
              required
            />
            <DialogFooter>
              <Button variant='ghost' onClick={closeEdit}>
                Cancelar
              </Button>
              <Button
                onClick={handleSaveValue}
                disabled={
                  editValue === null || editValue <= 0 || updateValue.isPending
                }
              >
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
