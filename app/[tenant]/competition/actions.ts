'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import type { Competitor } from './types'

export async function getCompetitors(tenantSlug: string): Promise<Competitor[]> {
  const supabase = await createClient()
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
  if (!tenant) return []
  const { data } = await supabase
    .from('competitors')
    .select('*')
    .eq('tenant_id', tenant.id)
    .order('name')
  return (data ?? []).map((r: Record<string, unknown>) => ({
    ...r,
    strengths: (r.strengths as string[]) ?? [],
    weaknesses: (r.weaknesses as string[]) ?? [],
    tags: (r.tags as string[]) ?? [],
  })) as Competitor[]
}

export async function getCompetitor(tenantSlug: string, id: string): Promise<Competitor | null> {
  const supabase = await createClient()
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
  if (!tenant) return null
  const { data } = await supabase
    .from('competitors')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenant.id)
    .single()
  if (!data) return null
  return {
    ...data,
    strengths: (data.strengths as string[]) ?? [],
    weaknesses: (data.weaknesses as string[]) ?? [],
    tags: (data.tags as string[]) ?? [],
  } as Competitor
}

export async function createCompetitor(tenantSlug: string, formData: FormData) {
  const supabase = await createClient()
  const service = createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
  if (!tenant) throw new Error('Tenant not found')

  const parseList = (val: string | null) => (val ?? '').split('\n').map(s => s.trim()).filter(Boolean)

  await service.from('competitors').insert({
    tenant_id: tenant.id,
    name: formData.get('name') as string,
    website: formData.get('website') as string || null,
    tier: formData.get('tier') as string,
    summary: formData.get('summary') as string || null,
    strengths: parseList(formData.get('strengths') as string),
    weaknesses: parseList(formData.get('weaknesses') as string),
    notes: formData.get('notes') as string || null,
    tags: parseList(formData.get('tags') as string),
    created_by: user?.id ?? null,
  })
  revalidatePath(`/${tenantSlug}/competition`)
}

export async function updateCompetitor(tenantSlug: string, id: string, formData: FormData) {
  const service = createServiceClient()
  const supabase = await createClient()
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
  if (!tenant) throw new Error('Tenant not found')

  const parseList = (val: string | null) => (val ?? '').split('\n').map(s => s.trim()).filter(Boolean)

  await service.from('competitors').update({
    name: formData.get('name') as string,
    website: formData.get('website') as string || null,
    tier: formData.get('tier') as string,
    summary: formData.get('summary') as string || null,
    strengths: parseList(formData.get('strengths') as string),
    weaknesses: parseList(formData.get('weaknesses') as string),
    notes: formData.get('notes') as string || null,
    tags: parseList(formData.get('tags') as string),
  }).eq('id', id).eq('tenant_id', tenant.id)
  revalidatePath(`/${tenantSlug}/competition`)
}

export async function deleteCompetitor(tenantSlug: string, id: string) {
  const service = createServiceClient()
  const supabase = await createClient()
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
  if (!tenant) throw new Error('Tenant not found')
  await service.from('competitors').delete().eq('id', id).eq('tenant_id', tenant.id)
  revalidatePath(`/${tenantSlug}/competition`)
}
