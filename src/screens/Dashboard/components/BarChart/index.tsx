import { useEffect, useRef, useState } from 'react';

import { cn } from '@stellar-ui-kit/shared';
import { Button } from '@stellar-ui-kit/web';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { chartColor, CHART_BG } from '@/components/Charts/chartColors';

export type BarChartItem = {
  id: string;
  label: string;
  value: number;
};

type BarChartProps = {
  items: BarChartItem[];
  formatValue: (value: number) => string;
  className?: string;
};

const SCROLL_STEP = 160;

export function BarChart({ items, formatValue, className }: BarChartProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const syncScrollState = () => {
    const node = scrollerRef.current;
    if (!node) return;

    const maxScroll = node.scrollWidth - node.clientWidth;
    setCanScrollLeft(node.scrollLeft > 1);
    setCanScrollRight(node.scrollLeft < maxScroll - 1);
  };

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) return;

    node.scrollLeft = node.scrollWidth;
    syncScrollState();

    const onScroll = () => syncScrollState();
    node.addEventListener('scroll', onScroll, { passive: true });

    const observer = new ResizeObserver(syncScrollState);
    observer.observe(node);

    return () => {
      node.removeEventListener('scroll', onScroll);
      observer.disconnect();
    };
  }, [items]);

  if (items.length === 0) return null;

  const max = Math.max(...items.map((item) => item.value), 0);
  const scale = max > 0 ? max : 1;
  const showNav = canScrollLeft || canScrollRight;

  const scrollBy = (delta: number) => {
    scrollerRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div
        ref={scrollerRef}
        className='overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'
      >
        <div className='flex w-max min-w-full items-end gap-2 px-0.5'>
          {items.map((item) => {
            const height = (item.value / scale) * 100;

            return (
              <div
                key={item.id}
                className='flex w-14 shrink-0 flex-col items-center gap-1 sm:w-16'
              >
                <span className='w-full text-center text-[10px] tabular-nums text-muted sm:text-xs'>
                  {formatValue(item.value)}
                </span>
                <div className='flex h-28 w-full items-end sm:h-36'>
                  <div
                    className={cn(
                      'w-full min-h-0.5 rounded-t-sm',
                      chartColor(CHART_BG, 0),
                    )}
                    style={{
                      height: `${Math.max(height, item.value > 0 ? 4 : 0)}%`,
                    }}
                  />
                </div>
                <span className='w-full text-center text-[10px] uppercase text-muted sm:text-xs'>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {showNav && (
        <div className='flex items-center justify-between gap-1'>
          <Button
            type='button'
            variant='outline'
            size='icon-sm'
            aria-label='Meses anteriores'
            disabled={!canScrollLeft}
            className='size-6'
            onClick={() => scrollBy(-SCROLL_STEP)}
          >
            <ChevronLeft className='size-3.5' />
          </Button>
          <Button
            type='button'
            variant='outline'
            size='icon-sm'
            aria-label='Meses seguintes'
            disabled={!canScrollRight}
            className='size-6'
            onClick={() => scrollBy(SCROLL_STEP)}
          >
            <ChevronRight className='size-3.5' />
          </Button>
        </div>
      )}
    </div>
  );
}
