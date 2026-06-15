import { Card, CardContent, CardHeader, CardTitle } from '@stellar-ui-kit/web';

import { PLValue } from '@/components';

type RealizedCardProps = {
  realized: number;
  unrealized: number;
};

export function RealizedCard({ realized, unrealized }: RealizedCardProps) {
  return (
    <Card className='gap-3 py-3 sm:py-4'>
      <CardHeader className='px-4 sm:px-5'>
        <CardTitle className='flex flex-wrap items-baseline justify-between gap-2 text-sm'>
          Realizado x em aberto
          <span className='text-xs font-normal text-muted'>
            vendas vs posições atuais
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className='mt-0 flex flex-col gap-3 px-4 sm:px-5'>
        <div className='grid grid-cols-2 gap-3'>
          <div className='flex flex-col gap-1'>
            <span className='text-xs text-muted'>Realizado</span>
            <PLValue value={realized} currency='BRL' />
          </div>
          <div className='flex flex-col gap-1'>
            <span className='text-xs text-muted'>Não realizado</span>
            <PLValue value={unrealized} currency='BRL' />
          </div>
        </div>
        <div className='flex items-baseline justify-between gap-2 border-t border-border pt-2 text-sm'>
          <span className='font-medium'>Resultado total</span>
          <PLValue
            value={realized + unrealized}
            currency='BRL'
            className='text-sm'
          />
        </div>
      </CardContent>
    </Card>
  );
}
