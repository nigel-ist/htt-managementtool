'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient, getServerJWTClaims } from '@/lib/supabase/server'
import type { Idea, IdeaStatus } from './types'

async function resolveTenantId(slug: string): Promise<string | null> {
  const claims = await getServerJWTClaims()
  if (!claims) return null
  if (claims.tenant_id) return claims.tenant_id
  const supabase = await createClient()
  const { data } = await supabase.from('tenants').select('id').eq('slug', slug).single()
  return data?.id ?? null
}

export async function getIdeas(tenantSlug: string): Promise<Idea[]> {
  const claims = await getServerJWTClaims()
  if (!claims) return []
  const tenantId = await resolveTenantId(tenantSlug)
  if (!tenantId) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('ideas')
    .select('id, title, description, status, tags, submitted_by, created_at, updated_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  return (data ?? []).map(r => ({ ...r, tags: (r.tags as string[]) ?? [] }))
}

export async function getIdea(tenantSlug: string, ideaId: string): Promise<Idea | null> {
  const claims = await getServerJWTClaims()
  if (!claims) return null
  const tenantId = await resolveTenantId(tenantSlug)
  if (!tenantId) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('ideas')
    .select('id, title, description, status, tags, submitted_by, created_at, updated_at')
    .eq('tenant_id', tenantId)
    .eq('id', ideaId)
    .single()

  if (!data) return null
  return { ...data, tags: (data.tags as string[]) ?? [] }
}

export async function createIdea(tenantSlug: string, formData: FormData) {
  const claims = await getServerJWTClaims()
  if (!claims) redirect(`/${tenantSlug}/login`)
  const tenantId = await resolveTenantId(tenantSlug)
  if (!tenantId) redirect(`/${tenantSlug}/dashboard`)

  const title = (formData.get('title') as string)?.trim()
  if (!title) redirect(`/${tenantSlug}/ideas/new`)

  const tagsRaw = (formData.get('tags') as string)?.trim()
  const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : []

  const supabase = await createServiceClient()
  const { data, error } = await supabase.from('ideas').insert({
    tenant_id: tenantId,
    title,
    description: (formData.get('description') as string)?.trim() || null,
    status: (formData.get('status') as IdeaStatus) || 'draft',
    tags,
    submitted_by: claims.sub,
  }).select('id').single()

  if (error || !data) redirect(`/${tenantSlug}/ideas`)

  revalidatePath(`/${tenantSlug}/ideas`)
  redirect(`/${tenantSlug}/ideas/${data.id}`)
}

export async function updateIdea(tenantSlug: string, ideaId: string, formData: FormData) {
  const claims = await getServerJWTClaims()
  if (!claims) redirect(`/${tenantSlug}/login`)
  const tenantId = await resolveTenantId(tenantSlug)
  if (!tenantId) redirect(`/${tenantSlug}/dashboard`)

  const title = (formData.get('title') as string)?.trim()
  if (!title) redirect(`/${tenantSlug}/ideas/${ideaId}`)

  const tagsRaw = (formData.get('tags') as string)?.trim()
  const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : []

  const supabase = await createServiceClient()
  await supabase.from('ideas').update({
    title,
    description: (formData.get('description') as string)?.trim() || null,
    status: (formData.get('status') as IdeaStatus) || 'draft',
    tags,
    updated_at: new Date().toISOString(),
  }).eq('id', ideaId).eq('tenant_id', tenantId)

  revalidatePath(`/${tenantSlug}/ideas`)
  revalidatePath(`/${tenantSlug}/ideas/${ideaId}`)
  redirect(`/${tenantSlug}/ideas/${ideaId}`)
}

export async function deleteIdea(tenantSlug: string, ideaId: string) {
  const claims = await getServerJWTClaims()
  if (!claims) redirect(`/${tenantSlug}/login`)
  const tenantId = await resolveTenantId(tenantSlug)
  if (!tenantId) redirect(`/${tenantSlug}/dashboard`)

  const supabase = await createServiceClient()
  await supabase.from('ideas').delete().eq('id', ideaId).eq('tenant_id', tenantId)

  revalidatePath(`/${tenantSlug}/ideas`)
  redirect(`/${tenantSlug}/ideas`)
}
