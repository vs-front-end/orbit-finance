import { useState } from 'react';

import { cn } from '@stellar-ui-kit/shared';

import { CHART_BG, CHART_FILL, CHART_STROKE, chartColor } from './chartColors';

export type ChartPoint = { t: number; value: number };
export type ChartSeries = { id: string; label: string; points: ChartPoint[] };

type LineChartProps = {
  series: ChartSeries[];
  formatValue: (value: number) => string;
  formatDate: (t: number) => string;
  formatTooltipValue?: (value: number) => string;
  className?: string;
};

export function LineChart({
  series,
  formatValue,
  formatDate,
  formatTooltipValue,
  className,
}: LineChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const allPoints = series.flatMap((s) => s.points);
  if (allPoints.length === 0) return null;

  const values = allPoints.map((p) => p.value);
  const times = allPoints.map((p) => p.t);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const pad = (rawMax - rawMin || rawMax || 1) * 0.08;
  const min = rawMin >= 0 ? Math.max(0, rawMin - pad) : rawMin - pad;
  const max = rawMax + pad;
  const t0 = Math.min(...times);
  const t1 = Math.max(...times);

  const toX = (t: number) => (t1 === t0 ? 0 : ((t - t0) / (t1 - t0)) * 100);
  const toY = (value: number) => 100 - ((value - min) / (max - min)) * 100;

  const linePath = (points: ChartPoint[]) =>
    points
      .map(
        (p, i) =>
          `${i === 0 ? 'M' : 'L'} ${toX(p.t).toFixed(2)} ${toY(p.value).toFixed(2)}`,
      )
      .join(' ');

  const basePoints = series[0]?.points ?? [];
  const formatTooltip = formatTooltipValue ?? formatValue;

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (basePoints.length < 2) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const fraction = Math.min(
      1,
      Math.max(0, (event.clientX - rect.left) / rect.width),
    );
    setHoverIndex(Math.round(fraction * (basePoints.length - 1)));
  };

  const hoverPoint = hoverIndex !== null ? basePoints[hoverIndex] : undefined;
  const hoverX = hoverPoint ? toX(hoverPoint.t) : 0;

  const hoverEntries = hoverPoint
    ? series.flatMap((s, index) => {
        const point = hoverIndex !== null ? s.points[hoverIndex] : undefined;
        return point
          ? [{ id: s.id, label: s.label, value: point.value, index }]
          : [];
      })
    : [];

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className='flex gap-2'>
        <div className='flex shrink-0 flex-col justify-between py-0.5 text-right tabular-nums text-xs text-muted'>
          <span>{formatValue(max)}</span>
          <span>{formatValue((max + min) / 2)}</span>
          <span>{formatValue(min)}</span>
        </div>

        <div
          className='relative min-w-0 flex-1 cursor-crosshair'
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <svg
            viewBox='0 0 100 100'
            preserveAspectRatio='none'
            className='h-40 w-full sm:h-52'
          >
            {[0, 50, 100].map((y) => (
              <line
                key={y}
                x1='0'
                y1={y}
                x2='100'
                y2={y}
                className='stroke-border'
                strokeWidth='1'
                vectorEffect='non-scaling-stroke'
              />
            ))}

            {series.length === 1 &&
              series[0] &&
              series[0].points.length > 1 && (
                <path
                  d={`${linePath(series[0].points)} L 100 100 L 0 100 Z`}
                  className={chartColor(CHART_FILL, 0)}
                  fillOpacity='0.12'
                />
              )}

            {series.map((s, index) => (
              <path
                key={s.id}
                d={linePath(s.points)}
                fill='none'
                strokeWidth='2'
                vectorEffect='non-scaling-stroke'
                strokeLinejoin='round'
                strokeLinecap='round'
                className={chartColor(CHART_STROKE, index)}
              />
            ))}

            {hoverPoint && (
              <line
                x1={hoverX}
                y1='0'
                x2={hoverX}
                y2='100'
                className='stroke-muted'
                strokeWidth='1'
                strokeDasharray='3 3'
                vectorEffect='non-scaling-stroke'
              />
            )}
          </svg>

          {hoverEntries.map((entry) => {
            const point =
              hoverIndex !== null
                ? series[entry.index]?.points[hoverIndex]
                : undefined;
            if (!point) return null;
            return (
              <span
                key={entry.id}
                className={cn(
                  'pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background',
                  chartColor(CHART_BG, entry.index),
                )}
                style={{
                  left: `${toX(point.t)}%`,
                  top: `${toY(point.value)}%`,
                }}
              />
            );
          })}

          {hoverPoint && (
            <div
              className={cn(
                'pointer-events-none absolute top-1 z-10 flex w-max max-w-56 flex-col gap-1 rounded-md border border-border bg-surface px-2.5 py-2 text-xs shadow-lg',
                hoverX > 55 ? '-translate-x-full' : '',
              )}
              style={{
                left: `${hoverX}%`,
                marginLeft: hoverX > 55 ? '-8px' : '8px',
              }}
            >
              <span className='font-medium text-muted'>
                {formatDate(hoverPoint.t)}
              </span>
              {hoverEntries.map((entry) => (
                <span key={entry.id} className='flex items-center gap-1.5'>
                  <span
                    className={cn(
                      'size-2 shrink-0 rounded-full',
                      chartColor(CHART_BG, entry.index),
                    )}
                  />
                  <span className='text-muted'>{entry.label}:</span>
                  <span className='tabular-nums font-semibold'>
                    {formatTooltip(entry.value)}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className='flex justify-between pl-12 text-xs text-muted'>
        <span>{formatDate(t0)}</span>
        <span className='hidden sm:inline'>{formatDate((t0 + t1) / 2)}</span>
        <span>{formatDate(t1)}</span>
      </div>

      {series.length > 1 && (
        <ul className='flex flex-wrap gap-x-4 gap-y-1.5 pt-1'>
          {series.map((s, index) => (
            <li
              key={s.id}
              className='flex items-center gap-1.5 text-xs text-muted'
            >
              <span
                className={cn(
                  'size-2 rounded-full',
                  chartColor(CHART_BG, index),
                )}
              />
              {s.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
