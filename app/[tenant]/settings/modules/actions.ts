'use server'

/**
 * Server actions for Settings > Module Access.
 * Controls the minimum role required to see each module across this tenant.
 */
import { revalidatePath } from 'next/cache'
import { createClient, getServerJWTClaims } from '@/lib/supabase/server'

async function requireAdminTenantId(tenantSlug: string): Promise<string> {
  const claims = await getServerJWTClaims()
  if (!claims) throw new Error('Unauthorized')

  const isAdmin =
    claims.is_il_admin || claims.role === 'admin' || claims.role === 'owner'
  if (!isAdmin) throw new Error('Forbidden')

  const supabase = await createClient()

  if (claims.tenant_id) return claims.tenant_id

  const { data } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', tenantSlug)
    .single()

  if (!data) throw new Error('Tenant not found')
  return data.id
}

/**
 * Fetch the current role-level module settings for this tenant.
 * Returns a map of module_key → min_role.
 */
export async function getModuleRoleSettings(
  tenantSlug: string
): Promise<{ enabledModules: string[]; roleDefaults: Record<string, string> }> {
  const supabase = await createClient()

  const claims = await getServerJWTClaims()
  if (!claims) return { enabledModules: [], roleDefaults: {} }

  let tenantId = claims.tenant_id
  if (!tenantId) {
    const { data } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
    tenantId = data?.id ?? null
  }
  if (!tenantId) return { enabledModules: [], roleDefaults: {} }

  const [modulesRes, rolesRes] = await Promise.all([
    supabase
      .from('tenant_modules')
      .select('module_key')
      .eq('tenant_id', tenantId)
      .eq('is_enabled', true),
    supabase
      .from('tenant_module_roles')
      .select('module_key, min_role')
      .eq('tenant_id', tenantId),
  ])

  const enabledModules = (modulesRes.data ?? []).map(r => r.module_key as string)
  const roleDefaults: Record<string, string> = {}
  for (const r of (rolesRes.data ?? [])) {
    roleDefaults[r.module_key] = r.min_role
  }

  return { enabledModules, roleDefaults }
}

/**
 * Save role-level module settings.
 * FormData: module keys as names, min_role values as values.
 * Any module not in the form is reset to 'viewer'.
 */
export async function saveModuleRoleSettings(
  tenantSlug: string,
  formData: FormData
): Promise<{ error?: string }> {
  let tenantId: string
  try {
    tenantId = await requireAdminTenantId(tenantSlug)
  } catch (e: unknown) {
    return { error: (e as Error).message }
  }

  const supabase = await createClient()

  // Read all enabled modules so we know what to upsert
  const { data: enabledRows } = await supabase
    .from('tenant_modules')
    .select('module_key')
    .eq('tenant_id', tenantId)
    .eq('is_enabled', true)

  const enabled = (enabledRows ?? []).map(r => r.module_key as string)

  const upsertRows = enabled.map(key => ({
    tenant_id: tenantId,
    module_key: key,
    min_role: (formData.get(key) as string) || 'viewer',
  }))

  if (upsertRows.length > 0) {
    const { error } = await supabase
      .from('tenant_module_roles')
      .upsert(upsertRows, { onConflict: 'tenant_id,module_key' })

    if (error) return { error: error.message }
  }

  revalidatePath(`/${tenantSlug}/settings/modules`)
  return {}
}
