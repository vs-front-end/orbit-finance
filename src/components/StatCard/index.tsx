import { Card, CardContent } from '@stellar-ui-kit/web';

type StatCardProps = {
  label: string;
  children: React.ReactNode;
  sub?: React.ReactNode;
  hint?: string;
};

export function StatCard({ label, children, sub, hint }: StatCardProps) {
  return (
    <Card className='gap-2 py-3 sm:py-4'>
      <CardContent className='mt-0 flex flex-col gap-1 px-3 sm:px-4'>
        <span className='text-[11px] uppercase tracking-wide text-muted sm:text-xs'>
          {label}
        </span>
        <span className='text-sm font-semibold leading-snug tabular-nums sm:text-base xl:text-lg'>
          {children}
        </span>
        {sub && (
          <span className='text-xs leading-snug text-muted tabular-nums'>
            {sub}
          </span>
        )}
        {hint && (
          <span className='hidden text-xs text-muted sm:block'>{hint}</span>
        )}
      </CardContent>
    </Card>
  );
}
