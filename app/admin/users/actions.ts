'use server'

/**
 * Server actions for Admin > Users.
 * IL admin only — bypasses RLS via service client.
 */
import { revalidatePath } from 'next/cache'
import { createServiceClient, getServerJWTClaims } from '@/lib/supabase/server'
import type { MemberRole } from '@/lib/types/database'

async function requireILAdmin(): Promise<boolean> {
  const claims = await getServerJWTClaims()
  return !!claims?.is_il_admin
}

export interface AdminUserRow {
  id: string
  email: string | undefined
  fullName: string | null
  createdAt: string
  lastSignInAt: string | null
  tenantName: string | null
  tenantSlug: string | null
  role: string | null
  isActive: boolean
  status: string
  joinedVia: string
}

export async function getAllUsers(): Promise<AdminUserRow[]> {
  const supabase = createServiceClient()

  const { data: members, error } = await supabase
    .from('tenant_members')
    .select(`
      user_id, role, is_active, status, joined_via, full_name,
      tenants(name, slug)
    `)
    .order('user_id')

  if (error) console.error('[admin/users] members query error:', error)
  if (!members) return []

  const userIds = [...new Set(members.map(m => m.user_id))]
  const users: AdminUserRow[] = []

  for (const uid of userIds) {
    const { data: authData } = await supabase.auth.admin.getUserById(uid)
    const memberRows = members.filter(m => m.user_id === uid)
    const member = memberRows[0]
    const tenant = (member?.tenants as unknown as { name: string; slug: string } | null)

    const metaName = authData?.user?.user_metadata?.full_name as string | undefined

    users.push({
      id: uid,
      email: authData?.user?.email,
      fullName: member?.full_name ?? metaName ?? null,
      createdAt: authData?.user?.created_at ?? '',
      lastSignInAt: authData?.user?.last_sign_in_at ?? null,
      tenantName: tenant?.name ?? null,
      tenantSlug: tenant?.slug ?? null,
      role: member?.role ?? null,
      isActive: member?.is_active ?? false,
      status: member?.status ?? 'active',
      joinedVia: member?.joined_via ?? 'invitation',
    })
  }

  return users
}

export async function validateUserFromAdmin(
  userId: string
): Promise<{ error?: string }> {
  if (!await requireILAdmin()) return { error: 'Unauthorized' }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('tenant_members')
    .update({ status: 'active' })
    .eq('user_id', userId)

  if (error) return { error: error.message }

  revalidatePath('/admin/users')
  return {}
}

export async function deleteUserFromAdmin(
  userId: string
): Promise<{ error?: string }> {
  if (!await requireILAdmin()) return { error: 'Unauthorized' }

  const supabase = createServiceClient()

  // 1. Remove from all tenant_members
  const { error: memberErr } = await supabase
    .from('tenant_members')
    .delete()
    .eq('user_id', userId)

  if (memberErr) return { error: memberErr.message }

  // 2. Delete the auth.users record (hard delete)
  const { error: authErr } = await supabase.auth.admin.deleteUser(userId)
  if (authErr) return { error: authErr.message }

  revalidatePath('/admin/users')
  return {}
}

export async function inviteUserFromAdmin(
  tenantSlug: string,
  email: string,
  role: MemberRole
): Promise<{ error?: string; acceptLink?: string }> {
  if (!await requireILAdmin()) return { error: 'Unauthorized' }

  const supabase = createServiceClient()

  // Get tenant ID
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', tenantSlug)
    .single()

  if (!tenant) return { error: 'Workspace not found.' }

  // Check for existing pending invitation
  const { data: existing } = await supabase
    .from('invitations')
    .select('id')
    .eq('tenant_id', tenant.id)
    .eq('email', email)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (existing) return { error: 'A pending invitation already exists for this email.' }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: invitation, error: insertErr } = await supabase
    .from('invitations')
    .insert({
      tenant_id: tenant.id,
      email,
      role,
      expires_at: expiresAt,
    })
    .select()
    .single()

  if (insertErr || !invitation) return { error: insertErr?.message ?? 'Failed to create invitation.' }

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  const redirectTo = `${origin}/api/invitations/accept?token=${invitation.token}`

  const { error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: {
      invitation_token: invitation.token,
      tenant_slug: tenantSlug,
    },
  })

  if (inviteErr) {
    await supabase.from('invitations').delete().eq('id', invitation.id)
    return { error: inviteErr.message }
  }

  revalidatePath('/admin/users')
  return { acceptLink: redirectTo }
}
