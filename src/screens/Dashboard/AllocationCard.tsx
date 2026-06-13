import { Card, CardContent, CardHeader, CardTitle } from '@stellar-ui-kit/web';

import { AllocationBar, type AllocationSlice } from '@/components/Charts';
import { formatMoney } from '@/utils';

type AllocationCardProps = {
  title: string;
  slices: AllocationSlice[];
};

export function AllocationCard({ title, slices }: AllocationCardProps) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <Card className='gap-3 py-3 sm:py-4'>
      <CardHeader className='px-4 sm:px-5'>
        <CardTitle className='text-sm'>{title}</CardTitle>
      </CardHeader>
      <CardContent className='mt-0 px-4 sm:px-5'>
        <AllocationBar slices={slices} />
      </CardContent>
      <CardContent className='mt-auto border-t border-border px-4 pt-3 text-xs text-muted sm:px-5'>
        Total: {formatMoney(total, 'BRL')}
      </CardContent>
    </Card>
  );
}
