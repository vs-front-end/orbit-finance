import { useState } from 'react';

import { ptBR } from 'date-fns/locale';

import {
  Button,
  DatePicker,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  InputText,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@stellar-ui-kit/web';

import {
  patrimonyKindSchema,
  type PatrimonyItem,
  type PatrimonyKind,
} from '@/domain';
import { useAddPatrimonyItem, useUpdatePatrimonyItem } from '@/hooks';
import { parseDecimal } from '@/utils';

import { MoneyInput } from '@/components';

import { KIND_META, KIND_ORDER } from './kinds';

type ItemDialogProps = {
  item?: PatrimonyItem;
  onClose: () => void;
};

export function ItemDialog({ item, onClose }: ItemDialogProps) {
  const isEdit = item !== undefined;
  const [kind, setKind] = useState<PatrimonyKind>(item?.kind ?? 'cash');
  const [name, setName] = useState(item?.name ?? '');
  const [value, setValue] = useState<number | null>(item?.value ?? null);
  const initialRate = item?.cdiPercent ?? item?.annualRate ?? null;
  const [rate, setRate] = useState(
    initialRate != null ? String(initialRate) : '',
  );
  const [referenceDate, setReferenceDate] = useState<Date>(
    item?.referenceDate
      ? new Date(`${item.referenceDate}T00:00:00`)
      : new Date(),
  );

  const addItem = useAddPatrimonyItem();
  const updateItem = useUpdatePatrimonyItem();
  const isPending = addItem.isPending || updateItem.isPending;

  const parsedValue = value ?? 0;
  const parsedRate = parseDecimal(rate);
  const meta = KIND_META[kind];
  const isReserve = kind === 'reserve';
  const isAsset = kind === 'property' || kind === 'vehicle';
  const rateLabel: Record<PatrimonyKind, string> = {
    cash: '',
    reserve: '% do CDI',
    property: 'Valorização anual (%)',
    vehicle: 'Depreciação anual (%)',
  };

  const isValid =
    name.trim() !== '' &&
    parsedValue > 0 &&
    (kind === 'cash' || parsedRate > 0);

  const handleKindChange = (next: PatrimonyKind) => {
    setKind(next);
    if (!isEdit) setRate(KIND_META[next].defaultRate ?? '');
  };

  const handleSubmit = () => {
    const refIso = referenceDate.toISOString().slice(0, 10);
    const input = {
      name: name.trim(),
      kind,
      value: parsedValue,
      referenceDate: kind === 'cash' ? null : refIso,
      cdiPercent: isReserve ? parsedRate : null,
      annualRate: isAsset ? parsedRate : null,
    };

    if (isEdit) {
      updateItem.mutate({ id: item.id, input }, { onSuccess: onClose });
      return;
    }
    addItem.mutate(input, { onSuccess: onClose });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar bem' : 'Novo bem'}</DialogTitle>
          <DialogDescription>
            Reserva rende pelo CDI; imóvel e veículo evoluem pela taxa anual.
          </DialogDescription>
        </DialogHeader>

        <div className='flex min-w-0 flex-col gap-4'>
          <div className='space-y-2'>
            <Label>Tipo</Label>
            <Select
              value={kind}
              onValueChange={(next) =>
                handleKindChange(patrimonyKindSchema.parse(next))
              }
            >
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KIND_ORDER.map((option) => (
                  <SelectItem key={option} value={option}>
                    {KIND_META[option].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <InputText
            label='Nome'
            placeholder='Ex.: Reserva de emergência'
            value={name}
            onChange={setName}
            required
          />

          <MoneyInput
            label={meta.valueLabel}
            value={value}
            onChange={setValue}
            required
          />

          {kind !== 'cash' && (
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <InputText
                label={rateLabel[kind]}
                placeholder='0'
                value={rate}
                onChange={setRate}
                required
              />
              <div className='min-w-0 space-y-2'>
                <Label>
                  {isReserve ? 'Data da aplicação' : 'Data de referência'}
                </Label>
                <DatePicker
                  date={referenceDate}
                  onSelect={(selected) =>
                    selected && setReferenceDate(selected)
                  }
                  locale={ptBR}
                  className='w-full min-w-0 overflow-hidden'
                />
              </div>
            </div>
          )}
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
