/**
 * Module access resolver — server-only.
 *
 * Call getAccessibleModules() from the tenant layout to determine which
 * modules the current user can navigate to. Returns a Set of module_keys.
 *
 * Resolution order:
 *   1. Module must be enabled for this tenant (tenant_modules.is_enabled)
 *   2. If the user has an explicit override row → use can_access (true/false)
 *   3. Otherwise check user's role >= tenant_module_roles.min_role
 *      (if no row: default min_role is 'viewer' — everyone sees it)
 *
 * IL admins bypass all checks and see every enabled module.
 */

import { createClient } from '@/lib/supabase/server'
import type { MemberRole } from '@/lib/types/database'
import { ROLE_ORDER } from './constants'

export async function getAccessibleModules(
  tenantId: string,
  userId: string,
  userRole: MemberRole | null,
  isIlAdmin: boolean
): Promise<Set<string>> {
  const supabase = await createClient()

  // ── 1. Fetch enabled modules ─────────────────────────────────────────────
  const { data: enabledRows } = await supabase
    .from('tenant_modules')
    .select('module_key')
    .eq('tenant_id', tenantId)
    .eq('is_enabled', true)

  const enabledModules = new Set((enabledRows ?? []).map(r => r.module_key as string))

  // IL admins see everything that's enabled
  if (isIlAdmin) return enabledModules

  if (!userRole) return new Set()

  // ── 2. Fetch role defaults + user overrides in parallel ──────────────────
  const [roleRes, overrideRes] = await Promise.all([
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

  const roleDefaults: Record<string, string> = {}
  for (const row of (roleRes.data ?? [])) {
    roleDefaults[row.module_key] = row.min_role
  }

  const userOverrides: Record<string, boolean> = {}
  for (const row of (overrideRes.data ?? [])) {
    userOverrides[row.module_key] = row.can_access
  }

  // ── 3. Resolve access for each enabled module ────────────────────────────
  const userRoleIdx = ROLE_ORDER.indexOf(userRole as typeof ROLE_ORDER[number])
  const accessible = new Set<string>()

  for (const module of enabledModules) {
    // User override wins
    if (module in userOverrides) {
      if (userOverrides[module]) accessible.add(module)
      continue
    }
    // Role check — default min_role is 'viewer' (everyone)
    const minRole = roleDefaults[module] ?? 'viewer'
    const minRoleIdx = ROLE_ORDER.indexOf(minRole as typeof ROLE_ORDER[number])
    if (userRoleIdx >= minRoleIdx) accessible.add(module)
  }

  return accessible
}
