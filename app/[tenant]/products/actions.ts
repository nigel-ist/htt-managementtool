'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { getServerJWTClaims } from '@/lib/supabase/server'
import type { Product, ProductData } from './types'

async function getTenantId(tenantSlug: string): Promise<string | null> {
  const claims = await getServerJWTClaims()
  if (!claims) return null
  if (claims.tenant_id) return claims.tenant_id

  const supabase = createServiceClient()
  const { data } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
  return data?.id ?? null
}

export async function getProducts(tenantSlug: string): Promise<Product[]> {
  const tenantId = await getTenantId(tenantSlug)
  if (!tenantId) return []

  const supabase = createServiceClient()
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

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('tenant_id', tenantId)
    .single()

  if (error) return null
  return data
}

/** Parse multi-value form fields that arrive as newline-separated strings */
function parseLines(raw: FormDataEntryValue | null): string[] {
  if (!raw) return []
  return (raw as string).split('\n').map((s) => s.trim()).filter(Boolean)
}

/** Parse pricing JSON submitted as a hidden field */
function parsePricing(raw: FormDataEntryValue | null) {
  if (!raw) return []
  try { return JSON.parse(raw as string) } catch { return [] }
}

function parseScores(formData: FormData) {
  const scoreKeys = [
    'brinkman_fit','skills','bc_readiness','client','client_predicted',
    'revenue','revenue_predicted','market','opportunity','competition',
    'consensus','forecast_1yr','forecast_3yr','forecast_5yr',
  ]
  const scores: Record<string, number> = {}
  for (const k of scoreKeys) {
    const v = formData.get(`score_${k}`)
    if (v !== null && v !== '') {
      const n = Number(v)
      if (!isNaN(n)) scores[k] = Math.max(0, Math.min(100, n))
    }
  }
  return scores
}

function buildData(formData: FormData): Partial<ProductData> {
  const business_units = formData.getAll('business_units') as string[]
  const category_tags  = formData.getAll('category_tags') as string[]
  return {
    features:        parseLines(formData.get('features')),
    deliverables:    parseLines(formData.get('deliverables')),
    differentiators: parseLines(formData.get('differentiators')),
    pricing:         parsePricing(formData.get('pricing_json')),
    pricing_notes:   (formData.get('pricing_notes') as string)?.trim() || '',
    business_units,
    category_tags,
    scores:          parseScores(formData),
  }
}

export async function createProduct(tenantSlug: string, formData: FormData) {
  const tenantId = await getTenantId(tenantSlug)
  if (!tenantId) throw new Error('Unauthorized')

  const name        = formData.get('name') as string
  const type        = formData.get('type') as string
  const description = formData.get('description') as string

  const supabase = createServiceClient()
  const { error } = await supabase.from('products').insert({
    tenant_id:   tenantId,
    name:        name.trim(),
    type,
    description: description?.trim() || null,
    data:        buildData(formData),
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

  const name        = formData.get('name') as string
  const type        = formData.get('type') as string
  const description = formData.get('description') as string

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('products')
    .update({
      name:        name.trim(),
      type,
      description: description?.trim() || null,
      data:        buildData(formData),
    })
    .eq('id', productId)
    .eq('tenant_id', tenantId)

  if (error) throw new Error(error.message)
  revalidatePath(`/${tenantSlug}/products`)
  redirect(`/${tenantSlug}/products`)
}

export async function deleteProduct(tenantSlug: string, productId: string) {
  const tenantId = await getTenantId(tenantSlug)
  if (!tenantId) throw new Error('Unauthorized')

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)
    .eq('tenant_id', tenantId)

  if (error) throw new Error(error.message)
  revalidatePath(`/${tenantSlug}/products`)
  redirect(`/${tenantSlug}/products`)
}
