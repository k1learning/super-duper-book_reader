import { createClient } from '@supabase/supabase-js'

// Lazy, tolerant client construction. We can't call createClient() at module
// load time with empty strings because @supabase/supabase-js validates the
// URL and throws — that would crash the entire Next.js build whenever env
// vars are missing on the build host (e.g. a fresh Vercel project).
//
// Instead we build a Proxy that defers createClient() until the first real
// access. Every server action then either gets a real client (env vars
// present) or hits a clear "Supabase not configured" error at request time,
// which surfaces as the orange setup banner instead of a build failure.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let realClient = null
function getRealClient() {
  if (realClient) return realClient
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase is not configured: missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Set them in your environment (Vercel → Project → Settings → Environment Variables, or .env.local for local dev).'
    )
  }
  realClient = createClient(supabaseUrl, supabaseAnonKey)
  return realClient
}

export const supabase = new Proxy(
  {},
  {
    get(_target, prop) {
      const client = getRealClient()
      const value = client[prop]
      return typeof value === 'function' ? value.bind(client) : value
    },
  }
)

export function getSupabaseConfig() {
  return {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
  }
}

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey)
}
