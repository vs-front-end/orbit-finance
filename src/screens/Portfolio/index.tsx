import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Skeleton,
} from '@stellar-ui-kit/web';

import { usePortfolio } from '@/hooks';

import { InvestmentView } from './InvestmentView';
import { PortfolioSkeleton } from './PortfolioSkeleton';
import { WatchlistView } from './WatchlistView';

export function PortfolioScreen({ portfolioId }: { portfolioId: string }) {
  const { data: portfolio, isLoading } = usePortfolio(portfolioId);

  if (isLoading) {
    return (
      <div className='flex flex-col gap-4 sm:gap-5'>
        <Skeleton className='h-10 w-64' />
        <PortfolioSkeleton />
      </div>
    );
  }

  if (!portfolio) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Carteira não encontrada</EmptyTitle>
          <EmptyDescription>Ela pode ter sido excluída.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return portfolio.kind === 'investment' ? (
    <InvestmentView portfolio={portfolio} />
  ) : (
    <WatchlistView portfolio={portfolio} />
  );
}
