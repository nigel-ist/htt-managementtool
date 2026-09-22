'use server'

/**
 * Server actions for Settings > Members.
 * Lists members and manages per-user module overrides.
 */
import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient, getServerJWTClaims } from '@/lib/supabase/server'
import type { MemberRole } from '@/lib/types/database'

async function getAdminTenantId(tenantSlug: string): Promise<string | null> {
  const claims = await getServerJWTClaims()
  if (!claims) return null

  const isAdmin =
    claims.is_il_admin || claims.role === 'admin' || claims.role === 'owner'
  if (!isAdmin) return null

  if (claims.tenant_id) return claims.tenant_id

  const supabase = await createClient()
  const { data } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
  return data?.id ?? null
}

export interface MemberRow {
  userId: string
  email: string
  role: MemberRole
  isActive: boolean
  invitedAt: string
}

export async function getMembers(tenantSlug: string): Promise<MemberRow[]> {
  const tenantId = await getAdminTenantId(tenantSlug)
  if (!tenantId) return []

  const supabase = await createClient()
  const serviceClient = createServiceClient()

  const { data: members } = await supabase
    .from('tenant_members')
    .select('user_id, role, is_active, invited_at')
    .eq('tenant_id', tenantId)
    .order('invited_at', { ascending: false })

  if (!members?.length) return []

  // Fetch user emails via admin API
  const { data: usersData } = await serviceClient.auth.admin.listUsers({ perPage: 1000 })
  const emailMap: Record<string, string> = {}
  for (const u of (usersData?.users ?? [])) {
    emailMap[u.id] = u.email ?? u.id
  }

  return members.map(m => ({
    userId: m.user_id,
    email: emailMap[m.user_id] ?? m.user_id,
    role: m.role as MemberRole,
    isActive: m.is_active,
    invitedAt: m.invited_at,
  }))
}

export interface UserModuleState {
  moduleKey: string
  roleDefault: boolean    // what role-level setting says
  override: boolean | null  // null = no override, true = granted, false = denied
}

export async function getUserModuleStates(
  tenantSlug: string,
  userId: string
): Promise<{ states: UserModuleState[]; userRole: MemberRole | null }> {
  const tenantId = await getAdminTenantId(tenantSlug)
  if (!tenantId) return { states: [], userRole: null }

  const supabase = await createClient()
  const { ROLE_ORDER } = await import('@/lib/modules/constants')

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

  const userRole = (memberRes.data?.role as MemberRole) ?? null
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

/**
 * Save per-user module overrides.
 * overrides: Record<moduleKey, boolean | null>
 *   - true  → explicit grant
 *   - false → explicit deny
 *   - null  → remove override (fall back to role default)
 */
export async function saveUserModuleOverrides(
  tenantSlug: string,
  userId: string,
  overrides: Record<string, boolean | null>
): Promise<{ error?: string }> {
  const tenantId = await getAdminTenantId(tenantSlug)
  if (!tenantId) return { error: 'Unauthorized' }

  const supabase = await createClient()

  const toUpsert: { tenant_id: string; user_id: string; module_key: string; can_access: boolean }[] = []
  const toDelete: string[] = []

  for (const [key, value] of Object.entries(overrides)) {
    if (value === null) {
      toDelete.push(key)
    } else {
      toUpsert.push({ tenant_id: tenantId, user_id: userId, module_key: key, can_access: value })
    }
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
