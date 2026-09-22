'use server'

/**
 * Server actions for the Invitations module.
 *
 * Flow:
 *  1. Tenant admin calls sendInvitation(slug, email, role)
 *  2. We insert a row into `invitations` with a random token
 *  3. Supabase Auth sends the invite email (inviteUserByEmail via service role)
 *  4. The accept link /api/invitations/accept?token=<uuid> is shown as a backup
 *  5. Clicking the link sets accepted_at and adds the user to tenant_members
 */

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient, getServerJWTClaims } from '@/lib/supabase/server'
import type { MemberRole } from '@/lib/types/database'
import type { Invitation } from './types'

// ── Helpers ─────────────────────────────────────────────────────────────────

async function getTenantId(tenantSlug: string): Promise<string | null> {
  const claims = await getServerJWTClaims()
  if (!claims) return null
  if (claims.tenant_id) return claims.tenant_id

  const supabase = await createClient()
  const { data } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', tenantSlug)
    .single()
  return data?.id ?? null
}

async function requireAdmin(tenantSlug: string): Promise<{ tenantId: string; userId: string }> {
  const claims = await getServerJWTClaims()
  if (!claims) redirect(`/login?redirect=/${tenantSlug}/invitations`)

  const tenantId = await getTenantId(tenantSlug)
  if (!tenantId) redirect('/')

  const isAdmin =
    claims.is_il_admin ||
    claims.role === 'admin' ||
    claims.role === 'owner'

  if (!isAdmin) redirect(`/${tenantSlug}/dashboard`)

  return { tenantId, userId: claims.sub }
}

// ── Reads ────────────────────────────────────────────────────────────────────

export async function getInvitations(tenantSlug: string): Promise<Invitation[]> {
  const claims = await getServerJWTClaims()
  if (!claims) return []

  const tenantId = await getTenantId(tenantSlug)
  if (!tenantId) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (error) return []
  return (data ?? []) as Invitation[]
}

// ── Mutations ────────────────────────────────────────────────────────────────

export async function sendInvitation(
  tenantSlug: string,
  formData: FormData
): Promise<{ error?: string; acceptLink?: string }> {
  const { tenantId, userId } = await requireAdmin(tenantSlug)

  const email = (formData.get('email') as string | null)?.trim().toLowerCase()
  const role = (formData.get('role') as MemberRole | null) ?? 'viewer'

  if (!email) return { error: 'Email is required.' }
  if (!['viewer', 'editor', 'admin'].includes(role)) return { error: 'Invalid role.' }

  // ── 1. Check for existing pending invitation ────────────────────────────
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('invitations')
    .select('id, accepted_at, expires_at')
    .eq('tenant_id', tenantId)
    .eq('email', email)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (existing) {
    return { error: 'A pending invitation for this email already exists.' }
  }

  // ── 2. Check if already a member ───────────────────────────────────────
  const serviceClient = createServiceClient()

  // Find user id by email via admin API
  const { data: usersData } = await serviceClient.auth.admin.listUsers()
  const existingUser = usersData?.users?.find(u => u.email === email)

  if (existingUser) {
    // Check if already a member of this tenant
    const { data: membership } = await supabase
      .from('tenant_members')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('user_id', existingUser.id)
      .eq('is_active', true)
      .maybeSingle()

    if (membership) {
      return { error: 'This user is already a member of your organisation.' }
    }
  }

  // ── 3. Insert invitation row ────────────────────────────────────────────
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: invitation, error: insertError } = await supabase
    .from('invitations')
    .insert({
      tenant_id: tenantId,
      email,
      role,
      invited_by: userId,
      expires_at: expiresAt,
    })
    .select()
    .single()

  if (insertError || !invitation) {
    return { error: insertError?.message ?? 'Failed to create invitation.' }
  }

  // ── 4. Send invite email via Supabase Auth ──────────────────────────────
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  const redirectTo = `${origin}/api/invitations/accept?token=${invitation.token}`

  const { error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: {
      invitation_token: invitation.token,
      tenant_slug: tenantSlug,
    },
  })

  if (inviteError) {
    // Roll back the invitation row if email sending fails
    await supabase.from('invitations').delete().eq('id', invitation.id)
    return { error: inviteError.message }
  }

  revalidatePath(`/${tenantSlug}/invitations`)
  return { acceptLink: redirectTo }
}

export async function revokeInvitation(tenantSlug: string, invitationId: string): Promise<void> {
  const { tenantId } = await requireAdmin(tenantSlug)

  const supabase = await createClient()
  await supabase
    .from('invitations')
    .delete()
    .eq('id', invitationId)
    .eq('tenant_id', tenantId)

  revalidatePath(`/${tenantSlug}/invitations`)
}
