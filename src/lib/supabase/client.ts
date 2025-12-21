import { createBrowserClient } from '@supabase/ssr'
import config from '../../../config.json'

export function createClient() {
    return createBrowserClient(
        config.supabaseUrl,
        config.supabaseAnonKey,
    )
}
