'use client';

import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/DraggableCard';
import { LogOutIcon, UserIcon, WalletIcon } from 'lucide-react';
// import { useFinancialData } from '@/hooks/useFinancialData';

export function Navbar() {
  const { data: session, status } = useSession();
  // const {
  //   refreshData,
  // } = useFinancialData();

  const handleSignOut = () => {
    signOut();
  };

  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="flex h-16 items-center justify-between px-6 w-full">
        <div className="flex items-center space-x-4">
          <WalletIcon className="h-8 w-8 text-blue-600" />
          <h1 className="text-xl font-bold">Financial Tracker</h1>
        </div>

        <div className="flex items-center space-x-3">
          {status === 'loading' ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          ) : session ? (
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-2">
                <UserIcon className="h-4 w-4" />
                <span className="text-sm font-medium truncate max-w-32">{session.user?.email}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center space-x-2"
              >
                <LogOutIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
              {/* <Button variant="outline" onClick={refreshData}>
                <RefreshCwIcon className="h-8 w-8  mx-auto" />
              </Button> */}
            </div>
          ) : (
            <></>
          )}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
