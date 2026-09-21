/**
 * IL Admin — Invitations across all tenants.
 * Shows pending and accepted invitations platform-wide.
 */
import { createServiceClient } from '@/lib/supabase/server'

interface InvitationRow {
  id: string
  email: string
  role: string
  tenant_name: string | null
  tenant_slug: string | null
  invited_at: string
  expires_at: string
  accepted_at: string | null
}

async function getAllInvitations(): Promise<InvitationRow[]> {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('invitations')
    .select(`
      id, email, role, created_at, expires_at, accepted_at,
      tenants(name, slug)
    `)
    .order('created_at', { ascending: false })

  if (error) console.error('[admin/invitations] query error:', error)
  if (!data) return []

  return data.map((inv: any) => ({
    id: inv.id,
    email: inv.email,
    role: inv.role,
    tenant_name: inv.tenants?.name ?? null,
    tenant_slug: inv.tenants?.slug ?? null,
    invited_at: inv.created_at,
    expires_at: inv.expires_at,
    accepted_at: inv.accepted_at,
  }))
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date()
}

export default async function InvitationsPage() {
  const invitations = await getAllInvitations()
  const pending = invitations.filter(i => !i.accepted_at)
  const accepted = invitations.filter(i => i.accepted_at)

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="font-heading text-2xl text-[rgb(var(--text-1))] mb-1">Invitations</h1>
        <p className="text-sm text-[rgb(var(--text-3))]">
          {pending.length} pending · {accepted.length} accepted
        </p>
      </div>

      {invitations.length === 0 ? (
        <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg p-12 text-center">
          <p className="text-sm text-[rgb(var(--text-3))]">No invitations yet.</p>
        </div>
      ) : (
        <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgb(var(--border))]">
                {['Email', 'Workspace', 'Role', 'Invited', 'Expires', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[rgb(var(--text-3))] uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--border))]">
              {invitations.map(inv => {
                const expired = !inv.accepted_at && isExpired(inv.expires_at)
                const statusLabel = inv.accepted_at ? 'Accepted' : expired ? 'Expired' : 'Pending'
                const statusColor = inv.accepted_at
                  ? 'text-[rgb(var(--color-accent))] bg-[rgb(var(--color-accent)/0.1)]'
                  : expired
                  ? 'text-[rgb(var(--text-3))] bg-[rgb(var(--surface-2))]'
                  : 'text-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary)/0.1)]'

                return (
                  <tr key={inv.id} className="hover:bg-[rgb(var(--surface-2))] transition-colors">
                    <td className="px-4 py-3 text-[rgb(var(--text-1))]">{inv.email}</td>
                    <td className="px-4 py-3">
                      {inv.tenant_slug ? (
                        <a
                          href={`/admin/tenants/${inv.tenant_slug}`}
                          className="text-[rgb(var(--color-primary))] hover:underline"
                        >
                          {inv.tenant_name}
                        </a>
                      ) : (
                        <span className="text-[rgb(var(--text-3))]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[rgb(var(--text-2))]">{inv.role}</td>
                    <td className="px-4 py-3 text-[rgb(var(--text-3))] tabular-nums text-xs">
                      {formatDate(inv.invited_at)}
                    </td>
                    <td className="px-4 py-3 text-[rgb(var(--text-3))] tabular-nums text-xs">
                      {formatDate(inv.expires_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColor}`}>
                        {statusLabel}
                      </span>
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

export const metadata = { title: 'Invitations' }
