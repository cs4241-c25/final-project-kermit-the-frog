'use client'
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/lib/ThemeContext';
import Header from '@/components/Header';
import "@/styles/globals.css";
import { usePathname } from 'next/navigation';

export default function RootLayout({ children }) {
  const pathname = usePathname();
  
  // Simple mapping of paths to header variants
  const variant = 
    pathname === '/' ? 'home' :
    pathname === '/auth/login' ? 'login' :
    pathname === '/auth/register' ? 'register' :
    pathname === '/dashboard/timer' ? 'timer' :
    pathname === '/dashboard/data' ? 'data' : 
    'home';

  return (
    <html lang="en">
      <body className="antialiased bg-background text-text">
        <SessionProvider>
          <ThemeProvider>
            <Header variant={variant} />
            {children}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}