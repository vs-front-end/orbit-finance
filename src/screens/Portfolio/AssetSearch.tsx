import { useState } from 'react';

import {
  Button,
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Spinner,
} from '@stellar-ui-kit/web';

import { cn } from '@stellar-ui-kit/shared';

import { Check, ChevronsUpDown } from 'lucide-react';

import type { Currency } from '@/domain';
import { useAssetSearch } from '@/hooks';
import type { AssetHit } from '@/services';

type AssetSearchProps = {
  currency: Currency;
  value: string;
  onSelect: (hit: AssetHit) => void;
};

export function AssetSearch({ currency, value, onSelect }: AssetSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { results, isSearching } = useAssetSearch(query, currency);

  const showEmpty =
    !isSearching && query.trim().length >= 2 && results.length === 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          className='w-full justify-between font-normal'
        >
          <span className={cn('truncate', !value && 'text-muted')}>
            {value || 'Buscar ativo...'}
          </span>
          <ChevronsUpDown className='ml-2 size-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align='start'
        className='w-[var(--radix-popover-trigger-width)] p-0'
      >
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder='Digite ticker ou nome...'
          />
          <CommandList>
            {isSearching && (
              <div className='flex items-center gap-2 px-3 py-4 text-sm text-muted'>
                <Spinner className='size-4' />
                Buscando...
              </div>
            )}
            {showEmpty && <CommandEmpty>Nenhum ativo encontrado.</CommandEmpty>}
            {query.trim().length < 2 && !isSearching && (
              <div className='px-3 py-4 text-sm text-muted'>
                Digite ao menos 2 caracteres.
              </div>
            )}
            {results.map((hit) => (
              <CommandItem
                key={`${hit.assetClass}-${hit.ticker}`}
                value={`${hit.assetClass}-${hit.ticker}`}
                onSelect={() => {
                  onSelect(hit);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    'mr-2 size-4 shrink-0',
                    value === hit.ticker ? 'opacity-100' : 'opacity-0',
                  )}
                />
                <div className='flex min-w-0 flex-col'>
                  <span className='font-medium'>{hit.ticker}</span>
                  <span className='truncate text-xs text-muted'>
                    {hit.name}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
