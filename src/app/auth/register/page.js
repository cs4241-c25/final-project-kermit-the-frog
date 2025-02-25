'use client';

import {signIn, useSession} from 'next-auth/react';
import { useRouter } from 'next/navigation'; 
import {useEffect, useState} from 'react';
import '../../../public/github.svg'
import './../globals.css';
import Link from 'next/link';

export default function Register() {
  const { data: session, status } = useSession();
  const [loginError, setLoginError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push('/dashboard/timer');
    }
  }, [status, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleRegister(e.target.email.value, e.target.password.value);
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
      window.location.href = '/login?signupSuccess=true';
      setRedirectFromSignup(true)
    } else {
      setLoginError("Incorrect email or password");
      console.log(data.message);
    }
  };

  async function handleGitHubLogin() {
    try {
      await signIn('github');
    } catch (error) {
      console.log("Error signing in with Github:", error);
    }
  }

  async function handleGoogleLogin() {
    try {
      await signIn('google');
    } catch (error) {
      console.log("Error signing in with Google:", error);
    }
  }

  return (
    <div className="bg-gray-300 min-h-screen">
    <nav className="bg-red-700 shadow-2xl sticky top-0 p-4 left-0  mb-2">
      <div className="container mx-auto flex text-4xl sticky justify-between items-center">
        <Link href = "/">
          <div className="font-bold">Kermit Timer</div>
        </Link>
        <Link href = "/auth/login">
          <div className="flex space-x-10 ml-auto">Log In</div>
        </Link>
      </div>
    </nav>
    <section className="min-h-screen flex items-center justify-center">
      <div className="md:w-1/2 text-center p-4">
        <h1 className="text-5xl text-black">Register</h1>
        <form className="text-3xl text-black p-4 pb-0" onSubmit={handleSubmit} method="POST">
          <div className="flex items-center justify-center">
            {
                loginError && (
                    <div>
                      <span className="p-2 text-xl text-red-600 cursor-default"> {loginError} </span>
                    </div>
                )
            }
          </div>
          <div className="flex flex-col my-auto">
            <div className="m-2" >
              <input type="email" id="email" name="email" autoComplete="email" placeholder="Email"
                     className="w-3/5 rounded-xl p-4"
                     required/>
            </div>
            <div className="m-2">
              <input type="password" id="password" name="password" placeholder="Password"
                     className="w-3/5 rounded-xl p-4"
                     required/>
            </div>
            <p className="p-4 text-xl"> &#128712; Password has no requirements </p>
          </div>
          <button className="bg-gray-400 py-2 p-4 mr-2 ml-2 text-2xl rounded-xl justify-center items-center active:bg-gray-600 cursor-pointer" type="submit">Register</button>
        </form>
        <div className="mt-4 mb-4 text-center">
          <button onClick={handleGitHubLogin}
                  className={'py-2 p-4 bg-button bg-black text-white font-semibold border border-black rounded-md hover:bg-gray-900 hover:border-gray-900 cursor-pointer active:bg-gray-600'}>
                    <span className={"flex justify-center items-center gap-2"}>
                        <img src='/github.svg' alt={"GitHub_Logo"} width={"30px"}/>
                        Continue with GitHub
                    </span>
          </button>
        </div>
        <div className="mt-4 mb-4 text-center">
          <button onClick={handleGoogleLogin}
                  className={'py-2 p-4 bg-button bg-black text-white font-semibold border border-black rounded-md hover:bg-gray-900 hover:border-gray-900 cursor-pointer active:bg-gray-600'}>
                    <span className={"flex justify-center items-center gap-2"}>
                      {/* With Styles change asset depending if on light or dark mode, default is light */}
                      <img src={'/google.svg'} alt={'Continue with Google'} width={"30px"} />
                      Continue with Google
                    </span>
          </button>
        </div>
        <Link href="/auth/login" className ="text-black text-xl hover:text-button-hover hover:text-blue-600 cursor-pointer">Already have an account? Log in</Link>
      </div>
    </section>
  </div>
  );
}
