'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, PanelLeftClose, PanelLeft } from 'lucide-react';

import { cn } from '@/lib/utils';
import { navigation, NavigationSection } from '@/lib/constants/routes';
import { useUIStore } from '@/lib/stores/ui-store';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const {
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileSidebarOpen,
    setMobileSidebarOpen,
  } = useUIStore();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');

  const NavContent = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {/* Logo / Brand */}
      <div
        className={cn(
          'flex h-14 items-center border-b px-4',
          mobile
            ? 'justify-between'
            : sidebarCollapsed
              ? 'justify-center'
              : 'justify-between'
        )}
      >
        {mobile || !sidebarCollapsed ? (
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/images/Wahb-logo-black.png" alt="Wahb" width={26} height={26} className="dark:hidden object-contain" />
            <Image src="/images/Wahb-logo-White.png" alt="Wahb" width={26} height={26} className="hidden dark:block object-contain" />
            <span className="text-sm font-semibold tracking-tight">Platform Console</span>
          </Link>
        ) : (
          <Link href="/" className="mx-auto flex items-center justify-center">
            <Image src="/images/Wahb-logo-black.png" alt="Wahb" width={24} height={24} className="dark:hidden object-contain" />
            <Image src="/images/Wahb-logo-White.png" alt="Wahb" width={24} height={24} className="hidden dark:block object-contain" />
          </Link>
        )}
        {mobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3">
        {navigation.map((section: NavigationSection) => (
          <div key={section.title} className="mb-1">
            {(mobile || !sidebarCollapsed) && (
              <h3 className="mb-1 px-4 pt-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                {section.title}
              </h3>
            )}
            {sidebarCollapsed && !mobile && (
              <div className="mx-auto my-2 h-px w-6 bg-border" />
            )}
            <ul
              className={cn(
                'space-y-0.5',
                mobile || !sidebarCollapsed ? 'px-2' : 'px-1.5'
              )}
            >
              {section.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => mobile && setMobileSidebarOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
                        active
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                        !mobile && sidebarCollapsed && 'justify-center px-2'
                      )}
                      title={
                        sidebarCollapsed && !mobile ? item.name : undefined
                      }
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {(mobile || !sidebarCollapsed) && (
                        <span>{item.name}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Collapse Toggle - Desktop Only */}
      {!mobile && (
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden w-full justify-center lg:flex h-8 text-muted-foreground hover:text-foreground"
            aria-label={
              sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
            }
          >
            {sidebarCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden flex-col border-r bg-card transition-all duration-200 lg:flex',
          sidebarCollapsed ? 'w-[52px]' : 'w-60',
          className
        )}
      >
        <NavContent />
      </aside>

      {/* Mobile Sidebar - Sheet/Drawer */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetTrigger asChild className="lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="fixed left-4 top-3.5 z-40 h-8 w-8 border bg-background shadow-sm"
          >
            <Menu className="h-4 w-4" />
            <span className="sr-only">Open sidebar</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-60 p-0">
          <div className="flex h-full flex-col">
            <NavContent mobile />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
