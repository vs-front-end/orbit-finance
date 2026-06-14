import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@stellar-ui-kit/web';

import { useDividendsOverview } from '@/hooks';
import { formatMoney } from '@/utils';

export function DividendsCard() {
  const { perPortfolio, totalBRL, taxBRL, isLoading } = useDividendsOverview();

  return (
    <Card className='gap-3 py-3 sm:py-4'>
      <CardHeader className='px-4 sm:px-5'>
        <CardTitle className='flex flex-wrap items-baseline justify-between gap-2 text-sm'>
          Proventos recebidos
          <span className='text-xs font-normal text-muted'>
            líquido de IR · histórico
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className='mt-0 px-4 sm:px-5'>
        {isLoading ? (
          <Skeleton className='h-32 w-full' />
        ) : perPortfolio.length === 0 ? (
          <p className='py-4 text-center text-sm text-muted'>
            Nenhum provento recebido ainda.
          </p>
        ) : (
          <div className='flex flex-col gap-2'>
            {perPortfolio.map((entry) => (
              <div
                key={entry.portfolioId}
                className='flex items-baseline justify-between gap-2 text-sm'
              >
                <span className='min-w-0 truncate'>{entry.name}</span>
                <span className='font-medium text-success-text'>
                  {entry.currency === 'USD' && (
                    <span className='mr-1 text-xs font-normal text-muted'>
                      ({formatMoney(entry.total, 'USD')})
                    </span>
                  )}
                  {formatMoney(entry.totalBRL, 'BRL')}
                </span>
              </div>
            ))}
            <div className='mt-1 flex items-baseline justify-between gap-2 border-t border-border pt-2 text-sm'>
              <span className='font-medium'>Total (BRL)</span>
              <span className='font-semibold text-success-text'>
                {formatMoney(totalBRL, 'BRL')}
              </span>
            </div>
            {taxBRL > 0 && (
              <div className='flex items-baseline justify-between gap-2 text-xs text-muted'>
                <span>IR pago (BRL)</span>
                <span>{formatMoney(taxBRL, 'BRL')}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
