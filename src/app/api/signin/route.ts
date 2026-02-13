
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, message } = body;

        if (!name || !email || !message) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const { error } = await supabaseAdmin
            .from('feedbacks')
            .insert({
                name,
                email,
                message,
            });

        if (error) {
            console.error('Error submitting feedback:', error);
            return NextResponse.json(
                { error: 'Failed to submit feedback: ' + error.message },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { message: 'Feedback submitted successfully' },
            { status: 200 }
        );

    } catch (error) {
        console.error('Feedback API Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
