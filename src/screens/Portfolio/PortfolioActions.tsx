import { useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  InputText,
} from '@stellar-ui-kit/web';

import { MoreVertical, Pencil, Trash2 } from 'lucide-react';

import type { Portfolio } from '@/domain';
import { useRemovePortfolio, useRenamePortfolio } from '@/hooks';

export function PortfolioActions({ portfolio }: { portfolio: Portfolio }) {
  const [dialog, setDialog] = useState<'rename' | 'delete' | null>(null);
  const [name, setName] = useState(portfolio.name);
  const renamePortfolio = useRenamePortfolio();
  const removePortfolio = useRemovePortfolio();

  const closeDialog = () => setDialog(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='outline'
            size='icon-sm'
            aria-label='Ações da carteira'
          >
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuItem
            onClick={() => {
              setName(portfolio.name);
              setDialog('rename');
            }}
          >
            <Pencil />
            Renomear
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant='destructive'
            onClick={() => setDialog('delete')}
          >
            <Trash2 />
            Excluir carteira
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={dialog === 'rename'}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader>
            <DialogTitle>Renomear carteira</DialogTitle>
          </DialogHeader>
          <InputText label='Nome' value={name} onChange={setName} required />
          <DialogFooter>
            <Button variant='ghost' onClick={closeDialog}>
              Cancelar
            </Button>
            <Button
              disabled={!name.trim() || renamePortfolio.isPending}
              onClick={() =>
                renamePortfolio.mutate(
                  { id: portfolio.id, name: name.trim() },
                  { onSuccess: closeDialog },
                )
              }
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialog === 'delete'}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader>
            <DialogTitle>Excluir carteira</DialogTitle>
            <DialogDescription>
              "{portfolio.name}" e todas as suas transações serão removidas.
              Essa ação não tem volta.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='ghost' onClick={closeDialog}>
              Cancelar
            </Button>
            <Button
              variant='destructive'
              disabled={removePortfolio.isPending}
              onClick={() => removePortfolio.mutate(portfolio.id)}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
