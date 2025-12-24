"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { User as UserIcon, Menu, X } from 'lucide-react';

export default function Navbar() {
    const pathname = usePathname();
    const supabase = createClient();
    const [user, setUser] = useState<any>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Listen for auth state changes
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Check user session on mount and route changes
    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user || null);
        };

        checkUser();
    }, [pathname]);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-mocha-surface1 bg-mocha-base/80 backdrop-blur-md font-space">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 text-xl font-bold text-mocha-text hover:text-mocha-mauve transition-colors">
                    <span className="text-2xl"></span>
                    <span>NeuraLearn</span>
                </Link>

                {/* Mobile Menu Button */}
                <button
                    onClick={toggleMenu}
                    className="md:hidden p-2 text-mocha-subtext0 hover:text-mocha-text hover:bg-mocha-surface1 rounded-md transition-colors"
                >
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-6">
                    <Link
                        href="/"
                        className={`text-sm font-medium transition-colors hover:text-mocha-mauve ${pathname === '/' ? 'text-mocha-mauve' : 'text-mocha-subtext0'
                            } `}
                    >
                        Home
                    </Link>
                    <Link
                        href="/about"
                        className={`text-sm font-medium transition-colors hover:text-mocha-mauve ${pathname === '/about' ? 'text-mocha-mauve' : 'text-mocha-subtext0'
                            } `}
                    >
                        About
                    </Link>
                    <Link
                        href="/contact"
                        className={`text-sm font-medium transition-colors hover:text-mocha-mauve ${pathname === '/contact' ? 'text-mocha-mauve' : 'text-mocha-subtext0'
                            } `}
                    >
                        Contact
                    </Link>
                    {user && (
                        <>
                            <Link
                                href="/chat"
                                className={`text-sm font-medium transition-colors hover:text-mocha-mauve ${pathname === '/chat' ? 'text-mocha-mauve' : 'text-mocha-subtext0'
                                    }`}
                            >
                                Chat
                            </Link>
                            <Link
                                href="/pomodoro"
                                className={`text-sm font-medium transition-colors hover:text-mocha-mauve ${pathname === '/pomodoro' ? 'text-mocha-mauve' : 'text-mocha-subtext0'
                                    }`}
                            >
                                Pomodoro
                            </Link>
                        </>
                    )}
                    {user ? (
                        <div className="flex items-center gap-2 text-sm text-mocha-subtext0">
                            <div className="h-8 w-8 rounded-full bg-mocha-surface1 flex items-center justify-center">
                                <UserIcon size={16} />
                            </div>
                            <span className="hidden lg:inline">{user.user_metadata?.username || user.email}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Link
                                href="/signin"
                                className="text-sm font-medium text-mocha-subtext0 hover:text-mocha-text transition-colors"
                            >
                                Sign In
                            </Link>
                            <Link
                                href="/signup"
                                className="rounded-lg bg-mocha-mauve px-4 py-2 text-sm font-medium text-mocha-base hover:opacity-90 transition-opacity"
                            >
                                Sign Up
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Navigation Menu */}
            {
                isMenuOpen && (
                    <div className="md:hidden border-t border-mocha-surface1 bg-mocha-base">
                        <div className="space-y-1 px-4 pb-4 pt-2">
                            <Link
                                href="/"
                                onClick={() => setIsMenuOpen(false)}
                                className={`block w-full rounded-md px-3 py-2 text-base font-medium hover:bg-mocha-surface1 ${pathname === '/' ? 'text-mocha-mauve bg-mocha-surface0' : 'text-mocha-subtext0'
                                    }`}
                            >
                                Home
                            </Link>
                            <Link
                                href="/about"
                                onClick={() => setIsMenuOpen(false)}
                                className={`block w-full rounded-md px-3 py-2 text-base font-medium hover:bg-mocha-surface1 ${pathname === '/about' ? 'text-mocha-mauve bg-mocha-surface0' : 'text-mocha-subtext0'
                                    }`}
                            >
                                About
                            </Link>
                            <Link
                                href="/contact"
                                onClick={() => setIsMenuOpen(false)}
                                className={`block w-full rounded-md px-3 py-2 text-base font-medium hover:bg-mocha-surface1 ${pathname === '/contact' ? 'text-mocha-mauve bg-mocha-surface0' : 'text-mocha-subtext0'
                                    }`}
                            >
                                Contact
                            </Link>
                            {user && (
                                <>
                                    <Link
                                        href="/chat"
                                        onClick={() => setIsMenuOpen(false)}
                                        className={`block w-full rounded-md px-3 py-2 text-base font-medium hover:bg-mocha-surface1 ${pathname === '/chat' ? 'text-mocha-mauve bg-mocha-surface0' : 'text-mocha-subtext0'
                                            }`}
                                    >
                                        Chat
                                    </Link>
                                    <Link
                                        href="/pomodoro"
                                        onClick={() => setIsMenuOpen(false)}
                                        className={`block w-full rounded-md px-3 py-2 text-base font-medium hover:bg-mocha-surface1 ${pathname === '/pomodoro' ? 'text-mocha-mauve bg-mocha-surface0' : 'text-mocha-subtext0'
                                            }`}
                                    >
                                        Pomodoro
                                    </Link>
                                </>
                            )}
                            {user ? (
                                <div className="mt-4 space-y-2 border-t border-mocha-surface1 pt-4">
                                    <div className="flex items-center gap-2 px-3 text-sm text-mocha-subtext0">
                                        <UserIcon size={16} />
                                        <span>{user.user_metadata?.username || user.email}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-4 space-y-2 border-t border-mocha-surface1 pt-4">
                                    <Link
                                        href="/signin"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="block w-full rounded-md px-3 py-2 text-base font-medium text-mocha-subtext0 hover:bg-mocha-surface1"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        href="/signup"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="block w-full rounded-md bg-mocha-mauve px-3 py-2 text-center text-base font-medium text-mocha-base hover:opacity-90"
                                    >
                                        Get Started
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }
        </nav >
    );
}
