'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CompensationBand } from './types'

export async function getCompensationBands(tenantSlug: string): Promise<CompensationBand[]> {
  const supabase = await createClient()
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
  if (!tenant) return []
  const { data } = await supabase
    .from('compensation_bands')
    .select('*')
    .eq('tenant_id', tenant.id)
    .order('role_title')
  return (data ?? []) as CompensationBand[]
}

export async function getCompensationBand(tenantSlug: string, id: string): Promise<CompensationBand | null> {
  const supabase = await createClient()
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
  if (!tenant) return null
  const { data } = await supabase.from('compensation_bands').select('*').eq('id', id).eq('tenant_id', tenant.id).single()
  return data as CompensationBand | null
}

export async function createCompensationBand(tenantSlug: string, formData: FormData) {
  const supabase = await createClient()
  const service = createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
  if (!tenant) throw new Error('Tenant not found')
  await service.from('compensation_bands').insert({
    tenant_id: tenant.id,
    role_title: formData.get('role_title') as string,
    level: formData.get('level') as string || null,
    department: formData.get('department') as string || null,
    employment_type: formData.get('employment_type') as string,
    min_salary: parseFloat(formData.get('min_salary') as string),
    max_salary: parseFloat(formData.get('max_salary') as string),
    currency: formData.get('currency') as string || 'USD',
    location: formData.get('location') as string || null,
    notes: formData.get('notes') as string || null,
    effective_date: formData.get('effective_date') as string,
    created_by: user?.id ?? null,
  })
  revalidatePath(`/${tenantSlug}/compensation`)
}

export async function updateCompensationBand(tenantSlug: string, id: string, formData: FormData) {
  const service = createServiceClient()
  const supabase = await createClient()
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
  if (!tenant) throw new Error('Tenant not found')
  await service.from('compensation_bands').update({
    role_title: formData.get('role_title') as string,
    level: formData.get('level') as string || null,
    department: formData.get('department') as string || null,
    employment_type: formData.get('employment_type') as string,
    min_salary: parseFloat(formData.get('min_salary') as string),
    max_salary: parseFloat(formData.get('max_salary') as string),
    currency: formData.get('currency') as string || 'USD',
    location: formData.get('location') as string || null,
    notes: formData.get('notes') as string || null,
    effective_date: formData.get('effective_date') as string,
  }).eq('id', id).eq('tenant_id', tenant.id)
  revalidatePath(`/${tenantSlug}/compensation`)
}

export async function deleteCompensationBand(tenantSlug: string, id: string) {
  const service = createServiceClient()
  const supabase = await createClient()
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
  if (!tenant) throw new Error('Tenant not found')
  await service.from('compensation_bands').delete().eq('id', id).eq('tenant_id', tenant.id)
  revalidatePath(`/${tenantSlug}/compensation`)
}
