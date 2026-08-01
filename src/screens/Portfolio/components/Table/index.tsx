import { cn } from '@stellar-ui-kit/shared';

import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';

import type { SortDir } from '@/hooks';

export function Table({ className, ...props }: React.ComponentProps<'table'>) {
  return (
    <div className='overflow-x-auto rounded-xl border border-border bg-surface'>
      <table
        className={cn('w-full text-xs sm:text-sm', className)}
        {...props}
      />
    </div>
  );
}

export function THeadCell({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      className={cn(
        'whitespace-nowrap border-b border-border px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted',
        className,
      )}
      {...props}
    />
  );
}

type SortableThProps = {
  label: string;
  columnKey: string;
  sortKey: string | null;
  sortDir: SortDir | null;
  onSort: (key: string) => void;
  align?: 'left' | 'right';
  className?: string;
};

export function SortableTh({
  label,
  columnKey,
  sortKey,
  sortDir,
  onSort,
  align = 'left',
  className,
}: SortableThProps) {
  const active = sortKey === columnKey;
  const Icon = !active
    ? ChevronsUpDown
    : sortDir === 'asc'
      ? ArrowUp
      : ArrowDown;
  const icon = (
    <Icon className={cn('size-3', active ? 'text-foreground' : 'opacity-40')} />
  );

  return (
    <THeadCell className={className}>
      <button
        type='button'
        onClick={() => onSort(columnKey)}
        className={cn(
          'inline-flex w-full items-center gap-1 uppercase tracking-wide transition-colors hover:text-foreground',
          align === 'right' ? 'justify-end' : 'justify-start',
        )}
      >
        {align === 'right' && icon}
        {label}
        {align === 'left' && icon}
      </button>
    </THeadCell>
  );
}

export function TRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      className={cn(
        'border-b border-border transition-colors last:border-0 hover:bg-background',
        className,
      )}
      {...props}
    />
  );
}

export function TCell({ className, ...props }: React.ComponentProps<'td'>) {
  return (
    <td
      className={cn('whitespace-nowrap px-3 py-2 tabular-nums', className)}
      {...props}
    />
  );
}
