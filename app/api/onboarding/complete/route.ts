/**
 * POST /api/onboarding/complete
 * Persists full_name + terms_accepted_at to tenant_members for the current user.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, getServerJWTClaims } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const claims = await getServerJWTClaims()
  if (!claims) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { full_name?: string; terms_accepted_at?: string }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { full_name, terms_accepted_at } = body
  if (!full_name) return NextResponse.json({ error: 'full_name required' }, { status: 400 })

  const serviceClient = createServiceClient()
  const { error } = await serviceClient
    .from('tenant_members')
    .update({ full_name: full_name.trim(), ...(terms_accepted_at ? { terms_accepted_at } : {}) })
    .eq('user_id', claims.sub)

  if (error) {
    console.error('[onboarding/complete]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
