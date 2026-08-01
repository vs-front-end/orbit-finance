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

import type { Currency, LedgerDividend } from '@/domain';
import { useEditDividend } from '@/hooks';
import { toTradeDateIso, tradeDateOf } from '@/utils';

import { MoneyInput } from '@/components';

const LABELS = ['RENDIMENTO', 'DIVIDENDO', 'JRS CAP PROPRIO'];

type DividendDialogProps = {
  dividend: LedgerDividend;
  currency: Currency;
  onClose: () => void;
};

export function DividendDialog({
  dividend,
  currency,
  onClose,
}: DividendDialogProps) {
  const [paymentDate, setPaymentDate] = useState(() =>
    tradeDateOf(`${dividend.paymentDate}T12:00:00.000Z`),
  );
  const [label, setLabel] = useState(dividend.label || 'RENDIMENTO');
  const [received, setReceived] = useState<number | null>(dividend.received);
  const [tax, setTax] = useState<number | null>(dividend.tax);

  const editDividend = useEditDividend();

  const handleSubmit = () => {
    editDividend.mutate(
      {
        id: dividend.id,
        input: {
          paymentDate: toTradeDateIso(paymentDate, '12:00').slice(0, 10),
          label,
          received: received ?? 0,
          tax: tax ?? 0,
        },
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>
            {dividend.ticker} · {dividend.exDate}
          </DialogTitle>
          <DialogDescription>
            Ajuste o que a apuração automática não acertou. A linha passa a ser
            fixa e nunca mais é recalculada.
          </DialogDescription>
        </DialogHeader>

        <div className='flex flex-col gap-4'>
          <div className='space-y-2'>
            <Label>Tipo</Label>
            <Select value={label} onValueChange={setLabel}>
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LABELS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label>Data de pagamento</Label>
            <DatePicker
              date={paymentDate}
              onSelect={(selected) => selected && setPaymentDate(selected)}
              locale={ptBR}
              className='w-full'
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <MoneyInput
              label={`Recebido (${currency})`}
              value={received}
              onChange={setReceived}
            />
            <MoneyInput
              label={`IR (${currency})`}
              value={tax}
              onChange={setTax}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant='ghost' onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={editDividend.isPending}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
