'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, getServerJWTClaims } from '@/lib/supabase/server'

export const HTT_CAPABILITIES = [
  'critical_thinking',
  'mental_models',
  'perspective_taking',
  'adaptability',
  'independence',
  'creativity',
] as const

export type HttCapability = typeof HTT_CAPABILITIES[number]

export interface CapabilityScores {
  critical_thinking: number
  mental_models: number
  perspective_taking: number
  adaptability: number
  independence: number
  creativity: number
}

export interface HttBaseline {
  id: string
  stage: number
  scores: CapabilityScores
  source: string
  assessed_at: string
}

async function getTenantId(tenantSlug: string): Promise<string | null> {
  const claims = await getServerJWTClaims()
  if (!claims) return null
  if (claims.tenant_id) return claims.tenant_id

  const supabase = await createClient()
  const { data } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
  return data?.id ?? null
}

/**
 * Derive an overall HTT stage (1–5) from the mean of capability scores.
 *
 * Mean 1.0–1.6 → Stage 1 (Acquisition)
 * Mean 1.7–2.4 → Stage 2 (Fluency)
 * Mean 2.5–3.2 → Stage 3 (Maintenance)
 * Mean 3.3–4.0 → Stage 4 (Generalisation)
 * Mean 4.1–5.0 → Stage 5 (Adaptive)
 */
export function deriveStage(scores: CapabilityScores): number {
  const values = Object.values(scores)
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  if (mean <= 1.6) return 1
  if (mean <= 2.4) return 2
  if (mean <= 3.2) return 3
  if (mean <= 4.0) return 4
  return 5
}

export async function getLatestBaseline(
  tenantSlug: string
): Promise<HttBaseline | null> {
  const claims = await getServerJWTClaims()
  if (!claims) return null

  const supabase = await createClient()
  const tenantId = await getTenantId(tenantSlug)
  if (!tenantId) return null

  const { data, error } = await supabase
    .from('htt_baselines')
    .select('id, stage, scores, source, assessed_at')
    .eq('tenant_id', tenantId)
    .eq('user_id', claims.sub)
    .order('assessed_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return null
  return data as HttBaseline
}

export async function getAllBaselines(
  tenantSlug: string
): Promise<HttBaseline[]> {
  const claims = await getServerJWTClaims()
  if (!claims) return []

  const supabase = await createClient()
  const tenantId = await getTenantId(tenantSlug)
  if (!tenantId) return []

  const { data } = await supabase
    .from('htt_baselines')
    .select('id, stage, scores, source, assessed_at')
    .eq('tenant_id', tenantId)
    .eq('user_id', claims.sub)
    .order('assessed_at', { ascending: true })

  return (data ?? []) as HttBaseline[]
}

export async function createBaseline(tenantSlug: string, formData: FormData) {
  const claims = await getServerJWTClaims()
  if (!claims) throw new Error('Unauthorized')

  const tenantId = await getTenantId(tenantSlug)
  if (!tenantId) throw new Error('Tenant not found')

  const scores: CapabilityScores = {
    critical_thinking:  Number(formData.get('critical_thinking'))  || 1,
    mental_models:      Number(formData.get('mental_models'))      || 1,
    perspective_taking: Number(formData.get('perspective_taking')) || 1,
    adaptability:       Number(formData.get('adaptability'))       || 1,
    independence:       Number(formData.get('independence'))        || 1,
    creativity:         Number(formData.get('creativity'))         || 1,
  }

  // Clamp all values 1–5
  for (const key of HTT_CAPABILITIES) {
    scores[key] = Math.max(1, Math.min(5, Math.round(scores[key])))
  }

  const stage = deriveStage(scores)
  const supabase = await createClient()

  // Get the previous baseline to compute deltas
  const { data: prevBaseline } = await supabase
    .from('htt_baselines')
    .select('id, scores')
    .eq('tenant_id', tenantId)
    .eq('user_id', claims.sub)
    .order('assessed_at', { ascending: false })
    .limit(1)
    .single()

  // Insert the new baseline
  const { data: newBaseline, error: baselineError } = await supabase
    .from('htt_baselines')
    .insert({
      tenant_id: tenantId,
      user_id: claims.sub,
      stage,
      scores,
      source: 'diagnostic',
      assessed_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (baselineError || !newBaseline) throw new Error(baselineError?.message ?? 'Failed to create baseline')

  // Insert capability scores (one row per capability)
  const prevScores = (prevBaseline?.scores as CapabilityScores | null) ?? null
  const capabilityRows = HTT_CAPABILITIES.map(cap => ({
    baseline_id: newBaseline.id,
    capability: cap,
    score: scores[cap],
    delta: prevScores ? scores[cap] - prevScores[cap] : null,
    evidence: [],
  }))

  await supabase.from('htt_capability_scores').insert(capabilityRows)

  revalidatePath(`/${tenantSlug}/htt`)
  redirect(`/${tenantSlug}/htt`)
}
