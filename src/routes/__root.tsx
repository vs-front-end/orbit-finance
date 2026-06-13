import { createRootRoute, Outlet } from '@tanstack/react-router';

import { Toaster } from '@stellar-ui-kit/web';

export const Route = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <Toaster position='bottom-right' />
    </>
  ),
});
