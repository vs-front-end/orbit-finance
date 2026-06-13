import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { authService } from '@/services';

import { AppShell } from '@/screens/AppShell';

export const Route = createFileRoute('/_app')({
  beforeLoad: async () => {
    const user = await authService.getUser();
    if (!user) throw redirect({ to: '/login' });
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
