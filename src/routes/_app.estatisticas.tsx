import { createFileRoute } from '@tanstack/react-router';

import { Stats } from '@/screens/Stats';

export const Route = createFileRoute('/_app/estatisticas')({
  component: Stats,
});
