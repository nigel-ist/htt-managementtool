/**
 * IL Admin — Tenant detail page.
 *
 * Shows tenant info, branding editor (color pickers + font inputs),
 * module toggles, and member list.
 *
 * Uses separate queries instead of nested joins to avoid PostgREST
 * schema-cache issues with newly-created related tables.
 */
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { MODULE_KEYS } from '@/lib/types/database'
import TenantBrandingForm from './branding-form'
import TenantModulesForm from './modules-form'

interface TenantDetailPageProps {
  params: { slug: string }
}

async function getTenantDetail(slug: string) {
  const supabase = createServiceClient()

  // 1. Fetch the tenant itself
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, name, slug, tier, is_active, created_at')
    .eq('slug', slug)
    .single()

  if (tenantError) {
    console.error('[admin/tenants/slug] tenant query error:', tenantError)
    return null
  }
  if (!tenant) return null

  // 2. Fetch related data separately (avoids PostgREST join issues)
  const [brandingResult, modulesResult, membersResult] = await Promise.all([
    supabase.from('tenant_branding').select('*').eq('tenant_id', tenant.id),
    supabase.from('tenant_modules').select('*').eq('tenant_id', tenant.id),
    supabase.from('tenant_members').select('id, role, is_active, created_at, user_id').eq('tenant_id', tenant.id),
  ])

  if (brandingResult.error) console.error('[admin/tenants/slug] branding error:', brandingResult.error)
  if (modulesResult.error) console.error('[admin/tenants/slug] modules error:', modulesResult.error)
  if (membersResult.error) console.error('[admin/tenants/slug] members error:', membersResult.error)

  return {
    ...tenant,
    branding: brandingResult.data?.[0] ?? null,
    modules: modulesResult.data ?? [],
    members: membersResult.data ?? [],
  }
}

export default async function TenantDetailPage({ params }: TenantDetailPageProps) {
  const tenant = await getTenantDetail(params.slug)
  if (!tenant) notFound()

  const { branding, modules, members } = tenant

  const enabledModules = new Set(
    modules.filter((m: any) => m.is_enabled).map((m: any) => m.module_key)
  )

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <a href="/admin/tenants" className="text-xs text-[rgb(var(--text-3))] hover:text-[rgb(var(--text-2))]">
              Tenants
            </a>
            <span className="text-[rgb(var(--text-3))]">/</span>
            <span className="text-xs text-[rgb(var(--text-2))]">{tenant.name}</span>
          </div>
          <h1 className="font-heading text-2xl text-[rgb(var(--text-1))]">{tenant.name}</h1>
          <code className="text-xs text-[rgb(var(--text-3))]">{tenant.slug}</code>
        </div>
        <a
          href={`/${tenant.slug}/dashboard`}
          target="_blank"
          className="text-xs text-[rgb(var(--color-primary))] hover:underline"
        >
          Open workspace ↗
        </a>
      </div>

      {/* Branding */}
      <section className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg p-6">
        <h2 className="font-semibold text-[rgb(var(--text-1))] mb-4">Branding</h2>
        <TenantBrandingForm tenantId={tenant.id} branding={branding} />
      </section>

      {/* Modules */}
      <section className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg p-6">
        <h2 className="font-semibold text-[rgb(var(--text-1))] mb-1">Modules</h2>
        <p className="text-xs text-[rgb(var(--text-3))] mb-4">
          Enable or disable platform modules for this workspace.
        </p>
        <TenantModulesForm tenantId={tenant.id} enabledModules={Array.from(enabledModules)} />
      </section>

      {/* Members */}
      <section className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg p-6">
        <h2 className="font-semibold text-[rgb(var(--text-1))] mb-4">
          Members <span className="font-normal text-[rgb(var(--text-3))]">({members.length})</span>
        </h2>
        {members.length === 0 ? (
          <p className="text-sm text-[rgb(var(--text-3))]">No members yet.</p>
        ) : (
          <div className="space-y-2">
            {members.map((member: any) => (
              <div key={member.id} className="flex items-center justify-between py-2 border-b border-[rgb(var(--border))] last:border-0">
                <div>
                  <span className="text-sm text-[rgb(var(--text-1))]">{member.user_id}</span>
                  <span className="ml-2 text-xs text-[rgb(var(--text-3))]">{member.role}</span>
                </div>
                <span className={`text-xs ${member.is_active ? 'text-[rgb(var(--color-accent))]' : 'text-[rgb(var(--text-3))]'}`}>
                  {member.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export async function generateMetadata({ params }: TenantDetailPageProps) {
  return { title: params.slug }
}
