import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const demoMode = import.meta.env.VITE_BLITHOB_DEMO_MODE === "true";

export const isSupabaseConfigured = Boolean(
  url && anonKey && import.meta.env.MODE !== "test" && !demoMode
);

export const supabase = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null;

export const supabaseProjectUrl = url ?? "";
