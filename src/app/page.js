'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation'; 
import { useEffect } from 'react';

import './globals.css';
import Link from 'next/link';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push('/timer');
    }
  }, [status, router]);

  return (
  <div className="bg-gray-300">
    <nav className="bg-red-700 shadow-2xl sticky top-0 p-4 left-0">
      <div className="container mx-auto flex text-4xl justify-between items-center">
        <Link href = "/">
          <div className="font-bold">Kermit Timer</div>
        </Link>
        <Link href = "/login">
          <div className="flex space-x-10 ml-auto">Log In</div>
        </Link>
      </div>
    </nav>
    <section className="h-screen flex items-center justify-center">
      <div className="md:w-1/2 text-center p-8">
        <h1 className="text-6xl text-black p-4">We make cubing easier</h1>
        <a className="bg-gray-400 text-black p-2 m-8 rounded-xl justify-center items-center" href="/register">Create an account</a>
      </div>
    </section>
  </div>

  );
}
