import {
  Button,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@stellar-ui-kit/web';

import { Trash2 } from 'lucide-react';

import type { Portfolio } from '@/domain';
import {
  useAddWatchItem,
  useQuotes,
  useRemoveWatchItem,
  useWatchItems,
} from '@/hooks';
import { assetsService, findAsset, type AssetHit } from '@/services';
import { formatPrice } from '@/utils';

import { PLValue, RefreshIndicator } from '@/components';

import { AssetSearch } from './AssetSearch';
import { PortfolioActions } from './PortfolioActions';
import { PortfolioHeader } from './PortfolioHeader';
import { Table, TCell, THeadCell, TRow } from './Table';

export function WatchlistView({ portfolio }: { portfolio: Portfolio }) {
  const { data: items } = useWatchItems(portfolio.id);
  const watchItems = items ?? [];
  const quotesQuery = useQuotes(watchItems.map((item) => item.ticker));
  const addWatchItem = useAddWatchItem();
  const removeWatchItem = useRemoveWatchItem(portfolio.id);

  const quoteByTicker = new Map(
    (quotesQuery.data ?? []).map((quote) => [quote.ticker, quote]),
  );

  const handleSelect = (hit: AssetHit) => {
    if (watchItems.some((item) => item.ticker === hit.ticker)) return;
    void assetsService.register(hit).catch(() => {});
    addWatchItem.mutate({ portfolioId: portfolio.id, ticker: hit.ticker });
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

      <div className='w-full min-w-0 sm:w-72'>
        <AssetSearch
          currency={portfolio.currency}
          value=''
          onSelect={handleSelect}
        />
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
