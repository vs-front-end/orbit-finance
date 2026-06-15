import { Card, CardContent, CardHeader, CardTitle } from '@stellar-ui-kit/web';

import { cn } from '@stellar-ui-kit/shared';

import type { PositionMover } from '@/hooks';

import { PLValue } from '@/components';

type TopMoversCardProps = {
  title: string;
  movers: PositionMover[];
};

export function TopMoversCard({ title, movers }: TopMoversCardProps) {
  const maxPercent = Math.max(
    ...movers.map((mover) => Math.abs(mover.view.netPLPercent)),
    1,
  );

  return (
    <Card className='gap-3 py-3 sm:py-4'>
      <CardHeader className='px-4 sm:px-5'>
        <CardTitle className='text-sm'>{title}</CardTitle>
      </CardHeader>
      <CardContent className='mt-0 px-4 sm:px-5'>
        {movers.length === 0 ? (
          <span className='text-sm text-muted'>Nada por aqui.</span>
        ) : (
          <ul className='flex flex-col gap-2.5'>
            {movers.map(({ view, currency, portfolioName }) => (
              <li
                key={`${portfolioName}-${view.ticker}`}
                className='flex flex-col gap-1'
              >
                <div className='flex items-baseline justify-between gap-2 text-sm'>
                  <span className='min-w-0 truncate'>
                    <span className='font-medium'>{view.ticker}</span>
                    <span className='ml-1.5 text-xs text-muted'>
                      {portfolioName}
                    </span>
                  </span>
                  <PLValue
                    value={view.netPL}
                    currency={currency}
                    percent={view.netPLPercent}
                    className='shrink-0 text-xs sm:text-sm'
                  />
                </div>
                <div className='h-1.5 w-full overflow-hidden rounded-full bg-background'>
                  <div
                    className={cn(
                      'h-full rounded-full',
                      view.netPL >= 0 ? 'bg-success' : 'bg-error',
                    )}
                    style={{
                      width: `${(Math.abs(view.netPLPercent) / maxPercent) * 100}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
