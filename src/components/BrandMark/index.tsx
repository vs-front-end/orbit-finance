import { useId, type CSSProperties } from 'react';

import { cn } from '@stellar-ui-kit/shared';

type BrandMarkProps = {
  className?: string;
  collapsed?: boolean;
};

function OrbitIconMask({ id }: { id: string }) {
  return (
    <svg aria-hidden className='absolute size-0 overflow-hidden'>
      <mask
        id={id}
        maskUnits='userSpaceOnUse'
        x='0'
        y='0'
        width='24'
        height='24'
      >
        <rect width='24' height='24' fill='black' />
        <g
          fill='none'
          stroke='white'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
        >
          <path d='M20.341 6.484A10 10 0 0 1 10.266 21.85' />
          <path d='M3.659 17.516A10 10 0 0 1 13.74 2.152' />
          <circle cx='12' cy='12' r='3' />
          <circle cx='19' cy='5' r='2' />
          <circle cx='5' cy='19' r='2' />
        </g>
      </mask>
    </svg>
  );
}

export function BrandMark({ className, collapsed }: BrandMarkProps) {
  const isCollapsed = collapsed === true;
  const maskId = `orbit-brand-mask-${useId().replace(/:/g, '')}`;
  const iconMaskStyle = {
    '--orbit-mask': `url(#${maskId})`,
  } as CSSProperties;

  return (
    <div
      className={cn('flex min-w-0 items-center', className)}
      role={isCollapsed ? 'img' : undefined}
      aria-label={isCollapsed ? 'Orbit Finance' : undefined}
    >
      <div
        className={cn(
          'relative shrink-0 overflow-hidden transition-[width,opacity] duration-200',
          isCollapsed ? 'w-[26px] opacity-100' : 'w-0 opacity-0',
        )}
        aria-hidden={!isCollapsed}
      >
        <OrbitIconMask id={maskId} />
        <div
          className='orbit-icon-gradient size-[26px]'
          style={iconMaskStyle}
        />
      </div>
      <span
        className={cn(
          'overflow-hidden whitespace-nowrap text-xl font-bold tracking-tight text-foreground transition-[max-width,opacity] duration-200',
          isCollapsed ? 'max-w-0 opacity-0' : 'max-w-48 opacity-100',
        )}
        aria-hidden={isCollapsed}
      >
        Orbit
        <span className='text-primary-text'> Finance</span>
      </span>
    </div>
  );
}
