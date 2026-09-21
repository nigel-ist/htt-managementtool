/**
 * IL Admin — Tenants list.
 * Shows all tenants with status, tier, seat count, and quick actions.
 */
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import type { TenantTier } from '@/lib/types/database'

const TIER_LABELS: Record<TenantTier, string> = {
  standard: 'Standard',
  professional: 'Professional',
  enterprise: 'Enterprise',
}

const TIER_COLORS: Record<TenantTier, string> = {
  standard: 'text-[rgb(var(--text-3))] bg-[rgb(var(--surface-2))]',
  professional: 'text-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary)/0.1)]',
  enterprise: 'text-[rgb(var(--color-accent))] bg-[rgb(var(--color-accent)/0.1)]',
}

async function getTenants() {
  const supabase = createServiceClient()

  const { data: tenants, error } = await supabase
    .from('tenants')
    .select(`
      id, name, slug, tier, is_active, created_at,
      tenant_members(count)
    `)
    .order('created_at', { ascending: false })

  if (error) console.error('[admin/tenants] query error:', error)
  return tenants ?? []
}

export default async function TenantsPage() {
  const tenants = await getTenants()

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl text-[rgb(var(--text-1))] mb-1">Tenants</h1>
          <p className="text-sm text-[rgb(var(--text-3))]">
            {tenants.length} workspace{tenants.length !== 1 ? 's' : ''} on the platform
          </p>
        </div>
        <Link
          href="/admin/tenants/new"
          className="px-4 py-2 text-sm font-medium text-white bg-[rgb(var(--color-primary))] rounded hover:opacity-90 transition-opacity"
        >
          New tenant
        </Link>
      </div>

      {tenants.length === 0 ? (
        <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg p-12 text-center">
          <p className="text-sm text-[rgb(var(--text-3))] mb-4">No tenants yet.</p>
          <Link
            href="/admin/tenants/new"
            className="text-sm text-[rgb(var(--color-primary))] hover:underline"
          >
            Create the first tenant →
          </Link>
        </div>
      ) : (
        <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgb(var(--border))]">
                {['Workspace', 'Slug', 'Tier', 'Members', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[rgb(var(--text-3))] uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--border))]">
              {tenants.map((tenant: any) => {
                const memberCount = tenant.tenant_members?.[0]?.count ?? 0
                const tier = tenant.tier as TenantTier

                return (
                  <tr key={tenant.id} className="hover:bg-[rgb(var(--surface-2))] transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-medium text-[rgb(var(--text-1))]">{tenant.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs text-[rgb(var(--text-3))] bg-[rgb(var(--surface-2))] px-1.5 py-0.5 rounded">
                        {tenant.slug}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${TIER_COLORS[tier] ?? 'text-[rgb(var(--text-3))] bg-[rgb(var(--surface-2))]'}`}>
                        {TIER_LABELS[tier] ?? tier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[rgb(var(--text-2))] tabular-nums">
                      {memberCount}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs ${tenant.is_active ? 'text-[rgb(var(--color-accent))]' : 'text-[rgb(var(--text-3))]'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${tenant.is_active ? 'bg-[rgb(var(--color-accent))]' : 'bg-[rgb(var(--text-3))]'}`} />
                        {tenant.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/tenants/${tenant.slug}`}
                        className="text-xs text-[rgb(var(--color-primary))] hover:underline"
                      >
                        Manage →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export const metadata = { title: 'Tenants' }
