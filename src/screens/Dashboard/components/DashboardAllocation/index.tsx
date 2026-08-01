import { Card, CardContent, CardHeader, CardTitle } from '@stellar-ui-kit/web';

import {
  AllocationBar,
  type AllocationSlice,
} from '@/components/Charts';
import { formatMoney } from '@/utils';

type DashboardAllocationProps = {
  slices: AllocationSlice[];
};

export function DashboardAllocation({ slices }: DashboardAllocationProps) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  if (slices.length === 0) return null;

  return (
    <Card className='gap-3 py-3 sm:py-4'>
      <CardHeader className='px-4 sm:px-5'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <CardTitle className='text-sm'>Divisão da carteira</CardTitle>
          <span className='text-xs text-muted'>
            Total {formatMoney(total, 'BRL')}
          </span>
        </div>
      </CardHeader>
      <CardContent className='mt-0 px-4 sm:px-5'>
        <AllocationBar slices={slices} />
      </CardContent>
    </Card>
  );
}
