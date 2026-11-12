/**
 * Auth callback route — handles:
 * 1. Magic link / OTP email confirmations
 * 2. Google OAuth redirects
 * 3. Self-signup via invite code (pending_tenant_slug + pending_invite_code in user metadata)
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirectTo = searchParams.get('redirect') ?? '/'

  if (!code) {
    const loginUrl = new URL('/login', origin)
    loginUrl.searchParams.set('error', 'auth_callback_failed')
    return NextResponse.redirect(loginUrl)
  }

  const supabase = await createClient()
  const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !sessionData?.user) {
    const loginUrl = new URL('/login', origin)
    loginUrl.searchParams.set('error', 'auth_callback_failed')
    return NextResponse.redirect(loginUrl)
  }

  const user = sessionData.user
  const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>
  const pendingTenantSlug = meta.pending_tenant_slug
  const pendingInviteCode = meta.pending_invite_code
  const fullName = meta.full_name
  const termsAcceptedAt = meta.terms_accepted_at

  // ── Handle pending invite-code signup ────────────────────────────────────
  if (pendingTenantSlug && pendingInviteCode) {
    const serviceClient = createServiceClient()

    const { data: codeRow, error: codeError } = await serviceClient
      .from('tenant_invite_codes')
      .select('*, tenants(id, slug)')
      .eq('code', pendingInviteCode)
      .eq('is_active', true)
      .maybeSingle()

    if (codeError || !codeRow) {
      console.error('[auth/callback] invalid invite code:', pendingInviteCode)
      await _clearPendingMeta(supabase, user.id)
      return NextResponse.redirect(new URL('/login?error=invalid_invite_code', origin))
    }

    if (codeRow.expires_at && new Date(codeRow.expires_at) < new Date()) {
      await _clearPendingMeta(supabase, user.id)
      return NextResponse.redirect(new URL('/login?error=invite_code_expired', origin))
    }

    if (codeRow.max_uses !== null && codeRow.uses_count >= codeRow.max_uses) {
      await _clearPendingMeta(supabase, user.id)
      return NextResponse.redirect(new URL('/login?error=invite_code_full', origin))
    }

    const tenantSlug = (codeRow.tenants as { id: string; slug: string } | null)?.slug
    const tenantId = (codeRow.tenants as { id: string; slug: string } | null)?.id

    if (!tenantId || tenantSlug !== pendingTenantSlug) {
      await _clearPendingMeta(supabase, user.id)
      return NextResponse.redirect(new URL('/login?error=invalid_invite_code', origin))
    }

    const memberStatus = codeRow.requires_validation ? 'pending_validation' : 'active'
    const { error: memberError } = await serviceClient.from('tenant_members').upsert(
      {
        tenant_id: tenantId,
        user_id: user.id,
        role: codeRow.default_role,
        is_active: true,
        status: memberStatus,
        joined_via: 'code',
        full_name: fullName ?? null,
        terms_accepted_at: termsAcceptedAt ?? null,
      },
      { onConflict: 'tenant_id,user_id', ignoreDuplicates: false }
    )

    if (memberError) {
      console.error('[auth/callback] failed to add member:', memberError.message)
    }

    await serviceClient
      .from('tenant_invite_codes')
      .update({ uses_count: (codeRow.uses_count ?? 0) + 1 })
      .eq('id', codeRow.id)

    await _clearPendingMeta(supabase, user.id)

    const destination = `/${tenantSlug}/dashboard`
    return NextResponse.redirect(new URL(destination, origin))
  }

  // ── Standard flow ─────────────────────────────────────────────────────────
  return NextResponse.redirect(new URL(redirectTo, origin))
}

async function _clearPendingMeta(
  supabase: Awaited<ReturnType<typeof createClient>>,
  _userId: string
) {
  try {
    await supabase.auth.updateUser({
      data: { pending_tenant_slug: null, pending_invite_code: null },
    })
  } catch (err) {
    console.error('[auth/callback] failed to clear pending metadata:', err)
  }
}
