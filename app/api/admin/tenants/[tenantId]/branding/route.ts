/**
 * PUT /api/admin/tenants/[tenantId]/branding
 * Updates or creates the tenant_branding record for a tenant.
 * IL admin only.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServerJWTClaims } from '@/lib/supabase/server'
import { z } from 'zod'

const BrandingSchema = z.object({
  primary_color:   z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  secondary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  accent_color:    z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  font_heading:    z.string().max(100).nullable().optional(),
  font_body:       z.string().max(100).nullable().optional(),
  logo_url:        z.string().url().nullable().optional(),
  favicon_url:     z.string().url().nullable().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  // Auth check — IL admin only
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

  const parsed = BrandingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('tenant_branding')
    .upsert(
      { tenant_id: params.tenantId, ...parsed.data, updated_at: new Date().toISOString() },
      { onConflict: 'tenant_id' }
    )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
