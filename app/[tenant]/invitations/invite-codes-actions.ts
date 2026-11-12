'use server'

/**
 * Server actions for invite code management.
 */
import { revalidatePath } from 'next/cache'
import { createServiceClient, getServerJWTClaims } from '@/lib/supabase/server'
import type { MemberRole } from '@/lib/types/database'

async function requireAdmin(tenantSlug: string): Promise<string | null> {
  const claims = await getServerJWTClaims()
  if (!claims) return null
  const isAdmin = claims.is_il_admin || claims.role === 'admin' || claims.role === 'owner'
  if (!isAdmin) return null
  if (claims.tenant_id) return claims.tenant_id
  const supabase = createServiceClient()
  const { data } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
  return data?.id ?? null
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const seg = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `${seg()}-${seg()}`
}

export interface InviteCodeRow {
  id: string
  code: string
  defaultRole: MemberRole
  requiresValidation: boolean
  isActive: boolean
  usesCount: number
  maxUses: number | null
  expiresAt: string | null
  createdAt: string
}

export async function getInviteCodes(tenantSlug: string): Promise<InviteCodeRow[]> {
  const tenantId = await requireAdmin(tenantSlug)
  if (!tenantId) return []

  const supabase = createServiceClient()
  const { data } = await supabase
    .from('tenant_invite_codes')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  return (data ?? []).map(r => ({
    id: r.id, code: r.code, defaultRole: r.default_role as MemberRole,
    requiresValidation: r.requires_validation, isActive: r.is_active,
    usesCount: r.uses_count, maxUses: r.max_uses, expiresAt: r.expires_at, createdAt: r.created_at,
  }))
}

export async function createInviteCode(
  tenantSlug: string,
  opts: { defaultRole: MemberRole; requiresValidation: boolean; maxUses?: number | null; expiresAt?: string | null }
): Promise<{ error?: string; code?: string }> {
  const tenantId = await requireAdmin(tenantSlug)
  if (!tenantId) return { error: 'Unauthorized' }

  const claims = await getServerJWTClaims()
  const supabase = createServiceClient()
  const code = generateCode()

  const { data, error } = await supabase
    .from('tenant_invite_codes')
    .insert({ tenant_id: tenantId, code, default_role: opts.defaultRole, requires_validation: opts.requiresValidation, max_uses: opts.maxUses ?? null, expires_at: opts.expiresAt ?? null, created_by: claims?.sub ?? null })
    .select('code')
    .single()

  if (error) return { error: error.message }
  revalidatePath(`/${tenantSlug}/invitations`)
  return { code: data.code }
}

export async function toggleInviteCode(tenantSlug: string, codeId: string, isActive: boolean): Promise<{ error?: string }> {
  const tenantId = await requireAdmin(tenantSlug)
  if (!tenantId) return { error: 'Unauthorized' }

  const supabase = createServiceClient()
  const { error } = await supabase.from('tenant_invite_codes').update({ is_active: isActive }).eq('id', codeId).eq('tenant_id', tenantId)
  if (error) return { error: error.message }
  revalidatePath(`/${tenantSlug}/invitations`)
  return {}
}

export async function deleteInviteCode(tenantSlug: string, codeId: string): Promise<{ error?: string }> {
  const tenantId = await requireAdmin(tenantSlug)
  if (!tenantId) return { error: 'Unauthorized' }

  const supabase = createServiceClient()
  const { error } = await supabase.from('tenant_invite_codes').delete().eq('id', codeId).eq('tenant_id', tenantId)
  if (error) return { error: error.message }
  revalidatePath(`/${tenantSlug}/invitations`)
  return {}
}

export interface PendingMemberRow {
  userId: string
  email: string
  fullName: string | null
  role: MemberRole
  joinedAt: string
}

export async function getPendingMembers(tenantSlug: string): Promise<PendingMemberRow[]> {
  const tenantId = await requireAdmin(tenantSlug)
  if (!tenantId) return []

  const supabase = createServiceClient()
  const { data: members } = await supabase
    .from('tenant_members')
    .select('user_id, role, full_name, invited_at')
    .eq('tenant_id', tenantId)
    .eq('status', 'pending_validation')
    .order('invited_at', { ascending: false })

  if (!members?.length) return []

  const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const emailMap: Record<string, string> = {}
  for (const u of (usersData?.users ?? [])) emailMap[u.id] = u.email ?? u.id

  return members.map(m => ({
    userId: m.user_id, email: emailMap[m.user_id] ?? m.user_id,
    fullName: m.full_name ?? null, role: m.role as MemberRole, joinedAt: m.invited_at,
  }))
}

export async function validateMember(tenantSlug: string, userId: string): Promise<{ error?: string }> {
  const tenantId = await requireAdmin(tenantSlug)
  if (!tenantId) return { error: 'Unauthorized' }

  const supabase = createServiceClient()
  const { error } = await supabase.from('tenant_members').update({ status: 'active' }).eq('tenant_id', tenantId).eq('user_id', userId)
  if (error) return { error: error.message }

  revalidatePath(`/${tenantSlug}/invitations`)
  revalidatePath(`/${tenantSlug}/settings/members`)
  return {}
}

export async function rejectPendingMember(tenantSlug: string, userId: string): Promise<{ error?: string }> {
  const tenantId = await requireAdmin(tenantSlug)
  if (!tenantId) return { error: 'Unauthorized' }

  const supabase = createServiceClient()
  const { error } = await supabase.from('tenant_members').delete().eq('tenant_id', tenantId).eq('user_id', userId)
  if (error) return { error: error.message }

  revalidatePath(`/${tenantSlug}/invitations`)
  return {}
}
