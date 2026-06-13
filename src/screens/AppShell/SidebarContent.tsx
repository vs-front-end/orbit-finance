import type { ReactNode } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, type LinkProps } from '@tanstack/react-router';

import { cn } from '@stellar-ui-kit/shared';
import {
  Button,
  Separator,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@stellar-ui-kit/web';

import {
  ChartLine,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Landmark,
  LogOut,
  Percent,
  Plus,
  Scale,
  TrendingUp,
  Wallet,
} from 'lucide-react';

import { usePortfolios } from '@/hooks';
import { authService } from '@/services';

import { BrandMark } from '@/components';
import { CHART_BG, chartColor } from '@/components/Charts/chartColors';

const navLinkBaseClass =
  'flex items-center gap-2.5 rounded-md text-sm font-medium transition-colors';

function navLinkLayoutClass(collapsed: boolean) {
  return cn(
    navLinkBaseClass,
    collapsed ? 'mx-auto size-10 justify-center px-0' : 'px-3 py-2',
  );
}

function navLinkInactiveClass() {
  return 'text-muted hover:text-foreground';
}

function navLinkActiveClass(collapsed: boolean) {
  return collapsed
    ? 'text-foreground hover:text-foreground'
    : 'bg-primary-soft text-primary-text hover:bg-primary-soft';
}

type SidebarContentProps = {
  onNewPortfolio: () => void;
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggle?: () => void;
};

type SidebarNavItemProps = {
  collapsed: boolean;
  tooltip: string;
  className?: string;
  activeClassName?: string;
  children: ReactNode;
  to: LinkProps['to'];
  params?: LinkProps['params'];
  exact?: boolean;
  onClick?: () => void;
};

function SidebarNavItem({
  collapsed,
  tooltip,
  className,
  activeClassName,
  children,
  to,
  params,
  exact,
  onClick,
}: SidebarNavItemProps) {
  const link = (
    <Link
      to={to}
      params={params}
      className={cn(navLinkLayoutClass(collapsed), className)}
      inactiveProps={{ className: navLinkInactiveClass() }}
      activeProps={{
        className: cn(navLinkActiveClass(collapsed), activeClassName),
      }}
      activeOptions={exact ? { exact: true } : undefined}
      onClick={onClick}
    >
      {children}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side='right'>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

type PortfolioNavItemProps = {
  collapsed: boolean;
  portfolioId: string;
  name: string;
  currency: string;
  colorIndex: number;
  onNavigate?: () => void;
};

function PortfolioNavItem({
  collapsed,
  portfolioId,
  name,
  currency,
  colorIndex,
  onNavigate,
}: PortfolioNavItemProps) {
  const tooltip = `${name} · ${currency}`;
  const dotClass = chartColor(CHART_BG, colorIndex);

  const icon = collapsed ? (
    <span className='relative shrink-0'>
      <Wallet className='size-4' />
      <span
        className={cn(
          'absolute -right-0.5 -top-0.5 size-2 rounded-full ring-2 ring-surface',
          dotClass,
        )}
        aria-hidden
      />
    </span>
  ) : (
    <Wallet className='size-4 shrink-0' />
  );

  return (
    <SidebarNavItem
      collapsed={collapsed}
      tooltip={tooltip}
      to='/carteiras/$portfolioId'
      params={{ portfolioId }}
      onClick={onNavigate}
    >
      {icon}
      {!collapsed && (
        <>
          <span className='truncate'>{name}</span>
          <span className='ml-auto text-xs opacity-70'>{currency}</span>
        </>
      )}
    </SidebarNavItem>
  );
}

export function SidebarContent({
  onNewPortfolio,
  onNavigate,
  collapsed = false,
  onToggle,
}: SidebarContentProps) {
  const { data: portfolios, isLoading } = usePortfolios();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await authService.signOut();
    queryClient.clear();
    await navigate({ to: '/login' });
  };

  const newPortfolioButton = (
    <Button
      size='icon-sm'
      className='size-6 shrink-0'
      aria-label='Nova carteira'
      onClick={onNewPortfolio}
    >
      <Plus className='size-3.5' />
    </Button>
  );

  return (
    <TooltipProvider delayDuration={300}>
      <div className='relative flex h-full flex-col'>
        <div
          className={cn(
            'relative flex h-14 shrink-0 items-center border-b border-border',
            collapsed ? 'justify-center px-2' : 'px-5',
          )}
        >
          <BrandMark collapsed={collapsed} />
          {onToggle && (
            <button
              type='button'
              onClick={onToggle}
              className='absolute top-1/2 -right-3 z-30 flex size-5 -translate-y-1/2 items-center justify-center rounded-md border border-border bg-surface p-0 text-muted shadow-sm transition-colors hover:text-foreground'
              aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
            >
              {collapsed ? (
                <ChevronRight className='size-3' />
              ) : (
                <ChevronLeft className='size-3' />
              )}
            </button>
          )}
        </div>

        <nav
          className={cn(
            'flex flex-1 flex-col gap-1 overflow-y-auto pb-6',
            collapsed ? 'items-center px-2 pt-3' : 'px-3 pt-3',
          )}
        >
          <SidebarNavItem
            collapsed={collapsed}
            tooltip='Dashboard'
            to='/'
            exact
            onClick={onNavigate}
          >
            <LayoutDashboard className='size-4 shrink-0' />
            {!collapsed && 'Dashboard'}
          </SidebarNavItem>

          <SidebarNavItem
            collapsed={collapsed}
            tooltip='Outros bens'
            to='/outros-bens'
            onClick={onNavigate}
          >
            <Landmark className='size-4 shrink-0' />
            {!collapsed && 'Outros bens'}
          </SidebarNavItem>

          <SidebarNavItem
            collapsed={collapsed}
            tooltip='Estatísticas'
            to='/estatisticas'
            onClick={onNavigate}
          >
            <ChartLine className='size-4 shrink-0' />
            {!collapsed && 'Estatísticas'}
          </SidebarNavItem>

          <Separator className='my-3' />

          {!collapsed ? (
            <div className='mb-1 flex items-center justify-between px-3'>
              <span className='text-xs font-semibold uppercase tracking-wide text-muted'>
                Carteiras
              </span>
              {newPortfolioButton}
            </div>
          ) : (
            <div className='flex w-full justify-center pb-2'>
              <Tooltip>
                <TooltipTrigger asChild>{newPortfolioButton}</TooltipTrigger>
                <TooltipContent side='right'>Nova carteira</TooltipContent>
              </Tooltip>
            </div>
          )}

          {isLoading &&
            (collapsed ? (
              <Skeleton className='size-10 rounded-md' />
            ) : (
              <div className='flex flex-col gap-2 px-3'>
                <Skeleton className='h-8 w-full' />
                <Skeleton className='h-8 w-full' />
              </div>
            ))}

          {(portfolios ?? []).map((portfolio, index) => (
            <PortfolioNavItem
              key={portfolio.id}
              collapsed={collapsed}
              portfolioId={portfolio.id}
              name={portfolio.name}
              currency={portfolio.currency}
              colorIndex={index}
              onNavigate={onNavigate}
            />
          ))}

          <Separator className='my-3' />

          {!collapsed && (
            <div className='mb-1 px-3'>
              <span className='text-xs font-semibold uppercase tracking-wide text-muted'>
                Ferramentas
              </span>
            </div>
          )}

          <SidebarNavItem
            collapsed={collapsed}
            tooltip='Rebalanceamento'
            to='/rebalanceamento'
            onClick={onNavigate}
          >
            <Scale className='size-4 shrink-0' />
            {!collapsed && 'Rebalanceamento'}
          </SidebarNavItem>

          <SidebarNavItem
            collapsed={collapsed}
            tooltip='Juros compostos'
            to='/juros-compostos'
            onClick={onNavigate}
          >
            <TrendingUp className='size-4 shrink-0' />
            {!collapsed && 'Juros compostos'}
          </SidebarNavItem>

          <SidebarNavItem
            collapsed={collapsed}
            tooltip='Simulador CDI'
            to='/simulador-cdb'
            onClick={onNavigate}
          >
            <Percent className='size-4 shrink-0' />
            {!collapsed && 'Simulador CDI'}
          </SidebarNavItem>
        </nav>

        <Separator />

        <div
          className={cn(
            'flex w-full shrink-0',
            collapsed ? 'justify-center p-2' : 'px-4 py-4',
          )}
        >
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='outline'
                  size='icon-sm'
                  className='size-10 shrink-0 border-none text-muted hover:text-foreground'
                  aria-label='Sair'
                  onClick={handleSignOut}
                >
                  <LogOut className='size-4' />
                </Button>
              </TooltipTrigger>
              <TooltipContent side='right'>Sair</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant='outline'
              className='w-full'
              onClick={handleSignOut}
            >
              Sair
              <LogOut className='size-4' />
            </Button>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
