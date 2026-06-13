import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Button, Card, CardContent, Text } from '@stellar-ui-kit/web';

import { Github } from 'lucide-react';

import type { AuthProvider } from '@/domain';
import { queryKeys } from '@/hooks';
import { authService } from '@/services';

import { BrandMark } from '@/components';

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const user = await authService.getUser();
    if (user) throw redirect({ to: '/' });
  },
  component: LoginScreen,
});

function LoginScreen() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const signIn = useMutation({
    mutationFn: (provider: AuthProvider) => authService.signIn(provider),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.user });
      await navigate({ to: '/' });
    },
  });

  return (
    <main className='flex min-h-screen items-center justify-center bg-background p-4'>
      <Card className='w-full max-w-sm'>
        <CardContent className='mt-0 flex flex-col items-center gap-6'>
          <div className='flex flex-col items-center gap-2'>
            <BrandMark className='text-2xl' />
            <Text as='p' styleVariant='muted'>
              Seu hub pessoal de gestão
            </Text>
          </div>

          <div className='flex w-full flex-col gap-3'>
            <div className='rgb-border flex w-full'>
              <Button
                variant='ghost'
                size='lg'
                className='w-full rounded-[0.6rem] bg-transparent py-5 hover:bg-primary-soft'
                disabled={signIn.isPending}
                onClick={() => signIn.mutate('github')}
              >
                <Github />
                Continuar com GitHub
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
