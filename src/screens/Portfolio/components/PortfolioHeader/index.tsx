import { Badge, Text } from '@stellar-ui-kit/web';

import type { Portfolio } from '@/domain';

type PortfolioHeaderProps = {
  portfolio: Portfolio;
  actions?: React.ReactNode;
};

export function PortfolioHeader({ portfolio, actions }: PortfolioHeaderProps) {
  return (
    <header className='flex flex-wrap items-center justify-between gap-x-4 gap-y-3'>
      <div className='flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5'>
        <Text as='h2' className='truncate text-xl sm:text-2xl'>
          {portfolio.name}
        </Text>
        <Badge variant='outline'>{portfolio.currency}</Badge>
        <Badge
          variant={portfolio.kind === 'investment' ? 'secondary' : 'warning'}
        >
          {portfolio.kind === 'investment' ? 'Investimento' : 'Watchlist'}
        </Badge>
      </div>
      {actions && (
        <div className='ml-auto flex items-center justify-end gap-2'>
          {actions}
        </div>
      )}
    </header>
  );
}
