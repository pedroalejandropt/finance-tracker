'use client';

import { useEffect } from 'react';
import { RefreshCwIcon } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <RefreshCwIcon className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-lg">Loading...</p>
      </div>
    </div>
  );
}
