'use server'

/**
 * Current State module — server actions.
 *
 * DB table: current_state_scores
 * ─────────────────────────────────────────────────────────────────
 * CREATE TABLE current_state_scores (
 *   id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
 *   tenant_id   uuid        NOT NULL REFERENCES tenants(id),
 *   category    text        NOT NULL,  -- strategic | operational | financial
 *   dimension   text        NOT NULL,
 *   score       int2        NOT NULL CHECK (score BETWEEN 1 AND 5),
 *   notes       text,
 *   updated_by  uuid        REFERENCES auth.users(id),
 *   updated_at  timestamptz NOT NULL DEFAULT now(),
 *   UNIQUE (tenant_id, category, dimension)
 * );
 *
 * ALTER TABLE current_state_scores ENABLE ROW LEVEL SECURITY;
 *
 * CREATE POLICY "tenant_isolation" ON current_state_scores
 *   USING (
 *     tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
 *     OR (auth.jwt() ->> 'is_il_admin') = 'true'
 *   );
 */

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient, getServerJWTClaims } from '@/lib/supabase/server'
import {
  CATEGORIES,
  type DimensionScore,
  type CurrentStateData,
} from './types'

export type { DimensionScore, CurrentStateData }
export { CATEGORIES }

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

export async function getCurrentState(tenantSlug: string): Promise<CurrentStateData | null> {
  const claims = await getServerJWTClaims()
  if (!claims) return null

  const tenantId = await resolveTenantId(tenantSlug)
  if (!tenantId) return null

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('current_state_scores')
    .select('category, dimension, score, notes, updated_at')
    .eq('tenant_id', tenantId)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('[current-state/actions] getCurrentState error:', error)
    return null
  }

  const latestUpdate =
    data && data.length > 0
      ? data.reduce((latest, row) =>
          row.updated_at > latest ? row.updated_at : latest, data[0].updated_at
        )
      : null

  return {
    scores: (data ?? []).map((row) => ({
      category: row.category,
      dimension: row.dimension,
      score: row.score,
      notes: row.notes,
    })),
    updatedAt: latestUpdate,
  }
}

// ─── Mutations ────────────────────────────────────────────────────

export async function saveCurrentState(tenantSlug: string, formData: FormData) {
  const claims = await getServerJWTClaims()
  if (!claims) redirect(`/${tenantSlug}/login`)

  const tenantId = await resolveTenantId(tenantSlug)
  if (!tenantId) redirect(`/${tenantSlug}/dashboard`)

  const supabase = await createServiceClient()

  // Parse all dimension scores from formData
  // Keys: score_{category}_{dimension}, notes_{category}_{dimension}
  const upserts: {
    tenant_id: string
    category: string
    dimension: string
    score: number
    notes: string | null
    updated_by: string
    updated_at: string
  }[] = []

  for (const cat of CATEGORIES) {
    for (const dim of cat.dimensions) {
      const scoreRaw = formData.get(`score_${cat.key}_${dim}`)
      if (!scoreRaw) continue

      const score = parseInt(String(scoreRaw), 10)
      if (isNaN(score) || score < 1 || score > 5) continue

      const notes = formData.get(`notes_${cat.key}_${dim}`)

      upserts.push({
        tenant_id: tenantId,
        category: cat.key,
        dimension: dim,
        score,
        notes: notes ? String(notes).trim() || null : null,
        updated_by: claims.sub,
        updated_at: new Date().toISOString(),
      })
    }
  }

  if (upserts.length === 0) redirect(`/${tenantSlug}/current-state`)

  const { error } = await supabase
    .from('current_state_scores')
    .upsert(upserts, { onConflict: 'tenant_id,category,dimension' })

  if (error) {
    console.error('[current-state/actions] saveCurrentState error:', error)
    redirect(`/${tenantSlug}/current-state`)
  }

  revalidatePath(`/${tenantSlug}/current-state`)
  redirect(`/${tenantSlug}/current-state`)
}
