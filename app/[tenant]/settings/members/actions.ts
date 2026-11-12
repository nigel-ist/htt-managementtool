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

// ─── Per-user module overrides (retained from previous version) ───────────────

export interface UserModuleState {
  moduleKey: string
  roleDefault: boolean      // what the role-level setting says
  override: boolean | null  // null = no override, true = granted, false = denied
}

export async function getUserModuleStates(
  tenantSlug: string,
  userId: string
): Promise<{ states: UserModuleState[]; userRole: string | null }> {
  const supabase = createServiceClient()
  const { ROLE_ORDER } = await import('@/lib/modules/constants')

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', tenantSlug)
    .single()

  if (!tenant) return { states: [], userRole: null }
  const tenantId = tenant.id

  const [memberRes, enabledRes, rolesRes, overridesRes] = await Promise.all([
    supabase
      .from('tenant_members')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .single(),
    supabase
      .from('tenant_modules')
      .select('module_key')
      .eq('tenant_id', tenantId)
      .eq('is_enabled', true),
    supabase
      .from('tenant_module_roles')
      .select('module_key, min_role')
      .eq('tenant_id', tenantId),
    supabase
      .from('tenant_module_user_overrides')
      .select('module_key, can_access')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId),
  ])

  const userRole = (memberRes.data?.role as string) ?? null
  const userRoleIdx = ROLE_ORDER.indexOf(userRole as typeof ROLE_ORDER[number])

  const roleDefaults: Record<string, string> = {}
  for (const r of (rolesRes.data ?? [])) roleDefaults[r.module_key] = r.min_role

  const overrideMap: Record<string, boolean> = {}
  for (const r of (overridesRes.data ?? [])) overrideMap[r.module_key] = r.can_access

  const enabledModules = (enabledRes.data ?? []).map(r => r.module_key as string)

  const states: UserModuleState[] = enabledModules.map(key => {
    const minRole = roleDefaults[key] ?? 'viewer'
    const minRoleIdx = ROLE_ORDER.indexOf(minRole as typeof ROLE_ORDER[number])
    const roleDefault = userRoleIdx >= minRoleIdx
    return {
      moduleKey: key,
      roleDefault,
      override: key in overrideMap ? overrideMap[key] : null,
    }
  })

  return { states, userRole }
}

export async function saveUserModuleOverrides(
  tenantSlug: string,
  userId: string,
  overrides: Record<string, boolean | null>
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
  const tenantId = tenant.id

  const toUpsert: { tenant_id: string; user_id: string; module_key: string; can_access: boolean }[] = []
  const toDelete: string[] = []

  for (const [key, value] of Object.entries(overrides)) {
    if (value === null) toDelete.push(key)
    else toUpsert.push({ tenant_id: tenantId, user_id: userId, module_key: key, can_access: value })
  }

  const errors: string[] = []

  if (toUpsert.length > 0) {
    const { error } = await supabase
      .from('tenant_module_user_overrides')
      .upsert(toUpsert, { onConflict: 'tenant_id,user_id,module_key' })
    if (error) errors.push(error.message)
  }

  if (toDelete.length > 0) {
    const { error } = await supabase
      .from('tenant_module_user_overrides')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .in('module_key', toDelete)
    if (error) errors.push(error.message)
  }

  if (errors.length > 0) return { error: errors.join('; ') }

  revalidatePath(`/${tenantSlug}/settings/members`)
  return {}
}
