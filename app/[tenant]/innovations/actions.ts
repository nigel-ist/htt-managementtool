'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServiceClient, getServerJWTClaims } from '@/lib/supabase/server'

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

export async function createInnovation(tenantSlug: string, formData: FormData) {
  const tenantId = await getTenantId(tenantSlug)
  if (!tenantId) throw new Error('Unauthorized')

  const title = (formData.get('title') as string | null)?.trim()
  const stage = formData.get('stage') as string | null
  const description = (formData.get('description') as string | null)?.trim() || null

  if (!title || !stage) throw new Error('Title and stage are required')

  const supabase = createServiceClient()
  const { error } = await supabase.from('innovations').insert({
    tenant_id: tenantId,
    title,
    stage,
    data: description ? { description } : {},
  })

  if (error) throw new Error(error.message)

  revalidatePath(`/${tenantSlug}/innovations`)
  redirect(`/${tenantSlug}/innovations`)
}

export async function updateInnovation(
  tenantSlug: string,
  innovationId: string,
  formData: FormData
) {
  const tenantId = await getTenantId(tenantSlug)
  if (!tenantId) throw new Error('Unauthorized')

  const title = (formData.get('title') as string | null)?.trim()
  const stage = formData.get('stage') as string | null
  const description = (formData.get('description') as string | null)?.trim() || null

  if (!title || !stage) throw new Error('Title and stage are required')

  const supabase = createServiceClient()

  // Fetch existing data to merge (preserve any other JSONB fields)
  const { data: existing } = await supabase
    .from('innovations')
    .select('data')
    .eq('id', innovationId)
    .eq('tenant_id', tenantId)
    .single()

  const mergedData = {
    ...(existing?.data ?? {}),
    description: description ?? null,
  }

  const { error } = await supabase
    .from('innovations')
    .update({ title, stage, data: mergedData })
    .eq('id', innovationId)
    .eq('tenant_id', tenantId)

  if (error) throw new Error(error.message)

  revalidatePath(`/${tenantSlug}/innovations`)
  redirect(`/${tenantSlug}/innovations`)
}

export async function deleteInnovation(tenantSlug: string, innovationId: string) {
  const tenantId = await getTenantId(tenantSlug)
  if (!tenantId) throw new Error('Unauthorized')

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('innovations')
    .delete()
    .eq('id', innovationId)
    .eq('tenant_id', tenantId)

  if (error) throw new Error(error.message)

  revalidatePath(`/${tenantSlug}/innovations`)
  redirect(`/${tenantSlug}/innovations`)
}
