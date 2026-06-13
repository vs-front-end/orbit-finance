import { cn } from '@stellar-ui-kit/shared';

import { formatPercent } from '@/utils';

import { CHART_BG, chartColor } from './chartColors';

export type AllocationSlice = { label: string; value: number };

type AllocationBarProps = {
  slices: AllocationSlice[];
};

export function AllocationBar({ slices }: AllocationBarProps) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex h-2.5 w-full overflow-hidden rounded-full bg-background'>
        {slices.map((slice, index) => (
          <div
            key={slice.label}
            className={chartColor(CHART_BG, index)}
            style={{ width: `${total > 0 ? (slice.value / total) * 100 : 0}%` }}
            title={`${slice.label}: ${formatPercent(total > 0 ? (slice.value / total) * 100 : 0, false)}`}
          />
        ))}
      </div>

      <ul className='flex flex-col gap-1.5'>
        {slices.map((slice, index) => (
          <li key={slice.label} className='flex items-center gap-2 text-sm'>
            <span
              className={cn(
                'size-2.5 shrink-0 rounded-full',
                chartColor(CHART_BG, index),
              )}
            />
            <span className='min-w-0 flex-1 break-words text-muted'>
              {slice.label}
            </span>
            <span className='shrink-0 tabular-nums text-xs font-medium'>
              {formatPercent(
                total > 0 ? (slice.value / total) * 100 : 0,
                false,
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
