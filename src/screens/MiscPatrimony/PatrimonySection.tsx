import { Button, Text } from '@stellar-ui-kit/web';

import { Pencil, Trash2 } from 'lucide-react';

import type { PatrimonyItem, PatrimonyValuation } from '@/domain';
import { formatMoney } from '@/utils';

import { PLValue } from '@/components';

import { Table, TCell, THeadCell, TRow } from '@/screens/Portfolio/Table';

import { KIND_META } from './kinds';

type PatrimonySectionProps = {
  title: string;
  hint: string;
  items: PatrimonyValuation[];
  onEdit: (item: PatrimonyItem) => void;
  onRemove: (id: string) => void;
};

export function PatrimonySection({
  title,
  hint,
  items,
  onEdit,
  onRemove,
}: PatrimonySectionProps) {
  if (items.length === 0) return null;

  const total = items.reduce((sum, item) => sum + item.current, 0);

  return (
    <section className='flex flex-col gap-3'>
      <div className='flex items-baseline justify-between gap-2'>
        <Text as='h3' className='text-sm font-semibold'>
          {title}
        </Text>
        <Text as='span' styleVariant='muted' className='text-xs'>
          {hint}
        </Text>
      </div>

      <Table>
        <thead>
          <tr>
            <THeadCell>Nome</THeadCell>
            <THeadCell className='text-right'>Valor atual</THeadCell>
            <THeadCell className='text-right'>Variação</THeadCell>
            <THeadCell />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <TRow key={item.id}>
              <TCell>
                <span className='font-medium'>{item.name}</span>
                <span className='ml-2 text-xs text-muted'>
                  {KIND_META[item.kind].label}
                </span>
              </TCell>
              <TCell className='text-right tabular-nums'>
                {formatMoney(item.current, 'BRL')}
              </TCell>
              <TCell className='text-right'>
                {item.kind === 'cash' ? (
                  <span className='text-muted'>—</span>
                ) : (
                  <PLValue value={item.gain} currency='BRL' />
                )}
              </TCell>
              <TCell className='w-20 text-right'>
                <div className='flex justify-end gap-1'>
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    aria-label={`Editar ${item.name}`}
                    onClick={() => onEdit(item)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    aria-label={`Remover ${item.name}`}
                    onClick={() => onRemove(item.id)}
                  >
                    <Trash2 className='text-error-text' />
                  </Button>
                </div>
              </TCell>
            </TRow>
          ))}
        </tbody>
      </Table>

      <div className='flex items-baseline justify-between gap-2 px-1'>
        <Text as='span' styleVariant='muted' className='text-xs'>
          Total {title.toLowerCase()}
        </Text>
        <Text as='span' className='text-sm font-semibold tabular-nums'>
          {formatMoney(total, 'BRL')}
        </Text>
      </div>
    </section>
  );
}
