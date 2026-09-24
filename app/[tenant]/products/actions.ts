'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getServerJWTClaims } from '@/lib/supabase/server'
import type { Product } from './types'

async function getTenantId(tenantSlug: string): Promise<string | null> {
  const claims = await getServerJWTClaims()
  if (!claims) return null
  if (claims.tenant_id) return claims.tenant_id

  // IL admin viewing a tenant — resolve by slug
  const supabase = await createClient()
  const { data } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
  return data?.id ?? null
}

export async function getProducts(tenantSlug: string): Promise<Product[]> {
  const tenantId = await getTenantId(tenantSlug)
  if (!tenantId) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[getProducts]', error)
    return []
  }
  return data ?? []
}

export async function getProduct(tenantSlug: string, productId: string): Promise<Product | null> {
  const tenantId = await getTenantId(tenantSlug)
  if (!tenantId) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('tenant_id', tenantId)
    .single()

  if (error) return null
  return data
}

export async function createProduct(tenantSlug: string, formData: FormData) {
  const tenantId = await getTenantId(tenantSlug)
  if (!tenantId) throw new Error('Unauthorized')

  const name = formData.get('name') as string
  const type = formData.get('type') as string
  const description = formData.get('description') as string

  const supabase = await createClient()
  const { error } = await supabase.from('products').insert({
    tenant_id: tenantId,
    name: name.trim(),
    type,
    description: description?.trim() || null,
  })

  if (error) throw new Error(error.message)

  revalidatePath(`/${tenantSlug}/products`)
  redirect(`/${tenantSlug}/products`)
}

export async function updateProduct(
  tenantSlug: string,
  productId: string,
  formData: FormData
) {
  const tenantId = await getTenantId(tenantSlug)
  if (!tenantId) throw new Error('Unauthorized')

  const name = formData.get('name') as string
  const type = formData.get('type') as string
  const description = formData.get('description') as string

  const supabase = await createClient()
  const { error } = await supabase
    .from('products')
    .update({ name: name.trim(), type, description: description?.trim() || null })
    .eq('id', productId)
    .eq('tenant_id', tenantId)

  if (error) throw new Error(error.message)

  revalidatePath(`/${tenantSlug}/products`)
  redirect(`/${tenantSlug}/products`)
}

export async function deleteProduct(tenantSlug: string, productId: string) {
  const tenantId = await getTenantId(tenantSlug)
  if (!tenantId) throw new Error('Unauthorized')

  const supabase = await createClient()
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)
    .eq('tenant_id', tenantId)

  if (error) throw new Error(error.message)

  revalidatePath(`/${tenantSlug}/products`)
  redirect(`/${tenantSlug}/products`)
}
