'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient, getServerJWTClaims } from '@/lib/supabase/server'
import type { MarketIntelEntry, IntelCategory } from './types'

async function resolveTenantId(slug: string): Promise<string | null> {
  const claims = await getServerJWTClaims()
  if (!claims) return null
  if (claims.tenant_id) return claims.tenant_id
  const supabase = await createClient()
  const { data } = await supabase.from('tenants').select('id').eq('slug', slug).single()
  return data?.id ?? null
}

function mapRow(r: Record<string, unknown>): MarketIntelEntry {
  return { ...r as unknown as MarketIntelEntry, tags: (r.tags as string[]) ?? [] }
}

export async function getIntelEntries(tenantSlug: string): Promise<MarketIntelEntry[]> {
  const claims = await getServerJWTClaims()
  if (!claims) return []
  const tenantId = await resolveTenantId(tenantSlug)
  if (!tenantId) return []
  const supabase = await createClient()
  const { data } = await supabase.from('market_intel').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false })
  return (data ?? []).map(mapRow)
}

export async function getIntelEntry(tenantSlug: string, id: string): Promise<MarketIntelEntry | null> {
  const claims = await getServerJWTClaims()
  if (!claims) return null
  const tenantId = await resolveTenantId(tenantSlug)
  if (!tenantId) return null
  const supabase = await createClient()
  const { data } = await supabase.from('market_intel').select('*').eq('tenant_id', tenantId).eq('id', id).single()
  if (!data) return null
  return mapRow(data)
}

export async function createIntelEntry(tenantSlug: string, formData: FormData) {
  const claims = await getServerJWTClaims()
  if (!claims) redirect('/login')
  const tenantId = await resolveTenantId(tenantSlug)
  if (!tenantId) redirect(`/${tenantSlug}/dashboard`)
  const title = (formData.get('title') as string)?.trim()
  if (!title) redirect(`/${tenantSlug}/market-intel/new`)
  const tags = ((formData.get('tags') as string) ?? '').split(',').map(t => t.trim()).filter(Boolean)
  const supabase = await createServiceClient()
  const { data } = await supabase.from('market_intel').insert({
    tenant_id: tenantId, title,
    category: (formData.get('category') as IntelCategory) || 'other',
    source: (formData.get('source') as string)?.trim() || null,
    source_date: (formData.get('source_date') as string) || null,
    body: (formData.get('body') as string)?.trim() || null,
    tags, created_by: claims.sub,
  }).select('id').single()
  revalidatePath(`/${tenantSlug}/market-intel`)
  redirect(`/${tenantSlug}/market-intel/${data?.id ?? ''}`)
}

export async function updateIntelEntry(tenantSlug: string, id: string, formData: FormData) {
  const claims = await getServerJWTClaims()
  if (!claims) redirect('/login')
  const tenantId = await resolveTenantId(tenantSlug)
  if (!tenantId) redirect(`/${tenantSlug}/dashboard`)
  const title = (formData.get('title') as string)?.trim()
  if (!title) redirect(`/${tenantSlug}/market-intel/${id}`)
  const tags = ((formData.get('tags') as string) ?? '').split(',').map(t => t.trim()).filter(Boolean)
  const supabase = await createServiceClient()
  await supabase.from('market_intel').update({
    title, category: formData.get('category') as IntelCategory,
    source: (formData.get('source') as string)?.trim() || null,
    source_date: (formData.get('source_date') as string) || null,
    body: (formData.get('body') as string)?.trim() || null,
    tags, updated_at: new Date().toISOString(),
  }).eq('id', id).eq('tenant_id', tenantId)
  revalidatePath(`/${tenantSlug}/market-intel`)
  redirect(`/${tenantSlug}/market-intel/${id}`)
}

export async function deleteIntelEntry(tenantSlug: string, id: string) {
  const claims = await getServerJWTClaims()
  if (!claims) redirect('/login')
  const tenantId = await resolveTenantId(tenantSlug)
  if (!tenantId) redirect(`/${tenantSlug}/dashboard`)
  const supabase = await createServiceClient()
  await supabase.from('market_intel').delete().eq('id', id).eq('tenant_id', tenantId)
  revalidatePath(`/${tenantSlug}/market-intel`)
  redirect(`/${tenantSlug}/market-intel`)
}
