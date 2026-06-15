import { Card, CardContent, CardHeader, CardTitle } from '@stellar-ui-kit/web';

import { formatMoney, formatPercent } from '@/utils';

import { PLValue } from '@/components';

type ResultBreakdownCardProps = {
  invested: number;
  valorization: number;
  dividends: number;
  totalReturnBRL: number;
  totalReturnPercent: number;
};

export function ResultBreakdownCard({
  invested,
  valorization,
  dividends,
  totalReturnBRL,
  totalReturnPercent,
}: ResultBreakdownCardProps) {
  return (
    <Card className='gap-3 py-3 sm:py-4'>
      <CardHeader className='px-4 sm:px-5'>
        <CardTitle className='flex flex-wrap items-baseline justify-between gap-2 text-sm'>
          De onde veio o resultado
          <span className='text-xs font-normal text-muted'>
            retorno total {formatPercent(totalReturnPercent)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className='mt-0 flex flex-col gap-2 px-4 text-sm sm:px-5'>
        <div className='flex items-baseline justify-between gap-2'>
          <span className='text-muted'>Aporte (custo)</span>
          <span className='tabular-nums'>{formatMoney(invested, 'BRL')}</span>
        </div>
        <div className='flex items-baseline justify-between gap-2'>
          <span className='text-muted'>Valorização</span>
          <PLValue value={valorization} currency='BRL' className='text-sm' />
        </div>
        <div className='flex items-baseline justify-between gap-2'>
          <span className='text-muted'>Proventos</span>
          <span className='font-medium tabular-nums text-success-text'>
            {formatMoney(dividends, 'BRL', true)}
          </span>
        </div>
        <div className='mt-1 flex items-baseline justify-between gap-2 border-t border-border pt-2'>
          <span className='font-medium'>Retorno total</span>
          <PLValue
            value={totalReturnBRL}
            currency='BRL'
            percent={totalReturnPercent}
            className='text-sm'
          />
        </div>
      </CardContent>
    </Card>
  );
}
