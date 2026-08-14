import React from 'react';
import Link from 'next/link';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border shadow-xl bg-card text-center">
        <CardHeader className="space-y-3">
          <div className="mx-auto inline-flex p-3 bg-primary/10 border border-primary/20 rounded-2xl text-primary">
            <FileQuestion className="w-8 h-8" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Page Not Found (404)
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            The page or resource you are looking for does not exist or has been moved.
          </CardDescription>
        </CardHeader>

        <CardFooter className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full text-xs flex items-center justify-center gap-1.5"
          >
            <Link href="javascript:history.back()">
              <ArrowLeft className="w-3.5 h-3.5" /> Go Back
            </Link>
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
