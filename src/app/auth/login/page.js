'use client';
import Link from 'next/link';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Login() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Group all useState hooks together
  const [isClient, setIsClient] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [signUpState, setSignUpState] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      router.push('/dashboard/timer');
    }
  }, [status, router]);

  useEffect(() => {
    if(searchParams.get('signupSuccess') === 'true') {
      setSignUpState(true);
    }
  }, [searchParams]);

  if (!isClient) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = {
      email: e.target.email.value,
      password: e.target.password.value,
    };

    try {
      const result = await signIn('credentials', {
        ...formData,
        callbackUrl: '/dashboard/timer',
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
    <section className="flex flex-col items-center justify-center h-[calc(100vh-92px)]">
      <div className="md:w-1/2 text-center p-8">
        <h1 className="text-5xl ">Log in</h1>
        <form className="text-3xl  p-4 pb-0" onSubmit={handleSubmit}>
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
          <button className="button w-3/5" type="submit">Log In</button>
        </form>
        <div className="mt-4 mb-4 text-center">
          <button onClick={handleGitHubLogin}
                  className="py-2 p-4 bg-black text-white font-semibold border border-black rounded-md hover:bg-gray-900 hover:border-gray-900 cursor-pointer active:bg-gray-600">
                    <span className="flex justify-center items-center gap-2">
                        <img src="/github.svg" alt="GitHub" width="30" height="30" />
                        Continue with GitHub
                    </span>
          </button>
        </div>
        <div className="mt-4 mb-4 text-center">
          <button onClick={handleGoogleLogin}
                  className="py-2 p-4 bg-black text-white font-semibold border border-black rounded-md hover:bg-gray-900 hover:border-gray-900 cursor-pointer active:bg-gray-600">
                    <span className="flex justify-center items-center gap-2">
                      <img src="/google.svg" alt="Google" width="30" height="30" />
                      Continue with Google
                    </span>
          </button>
        </div>
        <Link href="/auth/register" className =" text-xl hover:text-button-hover hover:text-blue-600 cursor-pointer">New here? Register now</Link>
      </div>
    </section>
  );
}
