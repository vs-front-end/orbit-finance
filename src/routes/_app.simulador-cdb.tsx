import { createFileRoute } from '@tanstack/react-router';

import { CdbSimulator } from '@/screens/CdbSimulator';

export const Route = createFileRoute('/_app/simulador-cdb')({
  component: CdbSimulator,
});
