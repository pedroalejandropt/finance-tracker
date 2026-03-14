'use client';

import { 
  WalletIcon, 
  RefreshCwIcon, 
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { useFinancialDataWithDynamo } from '@/hooks/useFinancialDataWithDynamo';

export default function Home() {
  const { data: session, status } = useSession();
  const {
    loading,
    error,
    // refreshData,
  } = useFinancialDataWithDynamo();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCwIcon className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <WalletIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Financial Tracker</h1>
          <p className="mb-4">Please sign in to access your financial dashboard</p>
          <Button variant="outline" onClick={() => window.location.href = '/login'}>
            Sign In
          </Button>
        </div>
      </div>
    );
  } else {
    window.location.href = '/dashboard';
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCwIcon className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-lg">Loading financial data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          {/* <Button onClick={refreshData}>Retry</Button> */}
        </div>
      </div>
    );
  }

}
