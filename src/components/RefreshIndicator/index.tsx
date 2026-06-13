import { cn } from '@stellar-ui-kit/shared';
import { Button } from '@stellar-ui-kit/web';

import { RefreshCw } from 'lucide-react';

import { formatTime } from '@/utils';

type RefreshIndicatorProps = {
  updatedAt: number;
  isFetching: boolean;
  onRefresh: () => void;
};

export function RefreshIndicator({
  updatedAt,
  isFetching,
  onRefresh,
}: RefreshIndicatorProps) {
  return (
    <div className='flex items-center gap-2'>
      <span className='whitespace-nowrap text-xs text-muted'>
        {updatedAt > 0
          ? `Atualizado às ${formatTime(new Date(updatedAt))}`
          : 'Sem cotações'}
      </span>

      <Button
        variant='outline'
        size='icon-sm'
        onClick={onRefresh}
        disabled={isFetching}
        aria-label='Atualizar cotações'
      >
        <RefreshCw className={cn(isFetching && 'animate-spin')} />
      </Button>
    </div>
  );
}
