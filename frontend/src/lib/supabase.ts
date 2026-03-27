import { createClient } from '@supabase/supabase-js'

/**
 * Server-side only Supabase client (service role).
 * Never import this in client components — the service role key must not reach the browser.
 */
export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    return null
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  })
}
