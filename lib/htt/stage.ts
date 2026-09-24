/**
 * Lightweight server-only helper.
 * Returns the current user's HTT stage (1–5), or null if no baseline exists.
 * Used by non-HTT modules that want to embed the HTT Coach.
 */
import { createClient, getServerJWTClaims } from '@/lib/supabase/server'

export async function getHttStageForUser(tenantSlug: string): Promise<number | null> {
  const claims = await getServerJWTClaims()
  if (!claims?.sub) return null

  const supabase = await createClient()

  const tenantId: string | null = claims.tenant_id ?? await (async () => {
    const { data } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
    return data?.id ?? null
  })()
  if (!tenantId) return null

  const { data } = await supabase
    .from('htt_baselines')
    .select('stage')
    .eq('tenant_id', tenantId)
    .eq('user_id', claims.sub)
    .order('assessed_at', { ascending: false })
    .limit(1)
    .single()

  return data?.stage ?? null
}
