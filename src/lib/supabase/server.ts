
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import config from '../../../config.json'

export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(
        config.supabaseUrl,
        config.supabaseAnonKey,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                    }
                },
            },
        }
    )
}
