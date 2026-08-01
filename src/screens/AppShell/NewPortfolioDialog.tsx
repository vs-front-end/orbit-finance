import { useState } from 'react';
import { useCreatePortfolio } from '@/hooks';

import {
  Button,
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

import { currencySchema, type Currency } from '@/domain';

type NewPortfolioDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NewPortfolioDialog({
  open,
  onOpenChange,
}: NewPortfolioDialogProps) {
  const createPortfolio = useCreatePortfolio();

  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<Currency>('BRL');

  const handleCreate = () => {
    createPortfolio.mutate(
      { name: name.trim(), currency },
      {
        onSuccess: () => {
          setName('');
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90dvh] overflow-y-auto sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Nova carteira</DialogTitle>
          <DialogDescription>
            Organize suas posições e acompanhe o P/L.
          </DialogDescription>
        </DialogHeader>

        <div className='flex flex-col gap-4'>
          <InputText
            label='Nome'
            placeholder="Ex.: FII's, Cripto, Oportunidades..."
            value={name}
            onChange={setName}
            required
          />

          <div className='space-y-2'>
            <Label>Moeda</Label>
            <Select
              value={currency}
              onValueChange={(value) =>
                setCurrency(currencySchema.parse(value))
              }
            >
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='BRL'>BRL (R$)</SelectItem>
                <SelectItem value='USD'>USD ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant='ghost' onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || createPortfolio.isPending}
          >
            Criar carteira
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
