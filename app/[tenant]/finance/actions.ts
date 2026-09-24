'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { FinanceEntry } from './types'

export async function getFinanceEntries(tenantSlug: string): Promise<FinanceEntry[]> {
  const supabase = await createClient()
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
  if (!tenant) return []
  const { data } = await supabase
    .from('finance_entries')
    .select('*')
    .eq('tenant_id', tenant.id)
    .order('entry_date', { ascending: false })
  return (data ?? []).map((r: Record<string, unknown>) => ({
    ...r,
    tags: (r.tags as string[]) ?? [],
  })) as FinanceEntry[]
}

export async function getFinanceEntry(tenantSlug: string, id: string): Promise<FinanceEntry | null> {
  const supabase = await createClient()
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
  if (!tenant) return null
  const { data } = await supabase.from('finance_entries').select('*').eq('id', id).eq('tenant_id', tenant.id).single()
  if (!data) return null
  return { ...data, tags: (data.tags as string[]) ?? [] } as FinanceEntry
}

export async function createFinanceEntry(tenantSlug: string, formData: FormData) {
  const supabase = await createClient()
  const service = createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
  if (!tenant) throw new Error('Tenant not found')
  const parseList = (val: string | null) => (val ?? '').split('\n').map(s => s.trim()).filter(Boolean)
  await service.from('finance_entries').insert({
    tenant_id: tenant.id,
    title: formData.get('title') as string,
    category: formData.get('category') as string,
    period: formData.get('period') as string,
    amount: parseFloat(formData.get('amount') as string),
    currency: formData.get('currency') as string || 'USD',
    entry_date: formData.get('entry_date') as string,
    description: formData.get('description') as string || null,
    tags: parseList(formData.get('tags') as string),
    created_by: user?.id ?? null,
  })
  revalidatePath(`/${tenantSlug}/finance`)
}

export async function updateFinanceEntry(tenantSlug: string, id: string, formData: FormData) {
  const service = createServiceClient()
  const supabase = await createClient()
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
  if (!tenant) throw new Error('Tenant not found')
  const parseList = (val: string | null) => (val ?? '').split('\n').map(s => s.trim()).filter(Boolean)
  await service.from('finance_entries').update({
    title: formData.get('title') as string,
    category: formData.get('category') as string,
    period: formData.get('period') as string,
    amount: parseFloat(formData.get('amount') as string),
    currency: formData.get('currency') as string || 'USD',
    entry_date: formData.get('entry_date') as string,
    description: formData.get('description') as string || null,
    tags: parseList(formData.get('tags') as string),
  }).eq('id', id).eq('tenant_id', tenant.id)
  revalidatePath(`/${tenantSlug}/finance`)
}

export async function deleteFinanceEntry(tenantSlug: string, id: string) {
  const service = createServiceClient()
  const supabase = await createClient()
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
  if (!tenant) throw new Error('Tenant not found')
  await service.from('finance_entries').delete().eq('id', id).eq('tenant_id', tenant.id)
  revalidatePath(`/${tenantSlug}/finance`)
}
