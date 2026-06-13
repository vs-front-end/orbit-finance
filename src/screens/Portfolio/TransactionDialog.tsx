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
  Text,
} from '@stellar-ui-kit/web';

import {
  transactionSideSchema,
  type Portfolio,
  type Transaction,
  type TransactionSide,
} from '@/domain';
import { useAddTransaction, useUpdateTransaction } from '@/hooks';
import { assetsService, quotesService, type AssetHit } from '@/services';
import { formatQuantity, parseDecimal } from '@/utils';

import { MoneyInput } from '@/components';

import { AssetSearch } from './AssetSearch';

type TransactionDialogProps = {
  portfolio: Portfolio;
  transaction?: Transaction;
  initialTicker?: string;
  initialSide?: TransactionSide;
  onClose: () => void;
};

function toTimeValue(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function TransactionDialog({
  portfolio,
  transaction,
  initialTicker,
  initialSide,
  onClose,
}: TransactionDialogProps) {
  const isEdit = transaction !== undefined;
  const [ticker, setTicker] = useState(
    transaction?.ticker ?? initialTicker ?? '',
  );
  const [side, setSide] = useState<TransactionSide>(
    transaction?.side ?? initialSide ?? 'buy',
  );
  const [quantity, setQuantity] = useState(
    transaction ? formatQuantity(transaction.quantity) : '',
  );
  const [price, setPrice] = useState<number | null>(
    transaction?.unitPrice ?? null,
  );
  const [date, setDate] = useState<Date>(
    transaction ? new Date(transaction.executedAt) : new Date(),
  );
  const [time, setTime] = useState(() =>
    transaction
      ? toTimeValue(transaction.executedAt)
      : toTimeValue(new Date().toISOString()),
  );
  const [priceLoading, setPriceLoading] = useState(false);
  const addTransaction = useAddTransaction();
  const updateTransaction = useUpdateTransaction();

  const handleSelectAsset = async (hit: AssetHit) => {
    setTicker(hit.ticker);
    const { price, ...asset } = hit;
    void assetsService.register(asset).catch(() => {});

    if (price !== null) {
      setPrice(price);
      return;
    }

    setPriceLoading(true);
    try {
      const [quote] = await quotesService.getQuotes([hit.ticker]);
      if (quote) setPrice(quote.price);
    } finally {
      setPriceLoading(false);
    }
  };

  const parsedQuantity = parseDecimal(quantity);
  const parsedPrice = price ?? 0;
  const isValid = ticker !== '' && parsedQuantity > 0 && parsedPrice > 0;
  const isPending = addTransaction.isPending || updateTransaction.isPending;

  const handleSubmit = () => {
    const executedAt = new Date(date);
    const [hours = 0, minutes = 0] = time.split(':').map(Number);
    executedAt.setHours(hours, minutes, 0, 0);

    const payload = {
      side,
      quantity: parsedQuantity,
      unitPrice: parsedPrice,
      executedAt: executedAt.toISOString(),
    };

    if (isEdit) {
      updateTransaction.mutate(
        { id: transaction.id, input: payload },
        { onSuccess: onClose },
      );
      return;
    }

    addTransaction.mutate(
      {
        portfolioId: portfolio.id,
        ticker: ticker.toUpperCase(),
        ...payload,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='max-h-[90dvh] overflow-y-auto sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Editar transação' : 'Nova transação'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Ajuste tipo, quantidade, preço ou data da operação.'
              : 'Registre a compra ou venda com data/hora e preço de execução.'}
          </DialogDescription>
        </DialogHeader>

        <div className='flex min-w-0 flex-col gap-4'>
          {isEdit ? (
            <div className='space-y-1'>
              <Label>Ativo</Label>
              <Text as='p' className='font-medium'>
                {transaction.ticker}
              </Text>
            </div>
          ) : (
            <div className='min-w-0 space-y-2'>
              <Label>Ativo</Label>
              <AssetSearch
                currency={portfolio.currency}
                value={ticker}
                onSelect={handleSelectAsset}
              />
            </div>
          )}

          <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
            <div className='space-y-2'>
              <Label>Tipo</Label>
              <Select
                value={side}
                onValueChange={(value) =>
                  setSide(transactionSideSchema.parse(value))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='buy'>Compra</SelectItem>
                  <SelectItem value='sell'>Venda</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <InputText
              label='Quantidade'
              placeholder='0,00'
              value={quantity}
              onChange={setQuantity}
              required
            />
            <MoneyInput
              label={`Preço (${portfolio.currency})`}
              value={price}
              onChange={setPrice}
              helperText={priceLoading ? 'Buscando preço atual...' : undefined}
              required
            />
          </div>

          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <div className='min-w-0 space-y-2'>
              <Label>Data</Label>
              <DatePicker
                date={date}
                onSelect={(selected) => selected && setDate(selected)}
                locale={ptBR}
                className='w-full min-w-0 overflow-hidden'
              />
            </div>
            <InputText
              label='Hora'
              type='time'
              value={time}
              onChange={setTime}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant='ghost' onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isPending}>
            {isEdit
              ? 'Salvar'
              : side === 'buy'
                ? 'Registrar compra'
                : 'Registrar venda'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
