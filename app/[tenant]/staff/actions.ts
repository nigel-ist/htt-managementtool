'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, getServerJWTClaims } from '@/lib/supabase/server'

export interface Skill {
  name: string
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  category: string
}

async function getTenantId(tenantSlug: string): Promise<string | null> {
  const claims = await getServerJWTClaims()
  if (!claims) return null
  if (claims.tenant_id) return claims.tenant_id

  const supabase = await createClient()
  const { data } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', tenantSlug)
    .single()
  return data?.id ?? null
}

// Skills are submitted as a JSON string in a hidden field called "skills_json"
function parseSkills(formData: FormData): Skill[] {
  const raw = formData.get('skills_json') as string | null
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (s): s is Skill =>
        typeof s.name === 'string' &&
        s.name.trim() !== '' &&
        ['beginner', 'intermediate', 'advanced', 'expert'].includes(s.level) &&
        typeof s.category === 'string'
    )
  } catch {
    return []
  }
}

export async function createStaffMember(tenantSlug: string, formData: FormData) {
  const tenantId = await getTenantId(tenantSlug)
  if (!tenantId) throw new Error('Unauthorized')

  const name = (formData.get('name') as string | null)?.trim()
  const department = (formData.get('department') as string | null)?.trim() || null
  const role_title = (formData.get('role_title') as string | null)?.trim() || null
  const skills = parseSkills(formData)

  if (!name) throw new Error('Name is required')

  const supabase = await createClient()
  const { error } = await supabase.from('staff_skills').insert({
    tenant_id: tenantId,
    name,
    department,
    role_title,
    skills,
  })

  if (error) throw new Error(error.message)

  revalidatePath(`/${tenantSlug}/staff`)
  redirect(`/${tenantSlug}/staff`)
}

export async function updateStaffMember(
  tenantSlug: string,
  staffId: string,
  formData: FormData
) {
  const tenantId = await getTenantId(tenantSlug)
  if (!tenantId) throw new Error('Unauthorized')

  const name = (formData.get('name') as string | null)?.trim()
  const department = (formData.get('department') as string | null)?.trim() || null
  const role_title = (formData.get('role_title') as string | null)?.trim() || null
  const skills = parseSkills(formData)

  if (!name) throw new Error('Name is required')

  const supabase = await createClient()
  const { error } = await supabase
    .from('staff_skills')
    .update({ name, department, role_title, skills })
    .eq('id', staffId)
    .eq('tenant_id', tenantId)

  if (error) throw new Error(error.message)

  revalidatePath(`/${tenantSlug}/staff`)
  redirect(`/${tenantSlug}/staff`)
}

export async function deleteStaffMember(tenantSlug: string, staffId: string) {
  const tenantId = await getTenantId(tenantSlug)
  if (!tenantId) throw new Error('Unauthorized')

  const supabase = await createClient()
  const { error } = await supabase
    .from('staff_skills')
    .delete()
    .eq('id', staffId)
    .eq('tenant_id', tenantId)

  if (error) throw new Error(error.message)

  revalidatePath(`/${tenantSlug}/staff`)
  redirect(`/${tenantSlug}/staff`)
}
