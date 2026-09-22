'use server'

/**
 * Roles module — server actions.
 *
 * DB table: roles
 * ─────────────────────────────────────────────────────────────────
 * CREATE TABLE roles (
 *   id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
 *   tenant_id         uuid        NOT NULL REFERENCES tenants(id),
 *   title             text        NOT NULL,
 *   department        text,
 *   level             text,       -- e.g. Junior | Mid | Senior | Lead | Principal | Executive
 *   responsibilities  text,
 *   raci              jsonb       NOT NULL DEFAULT '[]',
 *   headcount         int2        NOT NULL DEFAULT 1,
 *   is_open           boolean     NOT NULL DEFAULT false,
 *   created_by        uuid        REFERENCES auth.users(id),
 *   created_at        timestamptz NOT NULL DEFAULT now(),
 *   updated_at        timestamptz NOT NULL DEFAULT now()
 * );
 *
 * ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
 *
 * CREATE POLICY "tenant_isolation" ON roles
 *   USING (
 *     tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
 *     OR (auth.jwt() ->> 'is_il_admin') = 'true'
 *   );
 */

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient, getServerJWTClaims } from '@/lib/supabase/server'
import { LEVELS, type RaciItem, type Role } from './types'

// ─── Helpers ──────────────────────────────────────────────────────

async function resolveTenantId(tenantSlug: string): Promise<string | null> {
  const claims = await getServerJWTClaims()
  if (!claims) return null
  if (claims.tenant_id) return claims.tenant_id

  const supabase = await createClient()
  const { data } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
  return data?.id ?? null
}

// ─── Queries ──────────────────────────────────────────────────────

export async function getRoles(tenantSlug: string): Promise<Role[] | null> {
  const claims = await getServerJWTClaims()
  if (!claims) return null

  const tenantId = await resolveTenantId(tenantSlug)
  if (!tenantId) return null

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('roles')
    .select('id, title, department, level, responsibilities, raci, headcount, is_open, created_at')
    .eq('tenant_id', tenantId)
    .order('department', { ascending: true })
    .order('title', { ascending: true })

  if (error) {
    console.error('[roles/actions] getRoles error:', error)
    return null
  }

  return (data ?? []).map((row) => ({
    ...row,
    raci: (row.raci as RaciItem[]) ?? [],
  }))
}

export async function getRole(tenantSlug: string, roleId: string): Promise<Role | null> {
  const claims = await getServerJWTClaims()
  if (!claims) return null

  const tenantId = await resolveTenantId(tenantSlug)
  if (!tenantId) return null

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('roles')
    .select('id, title, department, level, responsibilities, raci, headcount, is_open, created_at')
    .eq('tenant_id', tenantId)
    .eq('id', roleId)
    .single()

  if (error || !data) return null

  return { ...data, raci: (data.raci as RaciItem[]) ?? [] }
}

// ─── Mutations ────────────────────────────────────────────────────

export async function createRole(tenantSlug: string, formData: FormData) {
  const claims = await getServerJWTClaims()
  if (!claims) redirect(`/${tenantSlug}/login`)

  const tenantId = await resolveTenantId(tenantSlug)
  if (!tenantId) redirect(`/${tenantSlug}/dashboard`)

  const supabase = await createServiceClient()

  const title = (formData.get('title') as string)?.trim()
  if (!title) redirect(`/${tenantSlug}/roles/new`)

  const raciJson = formData.get('raci_json') as string | null
  let raci: RaciItem[] = []
  if (raciJson) {
    try { raci = JSON.parse(raciJson) } catch { /* ignore */ }
  }

  const { error } = await supabase.from('roles').insert({
    tenant_id: tenantId,
    title,
    department: (formData.get('department') as string)?.trim() || null,
    level: (formData.get('level') as string) || null,
    responsibilities: (formData.get('responsibilities') as string)?.trim() || null,
    raci,
    headcount: parseInt(formData.get('headcount') as string, 10) || 1,
    is_open: formData.get('is_open') === 'true',
    created_by: claims.sub,
  })

  if (error) {
    console.error('[roles/actions] createRole error:', error)
    redirect(`/${tenantSlug}/roles/new`)
  }

  revalidatePath(`/${tenantSlug}/roles`)
  redirect(`/${tenantSlug}/roles`)
}

export async function updateRole(tenantSlug: string, roleId: string, formData: FormData) {
  const claims = await getServerJWTClaims()
  if (!claims) redirect(`/${tenantSlug}/login`)

  const tenantId = await resolveTenantId(tenantSlug)
  if (!tenantId) redirect(`/${tenantSlug}/dashboard`)

  const supabase = await createServiceClient()

  const title = (formData.get('title') as string)?.trim()
  if (!title) redirect(`/${tenantSlug}/roles/${roleId}`)

  const raciJson = formData.get('raci_json') as string | null
  let raci: RaciItem[] = []
  if (raciJson) {
    try { raci = JSON.parse(raciJson) } catch { /* ignore */ }
  }

  const { error } = await supabase
    .from('roles')
    .update({
      title,
      department: (formData.get('department') as string)?.trim() || null,
      level: (formData.get('level') as string) || null,
      responsibilities: (formData.get('responsibilities') as string)?.trim() || null,
      raci,
      headcount: parseInt(formData.get('headcount') as string, 10) || 1,
      is_open: formData.get('is_open') === 'true',
      updated_at: new Date().toISOString(),
    })
    .eq('id', roleId)
    .eq('tenant_id', tenantId)

  if (error) {
    console.error('[roles/actions] updateRole error:', error)
  }

  revalidatePath(`/${tenantSlug}/roles`)
  revalidatePath(`/${tenantSlug}/roles/${roleId}`)
  redirect(`/${tenantSlug}/roles/${roleId}`)
}

export async function deleteRole(tenantSlug: string, roleId: string) {
  const claims = await getServerJWTClaims()
  if (!claims) redirect(`/${tenantSlug}/login`)

  const tenantId = await resolveTenantId(tenantSlug)
  if (!tenantId) redirect(`/${tenantSlug}/dashboard`)

  const supabase = await createServiceClient()

  await supabase.from('roles').delete().eq('id', roleId).eq('tenant_id', tenantId)

  revalidatePath(`/${tenantSlug}/roles`)
  redirect(`/${tenantSlug}/roles`)
}
