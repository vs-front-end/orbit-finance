import { useState } from 'react';

import { cn } from '@stellar-ui-kit/shared';

import { formatPercent } from '@/utils';

import type { AllocationSlice } from './AllocationBar';
import { CHART_BG, CHART_STROKE, chartColor } from './chartColors';

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type DonutChartProps = {
  title: string;
  slices: AllocationSlice[];
  centerLabel?: string;
};

export function DonutChart({ title, slices, centerLabel }: DonutChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  const arcs = slices.reduce<
    (AllocationSlice & { fraction: number; offset: number; index: number })[]
  >((acc, slice, index) => {
    const fraction = total > 0 ? slice.value / total : 0;
    const offset =
      acc.length > 0
        ? acc[acc.length - 1].offset + acc[acc.length - 1].fraction
        : 0;
    acc.push({ ...slice, fraction, offset, index });
    return acc;
  }, []);

  return (
    <div className='flex flex-col items-center gap-3'>
      <span className='text-xs font-medium uppercase tracking-wide text-muted'>
        {title}
      </span>

      <div className='relative'>
        <svg viewBox='0 0 100 100' className='size-36 -rotate-90'>
          <circle
            cx='50'
            cy='50'
            r={RADIUS}
            fill='none'
            strokeWidth='13'
            className='stroke-background'
          />
          {arcs.map((arc) => (
            <circle
              key={arc.label}
              cx='50'
              cy='50'
              r={RADIUS}
              fill='none'
              strokeWidth={hovered === arc.index ? 16 : 13}
              strokeDasharray={`${arc.fraction * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              strokeDashoffset={-arc.offset * CIRCUMFERENCE}
              className={cn(
                'transition-all',
                chartColor(CHART_STROKE, arc.index),
              )}
              onMouseEnter={() => setHovered(arc.index)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
        </svg>
        <span className='pointer-events-none absolute inset-4 flex flex-col items-center justify-center text-center'>
          {hovered !== null && arcs[hovered] ? (
            <>
              <span className='max-w-full truncate text-xs text-muted'>
                {arcs[hovered].label}
              </span>
              <span className='text-sm font-semibold tabular-nums'>
                {formatPercent(arcs[hovered].fraction * 100, false)}
              </span>
            </>
          ) : (
            centerLabel && (
              <span className='text-xs font-semibold tabular-nums'>
                {centerLabel}
              </span>
            )
          )}
        </span>
      </div>

      <ul className='flex w-full flex-col gap-1'>
        {arcs.map((arc) => (
          <li key={arc.label} className='flex items-center gap-2 text-xs'>
            <span
              className={cn(
                'size-2 shrink-0 rounded-full',
                chartColor(CHART_BG, arc.index),
              )}
            />
            <span className='min-w-0 flex-1 truncate text-muted'>
              {arc.label}
            </span>
            <span className='shrink-0 tabular-nums font-medium'>
              {formatPercent(arc.fraction * 100, false)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
