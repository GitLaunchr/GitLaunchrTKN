import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazy singleton — validated at call time, not at module import.
// This prevents Next.js build from crashing when env vars are absent.
let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("Missing env var: SUPABASE_URL");
  if (!key) throw new Error("Missing env var: SUPABASE_SERVICE_ROLE_KEY");

  _client = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _client;
}

// Proxy so existing code (supabaseAdmin.from(...)) keeps working unchanged.
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getClient() as never)[prop];
  },
});