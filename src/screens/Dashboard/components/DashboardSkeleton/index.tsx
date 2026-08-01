import { Skeleton } from '@stellar-ui-kit/web';

export function DashboardSkeleton() {
  return (
    <div className='flex flex-col gap-3 sm:gap-4'>
      <Skeleton className='h-10 w-64' />
      <div className='grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4'>
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className='h-24 w-full' />
        ))}
      </div>
      <Skeleton className='h-40 w-full' />
      <div className='grid gap-3 sm:gap-4 lg:grid-cols-3'>
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className='h-64 w-full' />
        ))}
      </div>
    </div>
  );
}
