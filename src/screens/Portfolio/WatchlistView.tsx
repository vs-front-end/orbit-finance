import { useState } from 'react';

import {
  Button,
  Combobox,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@stellar-ui-kit/web';

import { Plus, Trash2 } from 'lucide-react';

import type { Portfolio } from '@/domain';
import {
  useAddWatchItem,
  useQuotes,
  useRemoveWatchItem,
  useWatchItems,
} from '@/hooks';
import { ASSET_CATALOG, findAsset } from '@/services';
import { formatPrice } from '@/utils';

import { PLValue, RefreshIndicator } from '@/components';

import { PortfolioActions } from './PortfolioActions';
import { PortfolioHeader } from './PortfolioHeader';
import { Table, TCell, THeadCell, TRow } from './Table';

export function WatchlistView({ portfolio }: { portfolio: Portfolio }) {
  const [ticker, setTicker] = useState('');
  const { data: items } = useWatchItems(portfolio.id);
  const watchItems = items ?? [];
  const quotesQuery = useQuotes(watchItems.map((item) => item.ticker));
  const addWatchItem = useAddWatchItem();
  const removeWatchItem = useRemoveWatchItem(portfolio.id);

  const quoteByTicker = new Map(
    (quotesQuery.data ?? []).map((quote) => [quote.ticker, quote]),
  );
  const existing = new Set(watchItems.map((item) => item.ticker));
  const options = ASSET_CATALOG.filter(
    (asset) => !existing.has(asset.ticker),
  ).map((asset) => ({
    value: asset.ticker,
    label: `${asset.ticker} · ${asset.name}`,
  }));

  const handleAdd = () => {
    if (!ticker) return;
    addWatchItem.mutate(
      { portfolioId: portfolio.id, ticker: ticker.toUpperCase() },
      { onSuccess: () => setTicker('') },
    );
  };

  return (
    <div className='flex flex-col gap-4'>
      <PortfolioHeader
        portfolio={portfolio}
        actions={
          <>
            <RefreshIndicator
              updatedAt={quotesQuery.dataUpdatedAt}
              isFetching={quotesQuery.isFetching}
              onRefresh={() => void quotesQuery.refetch()}
            />
            <PortfolioActions portfolio={portfolio} />
          </>
        }
      />

      <div className='flex items-center gap-2'>
        <Combobox
          options={options}
          value={ticker}
          onValueChange={(value) => setTicker(value.toUpperCase())}
          placeholder='Adicionar ativo...'
          searchPlaceholder='Buscar ticker ou nome...'
          emptyText='Nenhum ativo encontrado.'
          className='w-full min-w-0 overflow-hidden sm:w-72'
        />
        <Button
          size='sm'
          className='shrink-0'
          aria-label='Adicionar ativo'
          onClick={handleAdd}
          disabled={!ticker || addWatchItem.isPending}
        >
          <Plus />
          <span className='hidden sm:inline'>Adicionar</span>
        </Button>
      </div>

      {watchItems.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Watchlist vazia</EmptyTitle>
            <EmptyDescription>
              Adicione ativos para acompanhar preço e variação diária, sem
              posição.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Table>
          <thead>
            <tr>
              <THeadCell>Ativo</THeadCell>
              <THeadCell className='hidden sm:table-cell'>Setor</THeadCell>
              <THeadCell className='text-right'>Preço atual</THeadCell>
              <THeadCell className='text-right'>Var. diária</THeadCell>
              <THeadCell />
            </tr>
          </thead>
          <tbody>
            {watchItems.map((item) => {
              const asset = findAsset(item.ticker);
              const quote = quoteByTicker.get(item.ticker);
              const dailyPercent = quote
                ? ((quote.price - quote.previousClose) / quote.previousClose) *
                  100
                : 0;

              return (
                <TRow key={item.id}>
                  <TCell>
                    <div className='flex flex-col'>
                      <span className='font-medium'>{item.ticker}</span>
                      <span className='text-xs text-muted'>
                        {asset?.name ?? '-'}
                      </span>
                    </div>
                  </TCell>
                  <TCell className='hidden text-muted sm:table-cell'>
                    {asset?.sector ?? '-'}
                  </TCell>
                  <TCell className='text-right'>
                    {quote ? formatPrice(quote.price) : '-'}
                  </TCell>
                  <TCell className='text-right'>
                    <PLValue value={dailyPercent} />
                  </TCell>
                  <TCell className='w-10 text-right'>
                    <Button
                      variant='ghost'
                      size='icon-sm'
                      aria-label={`Remover ${item.ticker}`}
                      onClick={() => removeWatchItem.mutate(item.id)}
                    >
                      <Trash2 className='text-error-text' />
                    </Button>
                  </TCell>
                </TRow>
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
}
