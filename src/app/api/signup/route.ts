import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, email, password, deviceId } = body;

        if (!username || !email || !password || !deviceId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check if Device ID exists and is unused
        const { data: deviceData, error: deviceError } = await supabaseAdmin
            .from('device_ids')
            .select('*')
            .eq('code', deviceId)
            .single();

        if (deviceError) {
            console.error('Supabase Device Query Error:', deviceError);
            // PGRST116 is the code for "multiple (or no) rows returned" - in this case, none found
            if (deviceError.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Device ID is invalid' },
                    { status: 400 }
                );
            }
            return NextResponse.json(
                { error: `Database Error: ${deviceError.message}` },
                { status: 400 }
            );
        }

        if (!deviceData) {
            return NextResponse.json(
                { error: 'Device ID not found' },
                { status: 400 }
            );
        }

        if (deviceData.is_used) {
            return NextResponse.json(
                { error: 'This Device ID has already been used' },
                { status: 400 }
            );
        }

        // Sign up the user
        // Using admin.auth.admin.createUser allows us to auto-confirm the email
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                username: username,
                device_id: deviceId
            }
        });

        if (authError) {
            return NextResponse.json(
                { error: authError.message },
                { status: 400 }
            );
        }

        if (!authData.user) {
            return NextResponse.json(
                { error: 'Signup failed. Please try again.' },
                { status: 500 }
            );
        }

        // Mark Device ID as used
        const { error: updateError } = await supabaseAdmin
            .from('device_ids')
            .update({ is_used: true, used_at: new Date().toISOString() })
            .eq('id', deviceData.id);

        if (updateError) {
            console.error('Failed to mark device as used:', updateError);
        }

        // Create Profile)
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
                id: authData.user.id,
                username,
                email,
                device_id: deviceId,
                password: password // Storing plain text password as requested
            });

        if (profileError) {
            console.error('Failed to create profile:', profileError);
            // If profile creation failed, we might want to return an warning, 
            // but the user is created, so let's return success.
            return NextResponse.json(
                { error: `Profile Creation Failed: ${profileError.message}` },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { message: 'Signup successful', user: authData.user },
            { status: 201 }
        );
    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
