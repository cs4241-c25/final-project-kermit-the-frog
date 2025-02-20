'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation'; 
import { useEffect } from 'react';

import './../globals.css';
import Link from 'next/link';

export default function Register() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push('/timer');
    }
  }, [status, router]);

  const handleSubmit = (e) => {
    e.preventDefault();
    handleRegister(e.target.email.value, e.target.password.value);
  };

  const handleRegister = async (email, password) => {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
  
    const data = await res.json();
    if (data.success) {
      console.log('Registration successful');
      alert('Registration successful');
      window.location.href = '/login';
    } else {
      alert(data.message);
      console.log(data.message);
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
        <h1 className="text-6xl text-black">Register an account</h1>
        <form className="text-4xl text-black p-4" onSubmit={handleSubmit} method="POST">
          <div className="p-4">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" required/>
          </div>
          <div className="p-4">
            <p className="p-4">Password has no requirements, <br></br> however it is NOT secure<br></br></p>
            <label htmlFor="password">Password</label>
            <input type="password" id="password" name="password" required/>
          </div>
          <button className="bg-gray-400 p-2 m-8 rounded-xl justify-center items-center" type="submit">Register</button>
        </form>
        <Link href="/login" className="text-black">Already have an account? Log in</Link>
      </div>
    </section>
  </div>
  );
}
