'use client';
import './../globals.css';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import {useRouter, useSearchParams} from 'next/navigation';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { GSP_NO_RETURNED_VALUE } from 'next/dist/lib/constants';


export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loginError, setLoginError] = useState('');
  const [signUpState, setSignUpState] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      router.push('/timer');
    }
  }, [status, router]);

  useEffect(() => {
    if(searchParams.get('signupSuccess') === 'true') {
      setSignUpState(true);
    }
  }, [searchParams]);



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
        redirect: false
      });

      if(result.status === 401) {
        setLoginError("Incorrect email or password");
      }
    } catch (error) {
      console.error(error);
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
    <div className="bg-gray-300 overflow-hidden" >
    <nav className="bg-red-700 shadow-2xl sticky top-0 left-0 p-4 mb-2">
      <div className="container mx-auto flex text-4xl sticky justify-between items-center">
        <Link href = "/">
          <div className="font-bold">Kermit Timer</div>
        </Link>
        <Link href = "/login">
          <div className="flex space-x-10 ml-auto">Log In</div>
        </Link>
      </div>
    </nav>
    <section className="min-h-screen flex items-center justify-center">
      <div className="md:w-1/2 text-center p-8">
        <h1 className="text-5xl text-black">Log in</h1>
        <form className="text-3xl text-black p-4 pb-0" onSubmit={handleSubmit}>
          <div className="flex items-center justify-center">
            {
                loginError && (
                    <div>
                      <span className="p-2 text-xl text-red-600 cursor-default"> {loginError} </span>
                    </div>
                )
            }
          </div>
          <div className="flex items-center justify-center">
            {
              signUpState && (
                    <div className ='p-2 text-xl'>
                      &#128712; Account created. Log in to continue.
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
          </div>
          <button className="bg-gray-400 py-2 p-4 m-2 text-2xl rounded-xl justify-center items-center active:bg-gray-600 cursor-pointer" type="submit">Log In</button>
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
        <Link href="/register" className ="text-black text-xl hover:text-button-hover hover:text-blue-600 cursor-pointer">New here? Register now</Link>
      </div>
    </section>
  </div>
  );
}
