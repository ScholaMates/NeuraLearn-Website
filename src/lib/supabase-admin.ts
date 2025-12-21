import { createClient } from '@supabase/supabase-js';
import config from '../../config.json'

const supabaseUrl = config.supabaseUrl;
const supabaseServiceKey = config.supabaseServiceKey;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
