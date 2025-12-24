"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function ProfileGuard() {
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();

    useEffect(() => {
        const checkProfile = async () => {
             const { data: { session } } = await supabase.auth.getSession();
             
             // If not logged in, nothing to check
             if (!session) return;

             // Skip check on auth pages or public pages if desired, 
             // but user wants "everytime someone enters" (implies logged in state active)
             // We'll check essentially when we have a user.

             const { data, error } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', session.user.id)
                .single();

            if (error || !data) {
                console.warn("User has no profile, logging out.");
                toast.error("Account not found. Please sign up or sign in again.");
                await supabase.auth.signOut();
                router.push('/signin');
            }
        };

        // Run on mount and path changes to ensure consistency
        checkProfile();
    }, [pathname, router, supabase]);

    return null;
}
