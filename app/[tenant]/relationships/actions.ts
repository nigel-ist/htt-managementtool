'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import type { Relationship } from './types'

export async function getRelationships(tenantSlug: string): Promise<Relationship[]> {
  const supabase = await createClient()
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
  if (!tenant) return []
  const { data } = await supabase
    .from('relationships')
    .select('*')
    .eq('tenant_id', tenant.id)
    .order('name')
  return (data ?? []).map((r: Record<string, unknown>) => ({ ...r, tags: (r.tags as string[]) ?? [] })) as Relationship[]
}

export async function getRelationship(tenantSlug: string, id: string): Promise<Relationship | null> {
  const supabase = await createClient()
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
  if (!tenant) return null
  const { data } = await supabase.from('relationships').select('*').eq('id', id).eq('tenant_id', tenant.id).single()
  if (!data) return null
  return { ...data, tags: (data.tags as string[]) ?? [] } as Relationship
}

export async function createRelationship(tenantSlug: string, formData: FormData) {
  const supabase = await createClient()
  const service = createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
  if (!tenant) throw new Error('Tenant not found')
  const parseList = (v: FormDataEntryValue | null) => (v as string ?? '').split('\n').map((s: string) => s.trim()).filter(Boolean)
  await service.from('relationships').insert({
    tenant_id: tenant.id,
    name: formData.get('name') as string,
    organisation: formData.get('organisation') as string || null,
    category: formData.get('category') as string,
    contact_email: formData.get('contact_email') as string || null,
    contact_phone: formData.get('contact_phone') as string || null,
    notes: formData.get('notes') as string || null,
    tags: parseList(formData.get('tags')),
    created_by: user?.id ?? null,
  })
  revalidatePath(`/${tenantSlug}/relationships`)
}

export async function updateRelationship(tenantSlug: string, id: string, formData: FormData) {
  const service = createServiceClient()
  const supabase = await createClient()
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
  if (!tenant) throw new Error('Tenant not found')
  const parseList = (v: FormDataEntryValue | null) => (v as string ?? '').split('\n').map((s: string) => s.trim()).filter(Boolean)
  await service.from('relationships').update({
    name: formData.get('name') as string,
    organisation: formData.get('organisation') as string || null,
    category: formData.get('category') as string,
    contact_email: formData.get('contact_email') as string || null,
    contact_phone: formData.get('contact_phone') as string || null,
    notes: formData.get('notes') as string || null,
    tags: parseList(formData.get('tags')),
  }).eq('id', id).eq('tenant_id', tenant.id)
  revalidatePath(`/${tenantSlug}/relationships`)
}

export async function deleteRelationship(tenantSlug: string, id: string) {
  const service = createServiceClient()
  const supabase = await createClient()
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
  if (!tenant) throw new Error('Tenant not found')
  await service.from('relationships').delete().eq('id', id).eq('tenant_id', tenant.id)
  revalidatePath(`/${tenantSlug}/relationships`)
}
