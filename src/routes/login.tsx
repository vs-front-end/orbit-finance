import { useEffect, useRef } from 'react';
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

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

type BlobMotion = {
  x: number;
  y: number;
  scale: number;
  tx: number;
  ty: number;
  ts: number;
  speed: number;
};

function createBlobMotion(): BlobMotion {
  return {
    x: 0,
    y: 0,
    scale: 1,
    tx: randomBetween(-180, 180),
    ty: randomBetween(-140, 140),
    ts: randomBetween(0.85, 1.2),
    speed: randomBetween(0.0002, 0.00045),
  };
}

function LoginBlobs() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const blobs = [
      ...container.querySelectorAll<HTMLDivElement>('.login-blob'),
    ];
    const states = blobs.map(() => createBlobMotion());
    let frameId = 0;
    let last = performance.now();

    function tick(now: number) {
      const dt = now - last;
      last = now;

      for (let i = 0; i < blobs.length; i++) {
        const s = states[i];
        const el = blobs[i];
        if (!s || !el) continue;

        const t = 1 - Math.exp(-s.speed * dt);
        s.x += (s.tx - s.x) * t;
        s.y += (s.ty - s.y) * t;
        s.scale += (s.ts - s.scale) * t;

        if (Math.hypot(s.tx - s.x, s.ty - s.y) < 12) {
          s.tx = randomBetween(-180, 180);
          s.ty = randomBetween(-140, 140);
          s.ts = randomBetween(0.85, 1.2);
          s.speed = randomBetween(0.0002, 0.00045);
        }

        el.style.transform = `translate(${s.x}px, ${s.y}px) scale(${s.scale})`;
      }

      frameId = requestAnimationFrame(tick);
    }

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div ref={containerRef} className='login-blobs' aria-hidden>
      <div className='login-blob login-blob-1' />
      <div className='login-blob login-blob-2' />
      <div className='login-blob login-blob-3' />
    </div>
  );
}

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
    <main className='relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4'>
      <LoginBlobs />

      <Card className='login-card relative z-10 w-full max-w-sm bg-transparent'>
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
