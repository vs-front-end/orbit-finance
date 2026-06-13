import { useEffect, useState, type CSSProperties } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import {
  Button,
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from '@stellar-ui-kit/web';

import { cn } from '@stellar-ui-kit/shared';
import { Menu } from 'lucide-react';

import { queryKeys, useAssets, useSidebarCollapsed } from '@/hooks';
import { assetsService } from '@/services';

import { BrandMark } from '@/components';

import { NewPortfolioDialog } from './NewPortfolioDialog';
import { SidebarContent } from './SidebarContent';

const SIDEBAR_WIDTH_EXPANDED = 256;
const SIDEBAR_WIDTH_COLLAPSED = 72;

export function AppShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newPortfolioOpen, setNewPortfolioOpen] = useState(false);
  const { collapsed, toggle } = useSidebarCollapsed();
  const queryClient = useQueryClient();

  useAssets();

  useEffect(() => {
    void assetsService.repairSectors().then((changed) => {
      if (changed) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.assets });
      }
    });
  }, [queryClient]);

  const openNewPortfolio = () => {
    setDrawerOpen(false);
    setNewPortfolioOpen(true);
  };

  const sidebarWidth = collapsed
    ? SIDEBAR_WIDTH_COLLAPSED
    : SIDEBAR_WIDTH_EXPANDED;

  return (
    <div className='min-h-screen bg-background'>
      <header className='sticky top-0 z-40 flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden'>
        <BrandMark />
        <Drawer direction='left' open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <Button variant='ghost' size='icon-sm' aria-label='Abrir menu'>
              <Menu />
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerTitle className='sr-only'>Menu</DrawerTitle>
            <SidebarContent
              onNavigate={() => setDrawerOpen(false)}
              onNewPortfolio={openNewPortfolio}
            />
          </DrawerContent>
        </Drawer>
      </header>

      <aside
        className='fixed inset-y-0 left-0 z-20 hidden flex-col overflow-visible border-r border-border bg-surface transition-[width] duration-200 md:flex'
        style={{ width: sidebarWidth }}
      >
        <SidebarContent
          collapsed={collapsed}
          onToggle={toggle}
          onNewPortfolio={openNewPortfolio}
        />
      </aside>

      <main
        className={cn(
          'p-4 md:p-8 md:transition-[margin-left] md:duration-200',
          'md:ml-[var(--sidebar-w)]',
        )}
        style={{ '--sidebar-w': `${sidebarWidth}px` } as CSSProperties}
      >
        {children}
      </main>

      <NewPortfolioDialog
        open={newPortfolioOpen}
        onOpenChange={setNewPortfolioOpen}
      />
    </div>
  );
}
