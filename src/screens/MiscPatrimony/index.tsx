import { useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  InputText,
  Skeleton,
  Text,
} from '@stellar-ui-kit/web';

import { Pencil, Plus, Trash2 } from 'lucide-react';

import type { PatrimonyItem } from '@/domain';
import {
  useAddPatrimonyItem,
  usePatrimonyItems,
  useRemovePatrimonyItem,
  useUpdatePatrimonyItem,
} from '@/hooks';
import { formatMoney } from '@/utils';

import { MoneyInput } from '@/components';

import { Table, TCell, THeadCell, TRow } from '@/screens/Portfolio/Table';

type ItemDialogProps = {
  item?: PatrimonyItem;
  onClose: () => void;
};

function ItemDialog({ item, onClose }: ItemDialogProps) {
  const isEdit = item !== undefined;
  const [name, setName] = useState(item?.name ?? '');
  const [value, setValue] = useState<number | null>(item?.value ?? null);
  const addItem = useAddPatrimonyItem();
  const updateItem = useUpdatePatrimonyItem();

  const parsedValue = value ?? 0;
  const isValid = name.trim() !== '' && parsedValue >= 0;
  const isPending = addItem.isPending || updateItem.isPending;

  const handleSubmit = () => {
    const input = { name: name.trim(), value: parsedValue };
    if (isEdit) {
      updateItem.mutate({ id: item.id, input }, { onSuccess: onClose });
      return;
    }
    addItem.mutate(input, { onSuccess: onClose });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-sm'>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar item' : 'Novo item'}</DialogTitle>
          <DialogDescription>
            Casa, reserva de emergência, veículo. O que fizer sentido pra você.
          </DialogDescription>
        </DialogHeader>

        <div className='flex flex-col gap-4'>
          <InputText
            label='Nome'
            placeholder='Ex.: Fundo de emergência'
            value={name}
            onChange={setName}
            required
          />
          <MoneyInput
            label='Valor (BRL)'
            value={value}
            onChange={setValue}
            required
          />
        </div>

        <DialogFooter>
          <Button variant='ghost' onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isPending}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MiscPatrimonyScreen() {
  const { data, isLoading } = usePatrimonyItems();
  const removeItem = useRemovePatrimonyItem();
  const [dialog, setDialog] = useState<'add' | PatrimonyItem | null>(null);

  const items = data ?? [];
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className='flex flex-col gap-5 sm:gap-6'>
      <header className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <Text as='h2' className='text-2xl sm:text-3xl'>
            Outros bens
          </Text>
          <Text as='p' styleVariant='muted' className='text-xs sm:text-sm'>
            Fora das carteiras. Só entra no patrimônio total da dashboard.
          </Text>
        </div>
        <Button size='sm' onClick={() => setDialog('add')}>
          <Plus />
          Adicionar
        </Button>
      </header>

      <div className='rounded-xl border border-border bg-surface px-4 py-3'>
        <Text as='p' styleVariant='muted' className='text-xs uppercase'>
          Total
        </Text>
        <Text as='p' className='text-xl font-semibold tabular-nums'>
          {formatMoney(total, 'BRL')}
        </Text>
      </div>

      {isLoading ? (
        <Skeleton className='h-48 w-full' />
      ) : items.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Nenhum item</EmptyTitle>
            <EmptyDescription>
              Adicione bens que não entram nas carteiras de investimento.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Table>
          <thead>
            <tr>
              <THeadCell>Nome</THeadCell>
              <THeadCell className='text-right'>Valor</THeadCell>
              <THeadCell />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <TRow key={item.id}>
                <TCell className='font-medium'>{item.name}</TCell>
                <TCell className='text-right'>
                  {formatMoney(item.value, 'BRL')}
                </TCell>
                <TCell className='w-20 text-right'>
                  <div className='flex justify-end gap-1'>
                    <Button
                      variant='ghost'
                      size='icon-sm'
                      aria-label={`Editar ${item.name}`}
                      onClick={() => setDialog(item)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon-sm'
                      aria-label={`Remover ${item.name}`}
                      onClick={() => removeItem.mutate(item.id)}
                    >
                      <Trash2 className='text-error-text' />
                    </Button>
                  </div>
                </TCell>
              </TRow>
            ))}
          </tbody>
        </Table>
      )}

      {dialog === 'add' && <ItemDialog onClose={() => setDialog(null)} />}
      {dialog !== null && dialog !== 'add' && (
        <ItemDialog item={dialog} onClose={() => setDialog(null)} />
      )}
    </div>
  );
}
