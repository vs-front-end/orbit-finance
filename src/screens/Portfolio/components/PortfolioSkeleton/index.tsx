import { Skeleton } from '@stellar-ui-kit/web';

const STAT_KEYS = [
  'market',
  'invested',
  'daily-pct',
  'daily',
  'net-pct',
  'net',
];

export function PortfolioSkeleton() {
  return (
    <>
      <div className='grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6'>
        {STAT_KEYS.map((key) => (
          <Skeleton key={key} className='h-20 w-full' />
        ))}
      </div>
      <div className='flex flex-col gap-3'>
        <Skeleton className='h-9 w-72' />
        <Skeleton className='h-64 w-full' />
      </div>
    </>
  );
}
