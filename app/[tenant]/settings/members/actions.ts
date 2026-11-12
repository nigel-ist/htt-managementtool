'use server'

/**
 * Server actions for Settings > Members.
 * Requires workspace admin/owner role.
 */
import { revalidatePath } from 'next/cache'
import { createServiceClient, getServerJWTClaims } from '@/lib/supabase/server'
import type { MemberRole } from '@/lib/types/database'

export interface MemberRow {
  userId: string
  email: string
  fullName: string | null
  role: MemberRole
  status: string
  joinedVia: string
  joinedAt: string
}

async function requireAdmin(tenantSlug: string): Promise<string | null> {
  const claims = await getServerJWTClaims()
  if (!claims) return null
  if (claims.is_il_admin) return claims.sub
  if (claims.tenant_slug !== tenantSlug) return null
  if (claims.role !== 'owner' && claims.role !== 'admin') return null
  return claims.sub
}

export async function getMembers(tenantSlug: string): Promise<MemberRow[]> {
  const supabase = createServiceClient()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', tenantSlug)
    .single()

  if (!tenant) return []

  const { data: members } = await supabase
    .from('tenant_members')
    .select('user_id, role, is_active, status, joined_via, full_name, created_at')
    .eq('tenant_id', tenant.id)
    .order('created_at')

  if (!members) return []

  const rows: MemberRow[] = []

  for (const m of members) {
    const { data: authData } = await supabase.auth.admin.getUserById(m.user_id)
    const metaName = authData?.user?.user_metadata?.full_name as string | undefined
    rows.push({
      userId: m.user_id,
      email: authData?.user?.email ?? '',
      fullName: m.full_name ?? metaName ?? null,
      role: m.role as MemberRole,
      status: m.status ?? 'active',
      joinedVia: m.joined_via ?? 'invitation',
      joinedAt: m.created_at ?? '',
    })
  }

  return rows
}

export async function changeRole(
  tenantSlug: string,
  userId: string,
  newRole: MemberRole
): Promise<{ error?: string }> {
  const callerId = await requireAdmin(tenantSlug)
  if (!callerId) return { error: 'Unauthorized' }
  if (callerId === userId) return { error: 'You cannot change your own role.' }

  const supabase = createServiceClient()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', tenantSlug)
    .single()

  if (!tenant) return { error: 'Workspace not found.' }

  const { error } = await supabase
    .from('tenant_members')
    .update({ role: newRole })
    .eq('tenant_id', tenant.id)
    .eq('user_id', userId)

  if (error) return { error: error.message }

  revalidatePath(`/${tenantSlug}/settings/members`)
  return {}
}

export async function validateMemberFromSettings(
  tenantSlug: string,
  userId: string
): Promise<{ error?: string }> {
  const callerId = await requireAdmin(tenantSlug)
  if (!callerId) return { error: 'Unauthorized' }

  const supabase = createServiceClient()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', tenantSlug)
    .single()

  if (!tenant) return { error: 'Workspace not found.' }

  const { error } = await supabase
    .from('tenant_members')
    .update({ status: 'active' })
    .eq('tenant_id', tenant.id)
    .eq('user_id', userId)

  if (error) return { error: error.message }

  revalidatePath(`/${tenantSlug}/settings/members`)
  return {}
}

export async function deleteMember(
  tenantSlug: string,
  userId: string
): Promise<{ error?: string }> {
  const callerId = await requireAdmin(tenantSlug)
  if (!callerId) return { error: 'Unauthorized' }
  if (callerId === userId) return { error: 'You cannot remove yourself.' }

  const supabase = createServiceClient()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', tenantSlug)
    .single()

  if (!tenant) return { error: 'Workspace not found.' }

  const { error } = await supabase
    .from('tenant_members')
    .delete()
    .eq('tenant_id', tenant.id)
    .eq('user_id', userId)

  if (error) return { error: error.message }

  revalidatePath(`/${tenantSlug}/settings/members`)
  return {}
}
