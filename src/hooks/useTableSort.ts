import { useMemo, useState } from 'react';

export type SortDir = 'asc' | 'desc';

type Accessors<T> = Record<string, (row: T) => number | string>;

// Ordenação de tabela por coluna: 1º clique desc, 2º asc, alterna depois.
export function useTableSort<T>(
  rows: T[],
  accessors: Accessors<T>,
  initial?: { key: string; dir: SortDir },
) {
  const [sort, setSort] = useState<{ key: string; dir: SortDir } | null>(
    initial ?? null,
  );

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const accessor = accessors[sort.key];
    if (!accessor) return rows;

    const factor = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const va = accessor(a);
      const vb = accessor(b);
      if (typeof va === 'number' && typeof vb === 'number') {
        return (va - vb) * factor;
      }
      return String(va).localeCompare(String(vb), 'pt-BR') * factor;
    });
  }, [rows, sort, accessors]);

  const onSort = (key: string) =>
    setSort((prev) =>
      prev?.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'desc' },
    );

  return {
    sorted,
    sortKey: sort?.key ?? null,
    sortDir: sort?.dir ?? null,
    onSort,
  };
}
