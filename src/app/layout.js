'use client'
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/lib/ThemeContext';
import "@/styles/globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`antialiased`}>
        <SessionProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
