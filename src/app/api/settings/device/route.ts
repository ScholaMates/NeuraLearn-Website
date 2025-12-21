import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { deviceId } = body;

        if (!deviceId) {
            return NextResponse.json({ error: 'Device ID is required' }, { status: 400 });
        }

        // Verify User Session
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if the user already has this device ID
        const { data: currentProfile } = await supabaseAdmin
            .from('profiles')
            .select('device_id')
            .eq('id', user.id)
            .single();

        if (currentProfile?.device_id === deviceId) {
            return NextResponse.json({ message: 'Device ID is already set to this value' });
        }

        // Validate New Device ID
        const { data: deviceData, error: deviceError } = await supabaseAdmin
            .from('device_ids')
            .select('*')
            .eq('code', deviceId)
            .single();

        if (deviceError || !deviceData) {
            return NextResponse.json({ error: 'Invalid Device ID' }, { status: 400 });
        }

        if (deviceData.is_used) {
            return NextResponse.json({ error: 'This Device ID has already been used' }, { status: 400 });
        }

        // Mark Device ID as used
        const { error: markUsedError } = await supabaseAdmin
            .from('device_ids')
            .update({ is_used: true, used_at: new Date().toISOString() })
            .eq('id', deviceData.id);

        if (markUsedError) {
            console.error('Failed to mark device as used:', markUsedError);
            return NextResponse.json({ error: 'Failed to claim device ID' }, { status: 500 });
        }

        // Update User Profile
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({ device_id: deviceId, updated_at: new Date().toISOString() })
            .eq('id', user.id);

        if (profileError) {
            console.error('Failed to update profile:', profileError);
            return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
        }

        // Release old Device ID if it exists
        if (currentProfile?.device_id && currentProfile.device_id !== deviceId) {
            const { error: releaseError } = await supabaseAdmin
                .from('device_ids')
                .update({ is_used: false, used_at: null })
                .eq('code', currentProfile.device_id);

            if (releaseError) {
                console.warn('Failed to release old device ID:', releaseError);
                // Proceed anyway, as the user update was successful
            }
        }

        await supabaseAdmin.auth.admin.updateUserById(user.id, {
            user_metadata: { device_id: deviceId }
        });

        return NextResponse.json({ message: 'Device ID updated successfully' });

    } catch (error) {
        console.error('Device Update Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
