'use client';
import './../globals.css';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { GSP_NO_RETURNED_VALUE } from 'next/dist/lib/constants';

export default function Login() {
  const router = useRouter();

  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      router.push('/timer');
    }
  }, [status, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formData = {
      email: e.target.email.value,
      password: e.target.password.value,
    };

    try {
      const result = await signIn('credentials', {
        ...formData,
        callbackUrl: '/timer',
        redirect: true
      });
    } catch (error) {
      alert('Email or Password is wrong');
      console.error(error);
    }
  };

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
        <h1 className="text-6xl text-black">Log in</h1>
        <form className="text-4xl text-black p-4" onSubmit={handleSubmit}>
          <div className="p-4">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" required/>
          </div>
          <div className="p-4">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" name="password" required/>
          </div>
          <button className="bg-gray-400 p-2 m-8 rounded-xl justify-center items-center" type="submit">Log In</button>
        </form>
        <Link href="/register" className ="text-black">New here? Register now</Link>
      </div>
    </section>
  </div>
  );
}
