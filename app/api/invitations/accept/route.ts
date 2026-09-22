/**
 * GET /api/invitations/accept?token=<uuid>
 *
 * Backup accept-link handler. Called when:
 *  - The user clicks the link from the UI rather than the email, OR
 *  - Supabase redirects here after the user confirms their email
 *    (via auth.admin.inviteUserByEmail redirectTo)
 *
 * Flow:
 *  1. Look up the invitation by token
 *  2. Verify not expired, not already accepted
 *  3. Mark accepted_at
 *  4. Insert the user into tenant_members (if not already there)
 *  5. Redirect to /<tenant>/dashboard
 *
 * Note: At this point Supabase has already authenticated the user —
 * their session cookie is set. We read claims to get their user_id.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient, getServerJWTClaims } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=missing_token', request.url))
  }

  // Use service client for the token lookup — invitation rows are admin-only via RLS
  // and the person clicking the accept link may not yet be authenticated.
  const serviceClient = createServiceClient()

  // ── 1. Look up invitation ──────────────────────────────────────────────
  const { data: invitation, error: fetchError } = await serviceClient
    .from('invitations')
    .select('*, tenants(slug)')
    .eq('token', token)
    .maybeSingle()

  if (fetchError || !invitation) {
    return NextResponse.redirect(new URL('/login?error=invalid_invitation', request.url))
  }

  // ── 2. Validate ────────────────────────────────────────────────────────
  if (invitation.accepted_at) {
    // Already accepted — send them to the tenant
    const slug = (invitation.tenants as { slug: string } | null)?.slug
    if (slug) return NextResponse.redirect(new URL(`/${slug}/dashboard`, request.url))
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return NextResponse.redirect(new URL('/login?error=invitation_expired', request.url))
  }

  // ── 3. Get authenticated user ─────────────────────────────────────────
  const claims = await getServerJWTClaims()
  if (!claims) {
    // Not signed in — send them to login with this accept link as redirect
    return NextResponse.redirect(
      new URL(`/login?redirect=/api/invitations/accept?token=${token}`, request.url)
    )
  }

  const tenantSlug = (invitation.tenants as { slug: string } | null)?.slug

  // ── 4. Mark invitation accepted ────────────────────────────────────────
  await serviceClient
    .from('invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invitation.id)

  // ── 5. Add to tenant_members (upsert — safe if already exists) ─────────
  const { error: memberError } = await serviceClient.from('tenant_members').upsert(
    {
      tenant_id: invitation.tenant_id,
      user_id: claims.sub,
      role: invitation.role,
      is_active: true,
      invited_by: invitation.invited_by,
      invited_at: invitation.created_at,
    },
    { onConflict: 'tenant_id,user_id', ignoreDuplicates: false }
  )

  if (memberError) {
    console.error('[invitations/accept] failed to add member:', memberError.message)
    // Still redirect — the user can try again or the admin can fix manually
  }

  // ── 6. Redirect to tenant dashboard ───────────────────────────────────
  const destination = tenantSlug ? `/${tenantSlug}/dashboard` : '/'
  return NextResponse.redirect(new URL(destination, request.url))
}
