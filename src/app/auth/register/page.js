'use client';

import {signIn, useSession} from 'next-auth/react';
import {useRouter} from 'next/navigation';
import {useEffect, useState} from 'react';
import Link from 'next/link';

export default function Register() {
    const {data: session, status} = useSession();
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);
    const [loginError, setLoginError] = useState('');

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        const executeSessionCreation = async () => {
            if (status === "authenticated") {
                await callCreateDefaultSessions()
                router.push('/dashboard/timer');
            }
        }
        executeSessionCreation();
    }, [status]);

    if (!isClient) {
        return null; // or a loading spinner
    }

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
            body: JSON.stringify({email, password}),
        });

        const data = await res.json();
        if (data.success) {
            console.log('Registration successful');
            window.location.href = '/auth/login?signupSuccess=true';
        } else {
            setLoginError("Registration Failed, Username Already Exists");
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

    async function createDefaultSessions(sessionName) {
        try {
            const response = await fetch('/api/sessions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({sessionName: sessionName}),
            })
            if (response.ok) {
                console.log("Successfully created sessions: ", sessionName);
            }
        } catch (error) {
            console.log("Error creating default Sessions:", error);
        }
    }

    async function callCreateDefaultSessions() {
        const defaultSession = ['3x3', '5x5'];
        await Promise.all(defaultSession.map(async name => await createDefaultSessions(name)));
    }

    return (
        <section className="flex flex-col items-center justify-center h-full py-8">
            <div className="w-full md:w-1/2 text-center p-4">
                <h1 className="text-5xl">Register</h1>
                <form className="text-3xl p-4 pb-0" onSubmit={handleSubmit} method="POST">
                    <div className="flex items-center justify-center">
                        {
                            loginError && (
                                <div>
                                    <span
                                        className="p-2 text-xl text-red-600 font-semibold cursor-default"> {loginError} </span>
                                </div>
                            )
                        }
                    </div>
                    <div className="flex flex-col my-auto">
                        <div className="m-2">
                            <input type="email" id="email" name="email" autoComplete="email" placeholder="Email"
                                   className="w-full md:w-3/5 rounded-xl p-4 bg-primary/20 border border-white"
                                   required/>
                        </div>
                        <div className="m-2">
                            <input type="password" id="password" name="password" placeholder="Password"
                                   className="w-full md:w-3/5 rounded-xl p-4 bg-primary/20 border border-white"
                                   required/>
                        </div>
                        <p className="p-4 text-xl"> &#128712; Password has no requirements </p>
                    </div>
                    <button className="button w-3/5" type="submit">Register</button>
                </form>
                <div className="mt-4 mb-4 text-center">
                    <button onClick={handleGitHubLogin}
                            className={'py-2 p-4 bg-button bg-black text-white font-semibold border border-black rounded-md hover:bg-gray-900 hover:border-gray-900 cursor-pointer active:bg-gray-600'}>
                    <span className={"flex justify-center items-center gap-2"}>
                        <img src="/github.svg" alt="GitHub_Logo" width="30px"/>
                        Continue with GitHub
                    </span>
                    </button>
                </div>
                <div className="mt-4 mb-4 text-center">
                    <button onClick={handleGoogleLogin}
                            className={'py-2 p-4 bg-button bg-black text-white font-semibold border border-black rounded-md hover:bg-gray-900 hover:border-gray-900 cursor-pointer active:bg-gray-600'}>
                    <span className={"flex justify-center items-center gap-2"}>
                      <img src="/google.svg" alt="Continue with Google" width="30px"/>
                      Continue with Google
                    </span>
                    </button>
                </div>
                <Link href="/auth/login" className="text-xl hover:text-button-hover hover:text-blue-600 cursor-pointer">Already
                    have an account? Log in</Link>
            </div>
        </section>
    );
}
