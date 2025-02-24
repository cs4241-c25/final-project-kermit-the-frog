'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation'; 
import { useEffect } from 'react';
import { useTheme } from '@/lib/ThemeContext';
import '@/styles/globals.css';
import Link from 'next/link';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toggleTheme } = useTheme();

  useEffect(() => {
    if (status === "authenticated") {
      router.push('/dashboard/timer');
    }
  }, [status, router]);

  return (
    <div className="bg-background text-text">
      <nav className="bg-primary shadow-2xl sticky top-0 p-4 left-0">
        <div className="container mx-auto flex text-4xl justify-between items-center">
          <Link href="/">
            <div className="font-bold text-text">Kermit Timer</div>
          </Link>
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="bg-accent/80 hover:bg-accent p-2 rounded text-background text-lg"
            >
              Toggle Theme
            </button>
            <Link href="/auth/login">
              <div className="text-text">Log In</div>
            </Link>
          </div>
        </div>
      </nav>
      <section className="h-screen flex items-center justify-center">
        <div className="md:w-1/2 text-center p-8">
          <h1 className="text-6xl text-text p-4">We make cubing easier</h1>
          <a className="bg-gray-400 text-text p-2 m-8 rounded-xl justify-center items-center" href="/auth/register">Create an account</a>
        </div>
      </section>
    </div>
  );
}
