import { Card, CardContent, CardHeader, CardTitle } from '@stellar-ui-kit/web';

import type { AssetDividend, MonthlyDividend } from '@/hooks';
import { formatMoney } from '@/utils';

import { MonthlyBars } from './MonthlyBars';

type DividendsReportCardProps = {
  monthly: MonthlyDividend[];
  byAsset: AssetDividend[];
  totalBRL: number;
  taxBRL: number;
};

export function DividendsReportCard({
  monthly,
  byAsset,
  totalBRL,
  taxBRL,
}: DividendsReportCardProps) {
  if (totalBRL === 0) {
    return (
      <Card className='gap-3 py-3 sm:py-4'>
        <CardHeader className='px-4 sm:px-5'>
          <CardTitle className='text-sm'>Proventos</CardTitle>
        </CardHeader>
        <CardContent className='mt-0 px-4 py-4 text-center sm:px-5'>
          <p className='text-sm text-muted'>Nenhum provento recebido ainda.</p>
        </CardContent>
      </Card>
    );
  }

  const topAssets = byAsset.slice(0, 6);
  const maxAsset = Math.max(...topAssets.map((asset) => asset.valueBRL), 1);

  return (
    <Card className='gap-3 py-3 sm:py-4'>
      <CardHeader className='px-4 sm:px-5'>
        <CardTitle className='text-sm'>Proventos por mês</CardTitle>
      </CardHeader>
      <CardContent className='mt-0 flex flex-col gap-4 px-4 sm:px-5'>
        <MonthlyBars data={monthly} />

        <div className='flex flex-col gap-2.5 border-t border-border pt-3'>
          <span className='text-xs font-semibold uppercase tracking-wide text-muted'>
            Por ativo
          </span>
          {topAssets.map((asset) => (
            <div key={asset.ticker} className='flex flex-col gap-1'>
              <div className='flex items-baseline justify-between gap-2 text-sm'>
                <span className='font-medium'>{asset.ticker}</span>
                <span className='tabular-nums text-success-text'>
                  {formatMoney(asset.valueBRL, 'BRL')}
                </span>
              </div>
              <div className='h-1.5 w-full overflow-hidden rounded-full bg-background'>
                <div
                  className='h-full rounded-full bg-success'
                  style={{ width: `${(asset.valueBRL / maxAsset) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className='flex flex-col gap-1 border-t border-border pt-2'>
          <div className='flex items-baseline justify-between gap-2 text-sm'>
            <span className='font-medium'>Total recebido</span>
            <span className='font-semibold tabular-nums text-success-text'>
              {formatMoney(totalBRL, 'BRL')}
            </span>
          </div>
          {taxBRL > 0 && (
            <div className='flex items-baseline justify-between gap-2 text-xs text-muted'>
              <span>IR retido</span>
              <span className='tabular-nums'>{formatMoney(taxBRL, 'BRL')}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
