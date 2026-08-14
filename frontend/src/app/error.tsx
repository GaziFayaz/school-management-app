'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected errors
    console.error('Unhandled runtime error in App Router:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border shadow-xl bg-card">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto inline-flex p-3 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight text-foreground">
            Something went wrong
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            An unexpected error occurred while rendering this page.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="p-3 bg-muted/40 rounded-lg border border-border/60 text-xs font-mono text-muted-foreground break-words max-h-32 overflow-y-auto">
            {error.message || 'Unknown application error.'}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => reset()}
            className="w-full text-xs flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Try Again
          </Button>
          <Button
            asChild
            size="sm"
            className="w-full text-xs flex items-center justify-center gap-1.5"
          >
            <Link href="/">
              <Home className="w-3.5 h-3.5" /> Return Home
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
