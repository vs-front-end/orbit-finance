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
} from '@stellar-ui-kit/web';

import type { Portfolio } from '@/domain';
import { useAddFixedIncome } from '@/hooks';

import { MoneyInput } from '@/components';

type AddFixedIncomeDialogProps = {
  portfolio: Portfolio;
  onClose: () => void;
};

export function AddFixedIncomeDialog({
  portfolio,
  onClose,
}: AddFixedIncomeDialogProps) {
  const [name, setName] = useState('');
  const [principal, setPrincipal] = useState<number | null>(null);
  const [currentValue, setCurrentValue] = useState<number | null>(null);
  const [appliedAt, setAppliedAt] = useState<Date>(new Date());
  const [maturesAt, setMaturesAt] = useState<Date | undefined>(undefined);
  const addFixedIncome = useAddFixedIncome();

  const parsedPrincipal = principal ?? 0;
  const parsedCurrent = currentValue ?? parsedPrincipal;
  const isValid =
    name.trim() !== '' && parsedPrincipal > 0 && parsedCurrent > 0;

  const handleSubmit = () => {
    addFixedIncome.mutate(
      {
        portfolioId: portfolio.id,
        name: name.trim(),
        principal: parsedPrincipal,
        currentValue: parsedCurrent,
        appliedAt: appliedAt.toISOString(),
        maturesAt: maturesAt ? maturesAt.toISOString() : null,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='max-h-[90dvh] overflow-y-auto sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Nova renda fixa</DialogTitle>
          <DialogDescription>
            Informe o valor aplicado e o valor atual do extrato. Atualize o
            valor depois quando quiser.
          </DialogDescription>
        </DialogHeader>

        <div className='flex min-w-0 flex-col gap-4'>
          <InputText
            label='Nome'
            placeholder='Ex.: CDB Banco Inter'
            value={name}
            onChange={setName}
            required
          />

          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <MoneyInput
              label={`Valor aplicado (${portfolio.currency})`}
              value={principal}
              onChange={(value) => {
                setPrincipal(value);
                if (currentValue === null) setCurrentValue(value);
              }}
              required
            />
            <MoneyInput
              label={`Valor atual (${portfolio.currency})`}
              value={currentValue}
              onChange={setCurrentValue}
              required
            />
          </div>

          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <div className='min-w-0 space-y-2'>
              <Label>Data da aplicação</Label>
              <DatePicker
                date={appliedAt}
                onSelect={(selected) => selected && setAppliedAt(selected)}
                locale={ptBR}
                className='w-full min-w-0 overflow-hidden'
              />
            </div>
            <div className='min-w-0 space-y-2'>
              <Label>Vencimento (opcional)</Label>
              <DatePicker
                date={maturesAt}
                onSelect={setMaturesAt}
                placeholder='Sem vencimento'
                locale={ptBR}
                className='w-full min-w-0 overflow-hidden'
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant='ghost' onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || addFixedIncome.isPending}
          >
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
