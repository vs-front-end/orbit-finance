import { Skeleton } from '@stellar-ui-kit/web';

export function DashboardSkeleton() {
  return (
    <div className='flex flex-col gap-3 sm:gap-4'>
      <header className='flex items-end justify-between gap-3'>
        <div className='flex flex-col gap-1.5'>
          <Skeleton className='h-8 w-40' />
          <Skeleton className='h-4 w-60' />
        </div>
        <Skeleton className='size-8' />
      </header>

      <div className='grid grid-cols-1 gap-3 xs:grid-cols-2 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-6'>
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className='h-20 w-full' />
        ))}
      </div>

      <div className='grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-4'>
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className='h-40 w-full' />
        ))}
      </div>

      <Skeleton className='h-72 w-full' />
    </div>
  );
}
