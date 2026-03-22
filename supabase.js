import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sjnwuaxsvylyvsvemzuf.supabase.co";
const supabaseKey = "sb_publishable_2-H2HkD1Co2zt48xJ8LNIg_ZE2NaLJ1";

export const supabase = createClient(supabaseUrl, supabaseKey);
