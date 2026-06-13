import { createFileRoute } from '@tanstack/react-router';

import { Rebalance } from '@/screens/Rebalance';

export const Route = createFileRoute('/_app/rebalanceamento')({
  component: Rebalance,
});
