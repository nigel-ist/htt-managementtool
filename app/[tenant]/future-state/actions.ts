'use server'

/**
 * Future State module — server actions.
 *
 * DB table: future_state
 * ─────────────────────────────────────────────────────────────────
 * CREATE TABLE future_state (
 *   id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
 *   tenant_id       uuid        NOT NULL REFERENCES tenants(id) UNIQUE,
 *   vision          text,
 *   strategic_goals jsonb       NOT NULL DEFAULT '[]',
 *   ai_narrative    text,
 *   updated_by      uuid        REFERENCES auth.users(id),
 *   updated_at      timestamptz NOT NULL DEFAULT now()
 * );
 *
 * ALTER TABLE future_state ENABLE ROW LEVEL SECURITY;
 *
 * CREATE POLICY "tenant_isolation" ON future_state
 *   USING (
 *     tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
 *     OR (auth.jwt() ->> 'is_il_admin') = 'true'
 *   );
 */

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient, getServerJWTClaims } from '@/lib/supabase/server'

// ─── Types ────────────────────────────────────────────────────────

export interface StrategicGoal {
  id: string
  title: string
  description?: string | null
  horizon?: string | null  // e.g. "12 months", "3 years"
}

export interface FutureStateData {
  id: string | null
  vision: string | null
  strategic_goals: StrategicGoal[]
  ai_narrative: string | null
  updated_at: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────

async function resolveTenantId(tenantSlug: string): Promise<string | null> {
  const claims = await getServerJWTClaims()
  if (!claims) return null
  if (claims.tenant_id) return claims.tenant_id

  const supabase = await createClient()
  const { data } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
  return data?.id ?? null
}

// ─── Queries ──────────────────────────────────────────────────────

export async function getFutureState(tenantSlug: string): Promise<FutureStateData | null> {
  const claims = await getServerJWTClaims()
  if (!claims) return null

  const tenantId = await resolveTenantId(tenantSlug)
  if (!tenantId) return null

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('future_state')
    .select('id, vision, strategic_goals, ai_narrative, updated_at')
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (error) {
    console.error('[future-state/actions] getFutureState error:', error)
    return null
  }

  if (!data) {
    return { id: null, vision: null, strategic_goals: [], ai_narrative: null, updated_at: null }
  }

  return {
    id: data.id,
    vision: data.vision,
    strategic_goals: (data.strategic_goals as StrategicGoal[]) ?? [],
    ai_narrative: data.ai_narrative,
    updated_at: data.updated_at,
  }
}

// ─── Mutations ────────────────────────────────────────────────────

export async function saveFutureState(tenantSlug: string, formData: FormData) {
  const claims = await getServerJWTClaims()
  if (!claims) redirect(`/${tenantSlug}/login`)

  const tenantId = await resolveTenantId(tenantSlug)
  if (!tenantId) redirect(`/${tenantSlug}/dashboard`)

  const supabase = await createServiceClient()

  const vision = formData.get('vision') as string | null
  const aiNarrative = formData.get('ai_narrative') as string | null
  const goalsJson = formData.get('goals_json') as string | null

  let strategic_goals: StrategicGoal[] = []
  if (goalsJson) {
    try { strategic_goals = JSON.parse(goalsJson) } catch { /* ignore */ }
  }

  const record = {
    tenant_id: tenantId,
    vision: vision?.trim() || null,
    strategic_goals,
    ai_narrative: aiNarrative?.trim() || null,
    updated_by: claims.sub,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('future_state')
    .upsert(record, { onConflict: 'tenant_id' })

  if (error) {
    console.error('[future-state/actions] saveFutureState error:', error)
  }

  revalidatePath(`/${tenantSlug}/future-state`)
  redirect(`/${tenantSlug}/future-state`)
}
