"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { animate } from 'animejs';

export default function Signin() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current) {
            animate(
                containerRef.current,
                {
                    opacity: [0, 1],
                    translateY: [20, 0],
                    scale: [0.95, 1],
                    duration: 800,
                    easing: 'easeOutExpo'
                }
            );
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/signin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Sign in successful!');
                router.refresh();
                router.push('/');
            } else {
                toast.error(`Sign in failed: ${data.error || 'Unknown error'}`);
            }

        } catch (error) {
            console.error('Sign in error:', error);
            toast.error('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center bg-mocha-base px-4 py-12 sm:px-6 lg:px-8 overflow-hidden font-space">
            {/* Background Blobs */}
            <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-mocha-mauve/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-mocha-blue/20 rounded-full blur-[100px] pointer-events-none" />

            <div
                ref={containerRef}
                className="w-full max-w-md space-y-8 rounded-2xl bg-mocha-base/80 backdrop-blur-xl p-8 shadow-[0_0_40px_rgba(0,0,0,0.2)] border border-mocha-surface1/50 opacity-0"
            >
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-linear-to-r from-mocha-mauve to-mocha-blue drop-shadow-sm">
                        Welcome Back
                    </h2>
                    <p className="mt-2 text-sm text-mocha-subtext0">
                        Sign in to continue your journey
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="sr-only">
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="relative block w-full rounded-xl border border-mocha-surface2 bg-mocha-surface0/50 py-3 pl-4 text-mocha-text placeholder:text-mocha-overlay0 focus:z-10 focus:border-mocha-mauve focus:outline-hidden focus:ring-1 focus:ring-mocha-mauve focus:shadow-[0_0_15px_rgba(203,166,247,0.3)] transition-all sm:text-sm sm:leading-6"
                                placeholder="Email address"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="relative block w-full rounded-xl border border-mocha-surface2 bg-mocha-surface0/50 py-3 pl-4 text-mocha-text placeholder:text-mocha-overlay0 focus:z-10 focus:border-mocha-mauve focus:outline-hidden focus:ring-1 focus:ring-mocha-mauve focus:shadow-[0_0_15px_rgba(203,166,247,0.3)] transition-all sm:text-sm sm:leading-6"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative flex w-full justify-center rounded-xl bg-mocha-mauve px-3 py-3 text-sm font-bold text-mocha-base hover:bg-mocha-pink hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(245,194,231,0.5)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mocha-mauve disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 shadow-[0_0_15px_rgba(203,166,247,0.3)]"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4 text-mocha-base" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Signing in...
                                </span>
                            ) : 'Sign in'}
                        </button>
                    </div>

                    <div className="text-center text-sm">
                        <span className="text-mocha-subtext0">Don't have an account? </span>
                        <Link href="/signup" className="font-semibold text-mocha-mauve hover:text-mocha-pink transition-colors hover:underline decoration-2 underline-offset-4">
                            Sign up
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
