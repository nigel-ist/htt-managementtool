'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient, getServerJWTClaims } from '@/lib/supabase/server'
import {
  HTT_CAPABILITIES,
  deriveStage,
  type CapabilityScores,
  type HttBaseline,
  type HttInteraction,
  type ResponseSignal,
} from './types'


async function getTenantId(tenantSlug: string): Promise<string | null> {
  const claims = await getServerJWTClaims()
  if (!claims) return null
  if (claims.tenant_id) return claims.tenant_id

  const supabase = await createClient()
  const { data } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
  return data?.id ?? null
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

export async function getRecentInteractions(
  tenantSlug: string,
  limit = 10
): Promise<HttInteraction[]> {
  const claims = await getServerJWTClaims()
  if (!claims) return []

  const supabase = await createClient()
  const tenantId = await getTenantId(tenantSlug)
  if (!tenantId) return []

  const { data } = await supabase
    .from('htt_interactions')
    .select('id, module_context, prompt_type, capability_focus, htt_stage, user_message, ai_response, response_signal, created_at')
    .eq('tenant_id', tenantId)
    .eq('user_id', claims.sub)
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []) as HttInteraction[]
}

export async function signalInteractionResponse(
  interactionId: string,
  signal: ResponseSignal
) {
  const claims = await getServerJWTClaims()
  if (!claims) throw new Error('Unauthorized')

  const service = createServiceClient()
  await service
    .from('htt_interactions')
    .update({ response_signal: signal })
    .eq('id', interactionId)
    .eq('user_id', claims.sub) // extra safety: only own rows
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
