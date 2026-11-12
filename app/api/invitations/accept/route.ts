/**
 * GET /api/invitations/accept?token=<uuid>
 *
 * Invitation accept-link handler.
 * Marks invitation accepted, adds to tenant_members, redirects to onboarding
 * if user has no full_name yet, otherwise to tenant dashboard.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient, getServerJWTClaims } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) return NextResponse.redirect(new URL('/login?error=missing_token', request.url))

  const serviceClient = createServiceClient()

  const { data: invitation, error: fetchError } = await serviceClient
    .from('invitations')
    .select('*, tenants(slug)')
    .eq('token', token)
    .maybeSingle()

  if (fetchError || !invitation) return NextResponse.redirect(new URL('/login?error=invalid_invitation', request.url))

  if (invitation.accepted_at) {
    const slug = (invitation.tenants as { slug: string } | null)?.slug
    if (slug) return NextResponse.redirect(new URL(`/${slug}/dashboard`, request.url))
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (new Date(invitation.expires_at) < new Date())
    return NextResponse.redirect(new URL('/login?error=invitation_expired', request.url))

  const claims = await getServerJWTClaims()
  if (!claims) {
    return NextResponse.redirect(
      new URL(`/login?redirect=/api/invitations/accept?token=${token}`, request.url)
    )
  }

  const tenantSlug = (invitation.tenants as { slug: string } | null)?.slug

  await serviceClient
    .from('invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invitation.id)

  const { error: memberError } = await serviceClient.from('tenant_members').upsert(
    {
      tenant_id: invitation.tenant_id,
      user_id: claims.sub,
      role: invitation.role,
      is_active: true,
      status: 'active',
      joined_via: 'invitation',
      invited_by: invitation.invited_by,
      invited_at: invitation.created_at,
    },
    { onConflict: 'tenant_id,user_id', ignoreDuplicates: false }
  )

  if (memberError) console.error('[invitations/accept] failed to add member:', memberError.message)

  const { data: userData } = await serviceClient.auth.admin.getUserById(claims.sub)
  const hasName = !!(userData?.user?.user_metadata?.full_name as string | undefined)?.trim()

  const destination = tenantSlug ? `/${tenantSlug}/dashboard` : '/'

  if (!hasName) {
    const onboardingUrl = new URL('/auth/onboarding', request.url)
    onboardingUrl.searchParams.set('redirect', destination)
    return NextResponse.redirect(onboardingUrl)
  }

  return NextResponse.redirect(new URL(destination, request.url))
}
