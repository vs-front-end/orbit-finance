import { Text } from '@stellar-ui-kit/web';

import { RefreshIndicator } from '@/components';

type DashboardHeaderProps = {
  updatedAt: number;
  isFetching: boolean;
  onRefresh: () => void;
};

export function DashboardHeader({
  updatedAt,
  isFetching,
  onRefresh,
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
      <div className='ml-auto'>
        <RefreshIndicator
          updatedAt={updatedAt}
          isFetching={isFetching}
          onRefresh={onRefresh}
        />
      </div>
    </header>
  );
}
