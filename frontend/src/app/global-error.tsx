'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-black text-foreground antialiased flex items-center justify-center p-4">
        <div className="w-full max-w-md p-6 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl text-center space-y-4">
          <div className="mx-auto inline-flex p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">Critical Application Error</h2>
          <p className="text-xs text-zinc-400">
            An unhandled root error occurred. Please try reloading the application.
          </p>
          <div className="p-3 bg-zinc-900 rounded border border-zinc-800 text-[11px] font-mono text-zinc-400 break-words text-left max-h-28 overflow-y-auto">
            {error.message || 'Unknown application crash.'}
          </div>
          <Button
            onClick={() => reset()}
            size="sm"
            className="w-full text-xs flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reload Application
          </Button>
        </div>
      </body>
    </html>
  );
}
