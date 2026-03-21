'use client';

import React from 'react';
import { AlertCircleIcon, RefreshCwIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface AsyncErrorBoundaryProps {
  children: React.ReactNode;
  message?: string;
}

function AsyncFallback({ message }: { message: string }) {
  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-destructive">
          <AlertCircleIcon className="h-5 w-5" />
          <span>Something went wrong</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{message}</p>
        <Button
          variant="default"
          onClick={() => window.location.reload()}
          className="flex items-center space-x-2"
        >
          <RefreshCwIcon className="h-4 w-4" />
          <span>Try Again</span>
        </Button>
      </CardContent>
    </Card>
  );
}

export function AsyncErrorBoundary({
  children,
  message = 'An unexpected error occurred. Please try again.',
}: AsyncErrorBoundaryProps) {
  return <ErrorBoundary fallback={<AsyncFallback message={message} />}>{children}</ErrorBoundary>;
}
