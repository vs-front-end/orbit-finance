import { Button, Text } from '@stellar-ui-kit/web';
import { Plus } from 'lucide-react';

import { RefreshIndicator } from '@/components';

type DashboardHeaderProps = {
  updatedAt: number;
  isFetching: boolean;
  onRefresh: () => void;
  onNewPortfolio: () => void;
};

export function DashboardHeader({
  updatedAt,
  isFetching,
  onRefresh,
  onNewPortfolio,
}: DashboardHeaderProps) {
  return (
    <header className='flex flex-wrap items-end justify-between gap-3'>
      <div>
        <Text as='h2' className='text-2xl sm:text-3xl'>
          Dashboard
        </Text>
        <Text as='p' styleVariant='muted' className='text-xs sm:text-sm'>
          Visão consolidada em BRL (câmbio USD/BRL atual)
        </Text>
      </div>
      <div className='ml-auto flex items-center justify-end gap-2'>
        <RefreshIndicator
          updatedAt={updatedAt}
          isFetching={isFetching}
          onRefresh={onRefresh}
        />
        <Button size='sm' aria-label='Nova carteira' onClick={onNewPortfolio}>
          <Plus />
          <span className='hidden sm:inline'>Nova carteira</span>
        </Button>
      </div>
    </header>
  );
}
