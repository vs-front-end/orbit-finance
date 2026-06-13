import { createFileRoute } from '@tanstack/react-router';

import { MiscPatrimonyScreen } from '@/screens/MiscPatrimony';

export const Route = createFileRoute('/_app/outros-bens')({
  component: MiscPatrimonyScreen,
});
