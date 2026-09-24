'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Survey, SurveyQuestion, SurveyResponse } from './types'
import { randomUUID } from 'crypto'

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getTenantId(tenantSlug: string): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
  return data?.id ?? null
}

// ── Reads ─────────────────────────────────────────────────────────────────────

export async function getSurveys(tenantSlug: string): Promise<Survey[]> {
  const supabase = await createClient()
  const tenantId = await getTenantId(tenantSlug)
  if (!tenantId) return []
  const { data } = await supabase
    .from('surveys')
    .select('*, survey_responses(count)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
  return (data ?? []).map((r: Record<string, unknown>) => ({
    ...r,
    questions: Array.isArray(r.questions) ? r.questions : [],
    response_count: (r.survey_responses as { count: number }[])?.[0]?.count ?? 0,
  })) as Survey[]
}

export async function getSurvey(tenantSlug: string, id: string): Promise<Survey | null> {
  const supabase = await createClient()
  const tenantId = await getTenantId(tenantSlug)
  if (!tenantId) return null
  const { data } = await supabase
    .from('surveys')
    .select('*, survey_responses(count)')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()
  if (!data) return null
  return {
    ...data,
    questions: Array.isArray(data.questions) ? data.questions : [],
    response_count: (data.survey_responses as { count: number }[])?.[0]?.count ?? 0,
  } as Survey
}

export async function getSurveyByToken(token: string): Promise<Survey | null> {
  const service = createServiceClient()
  const { data } = await service
    .from('surveys')
    .select('*')
    .eq('share_token', token)
    .single()
  if (!data) return null
  return {
    ...data,
    questions: Array.isArray(data.questions) ? data.questions : [],
  } as Survey
}

export async function getSurveyResponses(tenantSlug: string, surveyId: string): Promise<SurveyResponse[]> {
  const supabase = await createClient()
  const tenantId = await getTenantId(tenantSlug)
  if (!tenantId) return []
  const { data } = await supabase
    .from('survey_responses')
    .select('id, survey_id, respondent_name, respondent_email, data, created_at')
    .eq('survey_id', surveyId)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
  return (data ?? []) as SurveyResponse[]
}

// ── Mutations ─────────────────────────────────────────────────────────────────

function parseQuestions(formData: FormData): SurveyQuestion[] {
  const questions: SurveyQuestion[] = []
  let i = 0
  while (formData.has(`question_text_${i}`)) {
    const text = (formData.get(`question_text_${i}`) as string).trim()
    const type = (formData.get(`question_type_${i}`) as string) || 'text'
    if (text) {
      questions.push({ id: randomUUID(), text, type: type as SurveyQuestion['type'] })
    }
    i++
  }
  return questions
}

export async function createSurvey(tenantSlug: string, formData: FormData) {
  const service = createServiceClient()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const tenantId = await getTenantId(tenantSlug)
  if (!tenantId) throw new Error('Tenant not found')

  const questions = parseQuestions(formData)

  await service.from('surveys').insert({
    tenant_id: tenantId,
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || null,
    status: (formData.get('status') as string) || 'draft',
    questions,
    created_by: user?.id ?? null,
  })

  revalidatePath(`/${tenantSlug}/surveys`)
}

export async function updateSurvey(tenantSlug: string, id: string, formData: FormData) {
  const service = createServiceClient()
  const tenantId = await getTenantId(tenantSlug)
  if (!tenantId) throw new Error('Tenant not found')

  const questions = parseQuestions(formData)

  await service.from('surveys').update({
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || null,
    status: formData.get('status') as string,
    questions,
  }).eq('id', id).eq('tenant_id', tenantId)

  revalidatePath(`/${tenantSlug}/surveys`)
}

export async function deleteSurvey(tenantSlug: string, id: string) {
  const service = createServiceClient()
  const tenantId = await getTenantId(tenantSlug)
  if (!tenantId) throw new Error('Tenant not found')
  await service.from('surveys').delete().eq('id', id).eq('tenant_id', tenantId)
  revalidatePath(`/${tenantSlug}/surveys`)
}
