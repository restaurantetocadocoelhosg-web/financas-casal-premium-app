import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://zuwdgyvbuaocbzckhhlm.supabase.co";

export const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_ZaDFQjjuOmUtPC1YEY1SKA_YnCvbAYS";

export const SUPABASE_ENABLED = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

export const supabase = SUPABASE_ENABLED
  ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
