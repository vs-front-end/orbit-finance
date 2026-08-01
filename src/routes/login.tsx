import { useEffect, useRef } from 'react';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Button, Card, CardContent, Text } from '@stellar-ui-kit/web';

import { Github } from 'lucide-react';

import type { AuthProvider } from '@/domain';
import { queryKeys } from '@/hooks';
import { authService } from '@/services';

import { BrandMark } from '@/components';

function GoogleIcon() {
  return (
    <svg width='18' height='18' viewBox='0 0 18 18' aria-hidden>
      <path
        d='M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z'
        fill='#4285F4'
      />
      <path
        d='M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z'
        fill='#34A853'
      />
      <path
        d='M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z'
        fill='#FBBC05'
      />
      <path
        d='M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z'
        fill='#EA4335'
      />
    </svg>
  );
}

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
                onClick={() => signIn.mutate('google')}
              >
                <GoogleIcon />
                Continuar com Google
              </Button>
            </div>
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
