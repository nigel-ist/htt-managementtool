'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import type { Download } from './types'

export async function getDownloads(tenantSlug: string): Promise<Download[]> {
  const supabase = await createClient()
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
  if (!tenant) return []
  const { data } = await supabase
    .from('downloads')
    .select('*')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false })
  return (data ?? []).map((r: Record<string, unknown>) => ({ ...r, tags: (r.tags as string[]) ?? [] })) as Download[]
}

export async function getDownload(tenantSlug: string, id: string): Promise<Download | null> {
  const supabase = await createClient()
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
  if (!tenant) return null
  const { data } = await supabase.from('downloads').select('*').eq('id', id).eq('tenant_id', tenant.id).single()
  if (!data) return null
  return { ...data, tags: (data.tags as string[]) ?? [] } as Download
}

export async function createDownload(tenantSlug: string, formData: FormData) {
  const supabase = await createClient()
  const service = createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
  if (!tenant) throw new Error('Tenant not found')
  const parseList = (v: FormDataEntryValue | null) => (v as string ?? '').split('\n').map((s: string) => s.trim()).filter(Boolean)
  await service.from('downloads').insert({
    tenant_id: tenant.id,
    title: formData.get('title') as string,
    description: formData.get('description') as string || null,
    category: formData.get('category') as string,
    file_url: formData.get('file_url') as string,
    file_name: formData.get('file_name') as string,
    tags: parseList(formData.get('tags')),
    created_by: user?.id ?? null,
  })
  revalidatePath(`/${tenantSlug}/downloads`)
}

export async function updateDownload(tenantSlug: string, id: string, formData: FormData) {
  const service = createServiceClient()
  const supabase = await createClient()
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
  if (!tenant) throw new Error('Tenant not found')
  const parseList = (v: FormDataEntryValue | null) => (v as string ?? '').split('\n').map((s: string) => s.trim()).filter(Boolean)
  await service.from('downloads').update({
    title: formData.get('title') as string,
    description: formData.get('description') as string || null,
    category: formData.get('category') as string,
    file_url: formData.get('file_url') as string,
    file_name: formData.get('file_name') as string,
    tags: parseList(formData.get('tags')),
  }).eq('id', id).eq('tenant_id', tenant.id)
  revalidatePath(`/${tenantSlug}/downloads`)
}

export async function deleteDownload(tenantSlug: string, id: string) {
  const service = createServiceClient()
  const supabase = await createClient()
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
  if (!tenant) throw new Error('Tenant not found')
  await service.from('downloads').delete().eq('id', id).eq('tenant_id', tenant.id)
  revalidatePath(`/${tenantSlug}/downloads`)
}
