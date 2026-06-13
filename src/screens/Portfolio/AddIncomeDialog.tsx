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
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@stellar-ui-kit/web';

import type { Portfolio } from '@/domain';
import { useAddIncome } from '@/hooks';

import { MoneyInput } from '@/components';

type AddIncomeDialogProps = {
  portfolio: Portfolio;
  tickers: string[];
  onClose: () => void;
};

export function AddIncomeDialog({
  portfolio,
  tickers,
  onClose,
}: AddIncomeDialogProps) {
  const [ticker, setTicker] = useState(tickers[0] ?? '');
  const [amount, setAmount] = useState<number | null>(null);
  const [receivedAt, setReceivedAt] = useState<Date>(new Date());
  const addIncome = useAddIncome();

  const parsedAmount = amount ?? 0;
  const isValid = ticker !== '' && parsedAmount > 0;

  const handleSubmit = () => {
    addIncome.mutate(
      {
        portfolioId: portfolio.id,
        ticker,
        amount: parsedAmount,
        receivedAt: receivedAt.toISOString(),
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='max-h-[90dvh] overflow-y-auto sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Novo provento</DialogTitle>
          <DialogDescription>
            Dividendos, JCP ou rendimentos recebidos de uma posição.
          </DialogDescription>
        </DialogHeader>

        <div className='flex min-w-0 flex-col gap-4'>
          <div className='space-y-2'>
            <Label>Ativo</Label>
            <Select value={ticker} onValueChange={setTicker}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Selecionar ativo...' />
              </SelectTrigger>
              <SelectContent>
                {tickers.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <MoneyInput
              label={`Valor recebido (${portfolio.currency})`}
              value={amount}
              onChange={setAmount}
              required
            />
            <div className='min-w-0 space-y-2'>
              <Label>Data</Label>
              <DatePicker
                date={receivedAt}
                onSelect={(selected) => selected && setReceivedAt(selected)}
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
            disabled={!isValid || addIncome.isPending}
          >
            Registrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
