'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import type { Survey } from './types'

export async function getSurveys(tenantSlug: string): Promise<Survey[]> {
  const supabase = await createClient()
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
  if (!tenant) return []
  const { data } = await supabase
    .from('surveys')
    .select('*, survey_responses(count)')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false })
  return (data ?? []).map((r: Record<string, unknown>) => ({
    ...r,
    response_count: (r.survey_responses as { count: number }[])?.[0]?.count ?? 0,
  })) as Survey[]
}

export async function getSurvey(tenantSlug: string, id: string): Promise<Survey | null> {
  const supabase = await createClient()
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
  if (!tenant) return null
  const { data } = await supabase.from('surveys').select('*').eq('id', id).eq('tenant_id', tenant.id).single()
  return data as Survey | null
}

export async function createSurvey(tenantSlug: string, formData: FormData) {
  const supabase = await createClient()
  const service = createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
  if (!tenant) throw new Error('Tenant not found')
  const { data: survey } = await service.from('surveys').insert({
    tenant_id: tenant.id,
    title: formData.get('title') as string,
    description: formData.get('description') as string || null,
    status: formData.get('status') as string || 'draft',
    created_by: user?.id ?? null,
  }).select('id').single()

  // Insert questions
  const questions: string[] = []
  formData.forEach((val, key) => { if (key.startsWith('question_')) questions.push(val as string) })
  if (questions.length > 0 && survey?.id) {
    await service.from('survey_questions').insert(
      questions.filter(Boolean).map((q, i) => ({
        survey_id: survey.id,
        question_text: q,
        order_index: i,
      }))
    )
  }
  revalidatePath(`/${tenantSlug}/surveys`)
}

export async function updateSurvey(tenantSlug: string, id: string, formData: FormData) {
  const service = createServiceClient()
  const supabase = await createClient()
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
  if (!tenant) throw new Error('Tenant not found')
  await service.from('surveys').update({
    title: formData.get('title') as string,
    description: formData.get('description') as string || null,
    status: formData.get('status') as string,
  }).eq('id', id).eq('tenant_id', tenant.id)
  revalidatePath(`/${tenantSlug}/surveys`)
}

export async function deleteSurvey(tenantSlug: string, id: string) {
  const service = createServiceClient()
  const supabase = await createClient()
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
  if (!tenant) throw new Error('Tenant not found')
  await service.from('surveys').delete().eq('id', id).eq('tenant_id', tenant.id)
  revalidatePath(`/${tenantSlug}/surveys`)
}
