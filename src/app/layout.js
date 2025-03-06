'use client'
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/lib/ThemeContext';
import Header from '@/components/Header';
import "@/styles/globals.css";
import { usePathname } from 'next/navigation';
import {Suspense} from "react";

export default function RootLayout({ children }) {
  const pathname = usePathname();
  
  // Simple mapping of paths to header variants
  const variant = 
    pathname === '/' ? 'home' :
    pathname === '/auth/login' ? 'login' :
    pathname === '/auth/register' ? 'register' :
    pathname === '/dashboard/timer' ? 'timer' :
    pathname === '/dashboard/data' ? 'data' :
    pathname === '/dataVis' ? 'dataVis' :
    'home';

  return (
    <html lang="en">
    <head>
      <title> </title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
      <body className="h-screen flex flex-col bg-background text-text antialiased">
        <SessionProvider>
          <ThemeProvider>
            <Suspense fallback={<div>Loading...</div>}>
              <Header variant={variant} />
              <main className="flex-1 overflow-y-auto">
                {children}
              </main>
            </Suspense>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}