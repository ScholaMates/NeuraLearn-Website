import { createClient } from '@supabase/supabase-js';
import config from '../../config.json'

const supabaseUrl = config.supabaseUrl;
const supabaseKey = config.supabaseAnonKey;

export const supabase = createClient(supabaseUrl, supabaseKey);
