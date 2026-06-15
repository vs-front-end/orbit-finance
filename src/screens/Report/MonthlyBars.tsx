import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@stellar-ui-kit/web';

import type { MonthlyDividend } from '@/hooks';
import { formatMoney } from '@/utils';

function formatMonth(ym: string, opts: Intl.DateTimeFormatOptions): string {
  const [year, month] = ym.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', opts).format(
    new Date(Date.UTC(year, month - 1, 1)),
  );
}

type MonthlyBarsProps = {
  data: MonthlyDividend[];
};

export function MonthlyBars({ data }: MonthlyBarsProps) {
  const max = Math.max(...data.map((month) => month.valueBRL), 1);

  return (
    <TooltipProvider delayDuration={120}>
      <div className='flex items-end gap-1 sm:gap-1.5'>
        {data.map((month) => (
          <Tooltip key={month.ym}>
            <TooltipTrigger asChild>
              <div className='flex min-w-0 flex-1 cursor-default flex-col items-center gap-1'>
                <div className='flex h-24 w-full items-end'>
                  <div
                    className='w-full rounded-t bg-success'
                    style={{
                      height: `${month.valueBRL > 0 ? Math.max((month.valueBRL / max) * 100, 4) : 0}%`,
                    }}
                  />
                </div>
                <span className='text-[10px] uppercase text-muted'>
                  {formatMonth(month.ym, { month: 'short' }).replace('.', '')}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <span className='font-medium capitalize'>
                {formatMonth(month.ym, { month: 'long', year: 'numeric' })}
              </span>
              {' · '}
              {formatMoney(month.valueBRL, 'BRL')}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
