/**
 * Supabase browser client.
 * Use in Client Components ('use client') only.
 */
import { createBrowserClient } from '@supabase/ssr'
import type { CustomJWTClaims } from '@/lib/types/database'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Get the decoded JWT claims from the current session.
 * Returns null if not authenticated.
 */
export async function getJWTClaims(): Promise<CustomJWTClaims | null> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  // The JWT payload is base64-decoded
  const payload = JSON.parse(atob(session.access_token.split('.')[1]))
  return payload as CustomJWTClaims
}
