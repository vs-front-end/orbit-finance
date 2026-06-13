import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@stellar-ui-kit/web';

import { MoreVertical, Plus, ShoppingCart, Trash2 } from 'lucide-react';

import type { Currency, PositionView, TransactionSide } from '@/domain';
import { useRemovePosition, useTableSort } from '@/hooks';
import { findAsset } from '@/services';
import { formatMoney, formatPrice, formatQuantity } from '@/utils';

import { PLValue } from '@/components';

import { SortableTh, Table, TCell, THeadCell, TRow } from './Table';

const ACCESSORS: Record<string, (view: PositionView) => number | string> = {
  ticker: (view) => view.ticker,
  quantity: (view) => view.quantity,
  avgPrice: (view) => view.avgPrice,
  price: (view) => view.quote?.price ?? 0,
  marketValue: (view) => view.marketValue,
  dailyPL: (view) => view.dailyPL,
  netPL: (view) => view.netPL,
};

type PositionsTableProps = {
  portfolioId: string;
  currency: Currency;
  views: PositionView[];
  onNewTransaction: (ticker?: string, side?: TransactionSide) => void;
};

export function PositionsTable({
  portfolioId,
  currency,
  views,
  onNewTransaction,
}: PositionsTableProps) {
  const removePosition = useRemovePosition();
  const { sorted, sortKey, sortDir, onSort } = useTableSort(views, ACCESSORS);

  if (views.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Sem posições</EmptyTitle>
          <EmptyDescription>
            Registre a primeira compra para começar a acompanhar esta carteira.
          </EmptyDescription>
        </EmptyHeader>
        <Button onClick={() => onNewTransaction()}>
          <Plus />
          Nova transação
        </Button>
      </Empty>
    );
  }

  return (
    <Table>
      <thead>
        <tr>
          <SortableTh
            label='Ativo'
            columnKey='ticker'
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
            label='Preço médio'
            columnKey='avgPrice'
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={onSort}
            align='right'
          />
          <SortableTh
            label='Preço atual'
            columnKey='price'
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={onSort}
            align='right'
          />
          <SortableTh
            label='Valor de mercado'
            columnKey='marketValue'
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={onSort}
            align='right'
          />
          <SortableTh
            label='P/L diário'
            columnKey='dailyPL'
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={onSort}
            align='right'
          />
          <SortableTh
            label='P/L líquido'
            columnKey='netPL'
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={onSort}
            align='right'
          />
          <THeadCell />
        </tr>
      </thead>
      <tbody>
        {sorted.map((view) => {
          const asset = findAsset(view.ticker);
          return (
            <TRow key={view.ticker}>
              <TCell>
                <div className='flex flex-col'>
                  <span className='font-medium'>{view.ticker}</span>
                  <span className='text-xs text-muted'>
                    {asset?.name ?? '-'}
                  </span>
                </div>
              </TCell>
              <TCell className='text-right'>
                {formatQuantity(view.quantity)}
              </TCell>
              <TCell className='text-right'>{formatPrice(view.avgPrice)}</TCell>
              <TCell className='text-right'>
                {view.quote ? (
                  formatPrice(view.quote.price)
                ) : (
                  <Badge variant='warning'>sem cotação</Badge>
                )}
              </TCell>
              <TCell className='text-right font-medium'>
                {formatMoney(view.marketValue, currency)}
              </TCell>
              <TCell className='text-right'>
                <PLValue
                  value={view.dailyPL}
                  currency={currency}
                  percent={view.dailyPLPercent}
                />
              </TCell>
              <TCell className='text-right'>
                <PLValue
                  value={view.netPL}
                  currency={currency}
                  percent={view.netPLPercent}
                />
              </TCell>
              <TCell className='w-10 text-right'>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='ghost'
                      size='icon-sm'
                      aria-label={`Ações ${view.ticker}`}
                    >
                      <MoreVertical />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem
                      onClick={() => onNewTransaction(view.ticker, 'buy')}
                    >
                      <Plus />
                      Comprar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onNewTransaction(view.ticker, 'sell')}
                    >
                      <ShoppingCart />
                      Vender
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant='destructive'
                      onClick={() =>
                        removePosition.mutate({
                          portfolioId,
                          ticker: view.ticker,
                        })
                      }
                    >
                      <Trash2 />
                      Remover posição
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TCell>
            </TRow>
          );
        })}
      </tbody>
    </Table>
  );
}
