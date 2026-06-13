import { cn } from '@stellar-ui-kit/shared';

type BrandMarkProps = {
  className?: string;
  collapsed?: boolean;
};

export function BrandMark({ className, collapsed }: BrandMarkProps) {
  if (collapsed) {
    return (
      <span
        className={cn(
          'text-lg font-bold tracking-tight text-foreground',
          className,
        )}
      >
        O<span className='text-primary-text'>F</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        'text-xl font-bold tracking-tight text-foreground',
        className,
      )}
    >
      Orbit
      <span
        className={cn('ml-1 text-xl font-bold text-primary-text', className)}
      >
        Finance
      </span>
    </span>
  );
}
