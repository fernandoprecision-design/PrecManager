import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yrazxojiiuscidbfxfrp.supabase.co';
const supabaseAnonKey = 'sb_publishable_Ala69T0OlNlpJkUNACCVzg_EFBPi57L';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const STORAGE_BUCKET = 'projetos-engenharia';
