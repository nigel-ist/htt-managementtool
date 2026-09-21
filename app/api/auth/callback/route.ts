/**
 * Auth callback route — handles:
 * 1. Magic link / OTP email confirmations
 * 2. Google OAuth redirects
 *
 * Supabase exchanges the `code` param for a session, then we redirect
 * the user to wherever they were going (read from ?redirect= query param).
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirectTo = searchParams.get('redirect') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Redirect to the intended destination (or root, which handles auth routing)
      return NextResponse.redirect(new URL(redirectTo, origin))
    }
  }

  // Something went wrong — send back to login with an error hint
  const loginUrl = new URL('/login', origin)
  loginUrl.searchParams.set('error', 'auth_callback_failed')
  return NextResponse.redirect(loginUrl)
}
