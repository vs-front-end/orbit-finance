import { cn } from '@stellar-ui-kit/shared';
import type { Currency } from '@/domain';
import { formatMoney, formatPercent } from '@/utils';

type PLValueProps = {
  value: number;
  currency?: Currency;
  percent?: number;
  className?: string;
};

export function PLValue({ value, currency, percent, className }: PLValueProps) {
  const getColor = (value: number) => {
    if (value > 0) return 'text-success-text';
    if (value < 0) return 'text-error-text';
    return 'text-muted';
  };

  return (
    <span
      className={cn('tabular-nums font-medium', getColor(value), className)}
    >
      <span className='whitespace-nowrap'>
        {currency !== undefined
          ? formatMoney(value, currency, true)
          : formatPercent(value)}
      </span>

      {currency !== undefined && percent !== undefined && (
        <span className='ml-1 whitespace-nowrap text-[0.72em] opacity-80'>
          {formatPercent(percent)}
        </span>
      )}
    </span>
  );
}
