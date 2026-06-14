import { useState } from 'react';

import {
  Button,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Skeleton,
  Text,
} from '@stellar-ui-kit/web';

import { Plus } from 'lucide-react';

import type { PatrimonyItem } from '@/domain';
import { usePatrimony, useRemovePatrimonyItem } from '@/hooks';
import { formatMoney } from '@/utils';

import { ItemDialog } from './ItemDialog';
import { PatrimonySection } from './PatrimonySection';

export function MiscPatrimonyScreen() {
  const { financial, assets, financialTotal, assetsTotal, isLoading } =
    usePatrimony();
  const removeItem = useRemovePatrimonyItem();
  const [dialog, setDialog] = useState<'add' | PatrimonyItem | null>(null);

  const isEmpty = financial.length === 0 && assets.length === 0;

  return (
    <div className='flex flex-col gap-5 sm:gap-6'>
      <header className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <Text as='h2' className='text-2xl sm:text-3xl'>
            Patrimônio
          </Text>
          <Text as='p' styleVariant='muted' className='text-xs sm:text-sm'>
            Caixa e reserva somam ao patrimônio; imóvel e veículo entram à
            parte.
          </Text>
        </div>
        <Button size='sm' onClick={() => setDialog('add')}>
          <Plus />
          Adicionar
        </Button>
      </header>

      <div className='grid grid-cols-1 gap-3 sm:gap-4 xs:grid-cols-2'>
        <div className='rounded-xl border border-border bg-surface px-4 py-3'>
          <Text as='p' styleVariant='muted' className='text-xs uppercase'>
            Financeiro (no patrimônio)
          </Text>
          <Text as='p' className='text-xl font-semibold tabular-nums'>
            {formatMoney(financialTotal, 'BRL')}
          </Text>
        </div>
        <div className='rounded-xl border border-border bg-surface px-4 py-3'>
          <Text as='p' styleVariant='muted' className='text-xs uppercase'>
            Bens (à parte)
          </Text>
          <Text as='p' className='text-xl font-semibold tabular-nums'>
            {formatMoney(assetsTotal, 'BRL')}
          </Text>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className='h-48 w-full' />
      ) : isEmpty ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Nenhum bem</EmptyTitle>
            <EmptyDescription>
              Adicione caixa, reserva, imóvel ou veículo.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className='flex flex-col gap-6'>
          <PatrimonySection
            title='Financeiro'
            hint='soma no patrimônio'
            items={financial}
            onEdit={setDialog}
            onRemove={(id) => removeItem.mutate(id)}
          />
          <PatrimonySection
            title='Bens'
            hint='não soma no patrimônio'
            items={assets}
            onEdit={setDialog}
            onRemove={(id) => removeItem.mutate(id)}
          />
        </div>
      )}

      {dialog === 'add' && <ItemDialog onClose={() => setDialog(null)} />}
      {dialog !== null && dialog !== 'add' && (
        <ItemDialog item={dialog} onClose={() => setDialog(null)} />
      )}
    </div>
  );
}
