/**
 * IL Admin — Overview dashboard.
 * Live stats: tenants, members, pending invitations.
 */
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'

async function getOverviewStats() {
  const supabase = createServiceClient()

  const [tenantsResult, membersResult, invitationsResult, recentTenantsResult] = await Promise.all([
    supabase.from('tenants').select('id, is_active', { count: 'exact' }),
    supabase.from('tenant_members').select('id, is_active', { count: 'exact' }),
    supabase.from('invitations').select('id, accepted_at, expires_at', { count: 'exact' }),
    supabase
      .from('tenants')
      .select('id, name, slug, tier, is_active, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const tenants = tenantsResult.data ?? []
  const members = membersResult.data ?? []
  const invitations = invitationsResult.data ?? []
  const recentTenants = recentTenantsResult.data ?? []

  const now = new Date()
  const pendingInvitations = invitations.filter(
    (i) => !i.accepted_at && new Date(i.expires_at) > now
  )

  return {
    totalTenants: tenantsResult.count ?? tenants.length,
    activeTenants: tenants.filter((t) => t.is_active).length,
    totalMembers: membersResult.count ?? members.length,
    activeMembers: members.filter((m) => m.is_active).length,
    pendingInvitations: pendingInvitations.length,
    totalInvitations: invitationsResult.count ?? invitations.length,
    recentTenants,
  }
}

const TIER_COLORS: Record<string, string> = {
  standard: 'text-[rgb(var(--text-3))] bg-[rgb(var(--surface-2))]',
  professional: 'text-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary)/0.08)]',
  enterprise: 'text-[rgb(var(--color-accent))] bg-[rgb(var(--color-accent)/0.08)]',
}

export default async function AdminOverviewPage() {
  const stats = await getOverviewStats()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl text-[rgb(var(--text-1))]">Overview</h1>
        <p className="text-sm text-[rgb(var(--text-3))] mt-1">Platform health at a glance.</p>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Workspaces"
          value={stats.totalTenants}
          sub={`${stats.activeTenants} active`}
          href="/admin/tenants"
        />
        <StatTile
          label="Members"
          value={stats.totalMembers}
          sub={`${stats.activeMembers} active`}
          href="/admin/users"
        />
        <StatTile
          label="Pending invites"
          value={stats.pendingInvitations}
          sub={`${stats.totalInvitations} total sent`}
          href="/admin/invitations"
          highlight={stats.pendingInvitations > 0}
        />
        <StatTile
          label="Active rate"
          value={stats.totalTenants > 0
            ? `${Math.round((stats.activeTenants / stats.totalTenants) * 100)}%`
            : '—'}
          sub="workspaces active"
        />
      </div>

      {/* Recent workspaces */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-[rgb(var(--text-1))]">Recent workspaces</h2>
          <Link href="/admin/tenants" className="text-xs text-[rgb(var(--color-primary))] hover:underline">
            View all →
          </Link>
        </div>

        {stats.recentTenants.length === 0 ? (
          <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg p-8 text-center">
            <p className="text-sm text-[rgb(var(--text-3))]">No workspaces yet.</p>
            <Link href="/admin/tenants/new" className="text-xs text-[rgb(var(--color-primary))] hover:underline mt-2 inline-block">
              Create the first →
            </Link>
          </div>
        ) : (
          <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg overflow-hidden">
            {stats.recentTenants.map((tenant, i) => (
              <div
                key={tenant.id}
                className={`flex items-center justify-between px-4 py-3 ${
                  i < stats.recentTenants.length - 1 ? 'border-b border-[rgb(var(--border))]' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    tenant.is_active ? 'bg-[rgb(var(--color-accent))]' : 'bg-[rgb(var(--text-3))]'
                  }`} />
                  <div className="min-w-0">
                    <span className="text-sm text-[rgb(var(--text-1))] truncate block">{tenant.name}</span>
                    <code className="text-xs text-[rgb(var(--text-3))]">{tenant.slug}</code>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${TIER_COLORS[tenant.tier] ?? TIER_COLORS.standard}`}>
                    {tenant.tier}
                  </span>
                  <Link
                    href={`/admin/tenants/${tenant.slug}`}
                    className="text-xs text-[rgb(var(--color-primary))] hover:underline"
                  >
                    Manage →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="text-sm font-medium text-[rgb(var(--text-1))] mb-3">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/tenants/new"
            className="px-4 py-2 text-sm font-medium text-white bg-[rgb(var(--color-primary))] rounded hover:opacity-90 transition-opacity"
          >
            + New workspace
          </Link>
          <Link
            href="/admin/invitations"
            className="px-4 py-2 text-sm font-medium text-[rgb(var(--text-1))] bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded hover:bg-[rgb(var(--surface-2))] transition-colors"
          >
            View invitations
          </Link>
          <Link
            href="/admin/users"
            className="px-4 py-2 text-sm font-medium text-[rgb(var(--text-1))] bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded hover:bg-[rgb(var(--surface-2))] transition-colors"
          >
            Manage users
          </Link>
        </div>
      </section>
    </div>
  )
}

function StatTile({
  label,
  value,
  sub,
  href,
  highlight = false,
}: {
  label: string
  value: number | string
  sub: string
  href?: string
  highlight?: boolean
}) {
  const content = (
    <div className={`bg-[rgb(var(--surface))] border rounded-lg p-4 ${
      highlight ? 'border-[rgb(var(--color-primary)/0.4)]' : 'border-[rgb(var(--border))]'
    }`}>
      <div className="text-xs text-[rgb(var(--text-3))] mb-1">{label}</div>
      <div className={`font-heading text-3xl font-semibold ${
        highlight ? 'text-[rgb(var(--color-primary))]' : 'text-[rgb(var(--text-1))]'
      }`}>
        {value}
      </div>
      <div className="text-xs text-[rgb(var(--text-3))] mt-1">{sub}</div>
    </div>
  )

  if (href) {
    return <Link href={href} className="block hover:opacity-80 transition-opacity">{content}</Link>
  }
  return content
}

export const metadata = { title: 'Overview' }
