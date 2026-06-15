import { Link } from '@tanstack/react-router';

import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@stellar-ui-kit/web';

import type { PLSummary, Portfolio } from '@/domain';
import { formatMoney } from '@/utils';

import { PLValue } from '@/components';

type PortfolioCardProps = {
  portfolio: Portfolio;
  summary: PLSummary;
  positionCount: number;
};

export function PortfolioCard({
  portfolio,
  summary,
  positionCount,
}: PortfolioCardProps) {
  return (
    <Link
      to='/carteiras/$portfolioId'
      params={{ portfolioId: portfolio.id }}
      className='group'
    >
      <Card className='h-full gap-3 py-3 transition-colors group-hover:border-primary sm:py-4'>
        <CardHeader className='px-4 sm:px-5'>
          <CardTitle className='flex items-center justify-between gap-2 text-sm sm:text-base'>
            <span className='truncate'>{portfolio.name}</span>
            <Badge variant='outline'>{portfolio.currency}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className='mt-0 flex flex-col gap-1.5 px-4 sm:px-5'>
          <span className='text-base font-semibold tabular-nums sm:text-lg'>
            {formatMoney(summary.marketValue, portfolio.currency)}
          </span>
          <div className='flex items-center justify-between gap-2 text-sm'>
            <span className='text-muted'>Pos. abertas</span>
            <PLValue
              value={summary.netPL}
              currency={portfolio.currency}
              percent={summary.netPLPercent}
              className='text-sm'
            />
          </div>
          <div className='flex items-center justify-between gap-2 text-sm'>
            <span className='text-muted'>P/L diário</span>
            <PLValue
              value={summary.dailyPL}
              currency={portfolio.currency}
              percent={summary.dailyPLPercent}
              className='text-sm'
            />
          </div>
          <span className='mt-1 text-xs text-muted'>
            {positionCount} {positionCount === 1 ? 'posição' : 'posições'}
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
