import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Missing email or password' },
                { status: 400 }
            );
        }

        const emailToUse = email;



        // Authenticate using the server client
        const supabase = await createClient();

        const { data, error } = await supabase.auth.signInWithPassword({
            email: emailToUse,
            password: password,
        });

        if (error) {
            return NextResponse.json(
                { error: error.message },
                { status: 401 }
            );
        }

        // No need to return session manually, cookies are set
        return NextResponse.json(
            { message: 'Sign in successful', user: data.user },
            { status: 200 }
        );
    } catch (error) {
        console.error('Sign in error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
