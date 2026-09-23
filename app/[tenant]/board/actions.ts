'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import type { BoardMeeting } from './types'

export async function getBoardMeetings(tenantSlug: string): Promise<BoardMeeting[]> {
  const supabase = await createClient()
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
  if (!tenant) return []
  const { data } = await supabase
    .from('board_meetings')
    .select('*')
    .eq('tenant_id', tenant.id)
    .order('meeting_date', { ascending: false })
  return (data ?? []).map((r: Record<string, unknown>) => ({
    ...r,
    attendees: (r.attendees as string[]) ?? [],
    action_items: (r.action_items as string[]) ?? [],
  })) as BoardMeeting[]
}

export async function getBoardMeeting(tenantSlug: string, id: string): Promise<BoardMeeting | null> {
  const supabase = await createClient()
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
  if (!tenant) return null
  const { data } = await supabase.from('board_meetings').select('*').eq('id', id).eq('tenant_id', tenant.id).single()
  if (!data) return null
  return { ...data, attendees: data.attendees ?? [], action_items: data.action_items ?? [] } as BoardMeeting
}

const parseList = (val: FormDataEntryValue | null) =>
  (val as string ?? '').split('\n').map((s: string) => s.trim()).filter(Boolean)

export async function createBoardMeeting(tenantSlug: string, formData: FormData) {
  const supabase = await createClient()
  const service = createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
  if (!tenant) throw new Error('Tenant not found')
  await service.from('board_meetings').insert({
    tenant_id: tenant.id,
    title: formData.get('title') as string,
    meeting_type: formData.get('meeting_type') as string,
    meeting_date: formData.get('meeting_date') as string,
    location: formData.get('location') as string || null,
    attendees: parseList(formData.get('attendees')),
    agenda: formData.get('agenda') as string || null,
    minutes: formData.get('minutes') as string || null,
    action_items: parseList(formData.get('action_items')),
    created_by: user?.id ?? null,
  })
  revalidatePath(`/${tenantSlug}/board`)
}

export async function updateBoardMeeting(tenantSlug: string, id: string, formData: FormData) {
  const service = createServiceClient()
  const supabase = await createClient()
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
  if (!tenant) throw new Error('Tenant not found')
  await service.from('board_meetings').update({
    title: formData.get('title') as string,
    meeting_type: formData.get('meeting_type') as string,
    meeting_date: formData.get('meeting_date') as string,
    location: formData.get('location') as string || null,
    attendees: parseList(formData.get('attendees')),
    agenda: formData.get('agenda') as string || null,
    minutes: formData.get('minutes') as string || null,
    action_items: parseList(formData.get('action_items')),
  }).eq('id', id).eq('tenant_id', tenant.id)
  revalidatePath(`/${tenantSlug}/board`)
}

export async function deleteBoardMeeting(tenantSlug: string, id: string) {
  const service = createServiceClient()
  const supabase = await createClient()
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
  if (!tenant) throw new Error('Tenant not found')
  await service.from('board_meetings').delete().eq('id', id).eq('tenant_id', tenant.id)
  revalidatePath(`/${tenantSlug}/board`)
}
