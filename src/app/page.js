'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation'; 
import { useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push('/dashboard/timer');
    }
  }, [status, router]);

  return (
      <section className="flex flex-col items-center justify-center h-[calc(100vh-92px)]">
          <h1 className="text-6xl p-4">We make cubing easier</h1>
          <Link className="button" href="/auth/register">
            Create an account
          </Link>
      </section>
  );
}

// Vercel testing change
