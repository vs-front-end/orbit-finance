import { createFileRoute } from '@tanstack/react-router';

import { CompoundInterest } from '@/screens/CompoundInterest';

export const Route = createFileRoute('/_app/juros-compostos')({
  component: CompoundInterest,
});
