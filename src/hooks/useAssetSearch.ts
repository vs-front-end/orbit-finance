import { useEffect, useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import type { Currency } from '@/domain';
import { assetsService } from '@/services';

export function useAssetSearch(query: string, currency: Currency) {
  const [debounced, setDebounced] = useState(query);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(id);
  }, [query]);

  const enabled = debounced.trim().length >= 2;

  const search = useQuery({
    queryKey: ['asset-search', currency, debounced],
    queryFn: () => assetsService.search(debounced, currency),
    enabled,
    staleTime: 60_000,
  });

  return {
    results: search.data ?? [],
    isSearching: enabled && search.isFetching,
  };
}
