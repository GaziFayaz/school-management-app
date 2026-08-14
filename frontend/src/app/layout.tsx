import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';
import Navbar from '@/components/layout/Navbar';

export const metadata: Metadata = {
  title: 'School Management App',
  description: 'Role-based school management application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-black text-foreground antialiased flex flex-col">
        <Providers>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
