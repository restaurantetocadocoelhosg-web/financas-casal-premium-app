import { createClient } from "@supabase/supabase-js";

// Projeto Supabase dedicado do Prosperidade (conta pitocomeuc@gmail.com).
// Separado do banco do restaurante desde 09/09/2026 — ver Desktop/senhas/PROSPERIDADE_projeto_novo_2026-09-09.txt
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://bzrnwgmrnomiywbwdror.supabase.co";

export const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_F33LmbJgJtKEsEhTR3ElAg_NXX_6ZhR";

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
