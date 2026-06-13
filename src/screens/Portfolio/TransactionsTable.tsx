import {
  Badge,
  Button,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@stellar-ui-kit/web';

import { Pencil, Trash2 } from 'lucide-react';

import type { Currency, Transaction } from '@/domain';
import { useRemoveTransaction, useTableSort } from '@/hooks';
import {
  formatDateTime,
  formatMoney,
  formatPrice,
  formatQuantity,
} from '@/utils';

import { SortableTh, Table, TCell, THeadCell, TRow } from './Table';

const ACCESSORS: Record<string, (tx: Transaction) => number | string> = {
  executedAt: (tx) => tx.executedAt,
  ticker: (tx) => tx.ticker,
  side: (tx) => tx.side,
  quantity: (tx) => tx.quantity,
  unitPrice: (tx) => tx.unitPrice,
  total: (tx) => tx.quantity * tx.unitPrice,
};

type TransactionsTableProps = {
  currency: Currency;
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
};

export function TransactionsTable({
  currency,
  transactions,
  onEdit,
}: TransactionsTableProps) {
  const removeTransaction = useRemoveTransaction();
  const { sorted, sortKey, sortDir, onSort } = useTableSort(
    transactions,
    ACCESSORS,
    { key: 'executedAt', dir: 'desc' },
  );

  if (sorted.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Sem transações</EmptyTitle>
          <EmptyDescription>
            As compras e vendas registradas aparecem aqui.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Table>
      <thead>
        <tr>
          <SortableTh
            label='Data/hora'
            columnKey='executedAt'
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={onSort}
          />
          <SortableTh
            label='Ativo'
            columnKey='ticker'
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={onSort}
          />
          <SortableTh
            label='Tipo'
            columnKey='side'
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={onSort}
          />
          <SortableTh
            label='Qtd.'
            columnKey='quantity'
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={onSort}
            align='right'
          />
          <SortableTh
            label='Preço'
            columnKey='unitPrice'
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={onSort}
            align='right'
          />
          <SortableTh
            label='Total'
            columnKey='total'
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={onSort}
            align='right'
          />
          <THeadCell />
        </tr>
      </thead>
      <tbody>
        {sorted.map((tx) => (
          <TRow key={tx.id}>
            <TCell className='text-muted'>
              {formatDateTime(tx.executedAt)}
            </TCell>
            <TCell className='font-medium'>{tx.ticker}</TCell>
            <TCell>
              <Badge variant={tx.side === 'buy' ? 'success' : 'destructive'}>
                {tx.side === 'buy' ? 'Compra' : 'Venda'}
              </Badge>
            </TCell>
            <TCell className='text-right'>{formatQuantity(tx.quantity)}</TCell>
            <TCell className='text-right'>{formatPrice(tx.unitPrice)}</TCell>
            <TCell className='text-right font-medium'>
              {formatMoney(tx.quantity * tx.unitPrice, currency)}
            </TCell>
            <TCell className='w-20 text-right'>
              <div className='flex justify-end gap-1'>
                <Button
                  variant='ghost'
                  size='icon-sm'
                  aria-label='Editar transação'
                  onClick={() => onEdit(tx)}
                >
                  <Pencil />
                </Button>
                <Button
                  variant='ghost'
                  size='icon-sm'
                  aria-label='Excluir transação'
                  onClick={() => removeTransaction.mutate(tx.id)}
                >
                  <Trash2 className='text-error-text' />
                </Button>
              </div>
            </TCell>
          </TRow>
        ))}
      </tbody>
    </Table>
  );
}
