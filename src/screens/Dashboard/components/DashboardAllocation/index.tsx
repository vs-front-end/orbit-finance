import { Card, CardContent, CardHeader, CardTitle } from '@stellar-ui-kit/web';

import { AllocationBar, type AllocationSlice } from '@/components/Charts';
import { formatMoney } from '@/utils';

type DashboardAllocationProps = {
  slices: AllocationSlice[];
};

export function DashboardAllocation({ slices }: DashboardAllocationProps) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  if (slices.length === 0) return null;

  return (
    <Card className='w-full min-w-0 gap-3 py-3 sm:py-4'>
      <CardHeader className='px-4 sm:px-5'>
        <div className='flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-2'>
          <CardTitle className='text-sm'>Divisão da carteira</CardTitle>
          <span className='shrink-0 text-xs text-muted'>
            Total {formatMoney(total, 'BRL')}
          </span>
        </div>
      </CardHeader>
      <CardContent className='mt-0 min-w-0 px-4 sm:px-5'>
        <AllocationBar slices={slices} />
      </CardContent>
    </Card>
  );
}
