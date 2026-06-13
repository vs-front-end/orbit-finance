import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';

import { toast } from 'sonner';

import { routeTree } from './routeTree.gen';
import './index.css';

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
  queryCache: new QueryCache({
    onError: (error) =>
      toast.error(messageOf(error, 'Falha ao carregar dados.')),
  }),
  mutationCache: new MutationCache({
    onError: (error) => toast.error(messageOf(error, 'Falha ao salvar.')),
  }),
});

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
}
