import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ccckqlqweripefauvgwl.supabase.co";
const supabaseAnonKey = "sb_publishable_8AaJxOdk0AziAQe_kOyacQ_f6j_Z_7a";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
