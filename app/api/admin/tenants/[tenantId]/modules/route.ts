/**
 * PUT /api/admin/tenants/[tenantId]/modules
 * Replaces the enabled module set for a tenant.
 * IL admin only.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServerJWTClaims } from '@/lib/supabase/server'
import { MODULE_KEYS } from '@/lib/types/database'
import { z } from 'zod'

const ModulesSchema = z.object({
  enabled_modules: z.array(z.enum([...MODULE_KEYS] as [string, ...string[]])),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  const claims = await getServerJWTClaims()
  if (!claims?.is_il_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = ModulesSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const supabase = await createClient()
  const { tenantId } = params
  const { enabled_modules } = parsed.data

  // Upsert all module keys — set is_enabled based on the incoming set
  const upserts = MODULE_KEYS.map(key => ({
    tenant_id: tenantId,
    module_key: key,
    is_enabled: enabled_modules.includes(key),
    updated_at: new Date().toISOString(),
  }))

  const { error } = await supabase
    .from('tenant_modules')
    .upsert(upserts, { onConflict: 'tenant_id,module_key' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
