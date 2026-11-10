'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServiceClient, getServerJWTClaims } from '@/lib/supabase/server'
import type { SurveyStatus } from '@/app/[tenant]/surveys/types'
import { seedThinkSurvey } from '@/lib/surveys/seeds/seed-think-survey'
import { seedFeelSurvey } from '@/lib/surveys/seeds/seed-feel-survey'

// ── Auth helper ────────────────────────────────────────────────────────────

async function getTenantId(tenantSlug: string): Promise<string | null> {
  const claims = await getServerJWTClaims()
  if (!claims) return null
  if (claims.tenant_id) return claims.tenant_id

  const supabase = createServiceClient()
  const { data } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', tenantSlug)
    .single()
  return data?.id ?? null
}

// ── Survey CRUD ─────────────────────────────────────────────────────────────

export async function createSurvey(tenantSlug: string, formData: FormData) {
  const tenantId = await getTenantId(tenantSlug)
  if (!tenantId) throw new Error('Unauthorized')

  const title = (formData.get('title') as string | null)?.trim()
  const description = (formData.get('description') as string | null)?.trim() || null

  if (!title) throw new Error('Title is required')

  const { randomUUID } = await import('crypto')
  const supabase = createServiceClient()
  const { error } = await supabase.from('surveys').insert({
    tenant_id: tenantId,
    title,
    description,
    status: 'draft',
    survey_type: 'standard',
    questions: [],
    share_token: randomUUID(),
  })

  if (error) throw new Error(error.message)
  revalidatePath(`/${tenantSlug}/surveys`)
  redirect(`/${tenantSlug}/surveys`)
}

export async function updateSurveyStatus(
  tenantSlug: string,
  surveyId: string,
  status: SurveyStatus
) {
  const tenantId = await getTenantId(tenantSlug)
  if (!tenantId) throw new Error('Unauthorized')

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('surveys')
    .update({ status })
    .eq('id', surveyId)
    .eq('tenant_id', tenantId)

  if (error) throw new Error(error.message)
  revalidatePath(`/${tenantSlug}/surveys`)
  revalidatePath(`/${tenantSlug}/surveys/${surveyId}`)
}

export async function deleteSurvey(tenantSlug: string, surveyId: string) {
  const tenantId = await getTenantId(tenantSlug)
  if (!tenantId) throw new Error('Unauthorized')

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('surveys')
    .delete()
    .eq('id', surveyId)
    .eq('tenant_id', tenantId)

  if (error) throw new Error(error.message)
  revalidatePath(`/${tenantSlug}/surveys`)
  redirect(`/${tenantSlug}/surveys`)
}

// ── Seed standard assessments ───────────────────────────────────────────────

export async function seedStandardSurveys(
  tenantSlug: string
): Promise<{ seeded: string[]; skipped: string[]; error?: string }> {
  const claims = await getServerJWTClaims()
  if (!claims) return { seeded: [], skipped: [], error: 'Unauthorized' }

  // Check what's already seeded to avoid duplicates
  const service = createServiceClient()
  const { data: tenant } = await service
    .from('tenants')
    .select('id')
    .eq('slug', tenantSlug)
    .single()
  if (!tenant) return { seeded: [], skipped: [], error: 'Tenant not found' }

  const { data: existing } = await service
    .from('surveys')
    .select('title')
    .eq('tenant_id', tenant.id)

  const existingTitles = new Set((existing ?? []).map((s: { title: string }) => s.title))

  const seeded: string[] = []
  const skipped: string[] = []

  // Think Survey
  const thinkTitle = 'Think Survey — Reasoning Fluidity Assessment'
  if (existingTitles.has(thinkTitle)) {
    skipped.push('Think Survey')
  } else {
    const result = await seedThinkSurvey(tenantSlug)
    if (result) seeded.push('Think Survey')
    else return { seeded, skipped, error: 'Failed to seed Think Survey' }
  }

  // Feel Survey
  const feelTitle = 'Feel Survey — Personality & Work Values Assessment'
  if (existingTitles.has(feelTitle)) {
    skipped.push('Feel Survey')
  } else {
    const result = await seedFeelSurvey(tenantSlug)
    if (result) seeded.push('Feel Survey')
    else return { seeded, skipped, error: 'Failed to seed Feel Survey' }
  }

  revalidatePath(`/${tenantSlug}/surveys`)
  return { seeded, skipped }
}

// ── Response import (CSV) ───────────────────────────────────────────────────

export async function importSurveyResponses(
  tenantSlug: string,
  surveyId: string,
  rows: Array<{ name?: string; email?: string; data: Record<string, string> }>
): Promise<{ inserted: number; error?: string }> {
  const tenantId = await getTenantId(tenantSlug)
  if (!tenantId) return { inserted: 0, error: 'Unauthorized' }

  // Verify survey belongs to this tenant
  const supabase = createServiceClient()
  const { data: survey } = await supabase
    .from('surveys')
    .select('id')
    .eq('id', surveyId)
    .eq('tenant_id', tenantId)
    .single()
  if (!survey) return { inserted: 0, error: 'Survey not found' }

  const records = rows.map(r => ({
    survey_id: surveyId,
    respondent_name: r.name ?? null,
    respondent_email: r.email ?? null,
    data: r.data,
  }))

  const service = createServiceClient()
  const { data, error } = await service
    .from('survey_responses')
    .insert(records)
    .select('id')

  if (error) return { inserted: 0, error: error.message }
  revalidatePath(`/${tenantSlug}/surveys/${surveyId}`)
  return { inserted: data?.length ?? 0 }
}

// ── Public survey lookup (no auth — share link) ─────────────────────────────

export async function getSurveyByToken(token: string) {
  if (!token) return null
  const service = createServiceClient()
  const { data, error } = await service
    .from('surveys')
    .select('id, title, description, status, questions, scoring_config, survey_type, share_token, created_by, created_at, updated_at')
    .eq('share_token', token)
    .single()

  if (error || !data) return null
  return data
}
