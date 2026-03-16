import { cn } from '@/lib/utils';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface DashboardShellProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardShell({ children, className }: DashboardShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden lg:ml-0">
        <Header />

        <main className={cn('flex-1 overflow-y-auto scrollbar-thin p-4 sm:p-6 lg:p-8', className)}>
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
