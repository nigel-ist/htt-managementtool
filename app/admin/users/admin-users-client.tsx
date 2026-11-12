'use client'

/**
 * Client component for Admin > Users.
 * Shows all platform users with validate, delete, and invite actions.
 */
import { useState, useTransition } from 'react'
import type { MemberRole } from '@/lib/types/database'
import type { AdminUserRow } from './actions'

interface Props {
  users: AdminUserRow[]
  validateUser: (userId: string) => Promise<{ error?: string }>
  deleteUser: (userId: string) => Promise<{ error?: string }>
  inviteUser: (tenantSlug: string, email: string, role: MemberRole) => Promise<{ error?: string; acceptLink?: string }>
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  active:              { label: 'Active', cls: 'text-[rgb(var(--color-accent))]' },
  pending_validation:  { label: 'Pending', cls: 'text-amber-600 dark:text-amber-400' },
  suspended:           { label: 'Suspended', cls: 'text-[rgb(var(--text-3))]' },
}

const ROLES: { value: MemberRole; label: string }[] = [
  { value: 'viewer', label: 'Viewer' },
  { value: 'editor', label: 'Editor' },
  { value: 'admin',  label: 'Admin' },
]

export default function AdminUsersClient({ users, validateUser, deleteUser, inviteUser }: Props) {
  const [isPending, startTransition] = useTransition()
  const [actionError, setActionError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  // Invite form
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteTenant, setInviteTenant] = useState('')
  const [inviteRole, setInviteRole] = useState<MemberRole>('editor')
  const [inviteResult, setInviteResult] = useState<string | null>(null)

  // Unique tenants for the invite dropdown
  const tenants = [...new Map(
    users.filter(u => u.tenantSlug).map(u => [u.tenantSlug, u.tenantName])
  ).entries()].map(([slug, name]) => ({ slug: slug!, name: name! }))

  function handleValidate(userId: string) {
    setActionError(null)
    startTransition(async () => {
      const result = await validateUser(userId)
      if (result.error) setActionError(result.error)
    })
  }

  function handleDelete(userId: string) {
    setActionError(null)
    startTransition(async () => {
      const result = await deleteUser(userId)
      if (result.error) setActionError(result.error)
      else setConfirmDelete(null)
    })
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setActionError(null)
    setInviteResult(null)
    startTransition(async () => {
      const result = await inviteUser(inviteTenant, inviteEmail, inviteRole)
      if (result.error) setActionError(result.error)
      else {
        setInviteResult(result.acceptLink ?? 'Invitation sent!')
        setInviteEmail('')
        setShowInviteForm(false)
      }
    })
  }

  const pending = users.filter(u => u.status === 'pending_validation')
  const active = users.filter(u => u.status !== 'pending_validation')

  return (
    <div className="max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl text-[rgb(var(--text-1))] mb-1">Users</h1>
          <p className="text-sm text-[rgb(var(--text-3))]">
            {users.length} user{users.length !== 1 ? 's' : ''} across all workspaces
          </p>
        </div>
        <button
          onClick={() => { setShowInviteForm(!showInviteForm); setActionError(null); setInviteResult(null) }}
          className="px-4 py-2 text-sm font-medium text-white bg-[rgb(var(--color-primary))] rounded hover:opacity-90 transition-opacity"
        >
          + Invite user
        </button>
      </div>

      {/* Invite form */}
      {showInviteForm && (
        <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg p-5">
          <h2 className="text-sm font-semibold text-[rgb(var(--text-1))] mb-4">Invite to workspace</h2>
          <form onSubmit={handleInvite} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-48">
              <label className="block text-xs font-medium text-[rgb(var(--text-2))] mb-1">Email</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                required
                placeholder="user@example.com"
                className="w-full px-3 py-2 text-sm bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded text-[rgb(var(--text-1))] placeholder:text-[rgb(var(--text-3))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.4)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[rgb(var(--text-2))] mb-1">Workspace</label>
              <select
                value={inviteTenant}
                onChange={e => setInviteTenant(e.target.value)}
                required
                className="px-3 py-2 text-sm bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded text-[rgb(var(--text-1))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.4)]"
              >
                <option value="">Select workspace</option>
                {tenants.map(t => (
                  <option key={t.slug} value={t.slug}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[rgb(var(--text-2))] mb-1">Role</label>
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value as MemberRole)}
                className="px-3 py-2 text-sm bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded text-[rgb(var(--text-1))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.4)]"
              >
                {ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-[rgb(var(--color-primary))] rounded hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? 'Sending…' : 'Send invite'}
            </button>
          </form>
        </div>
      )}

      {actionError && (
        <div className="px-3 py-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-300">
          {actionError}
        </div>
      )}

      {inviteResult && (
        <div className="px-3 py-2 bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded text-sm text-[rgb(var(--text-2))]">
          Invitation sent! Backup link: <span className="font-mono text-xs">{inviteResult}</span>
        </div>
      )}

      {/* Pending approval */}
      {pending.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[rgb(var(--text-1))] mb-3">
            Awaiting approval ({pending.length})
          </h2>
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-amber-200 dark:border-amber-800">
                  {['Name / Email', 'Workspace', 'Role', 'Joined'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100 dark:divide-amber-900">
                {pending.map(user => (
                  <tr key={user.id}>
                    <td className="px-4 py-3">
                      {user.fullName && <div className="font-medium text-[rgb(var(--text-1))]">{user.fullName}</div>}
                      <div className="text-xs text-[rgb(var(--text-3))]">{user.email}</div>
                    </td>
                    <td className="px-4 py-3 text-[rgb(var(--text-2))]">
                      {user.tenantName ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-[rgb(var(--text-2))] capitalize">{user.role ?? '—'}</td>
                    <td className="px-4 py-3 text-[rgb(var(--text-3))] text-xs tabular-nums">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleValidate(user.id)}
                          disabled={isPending}
                          className="px-3 py-1 text-xs font-medium text-white bg-[rgb(var(--color-accent))] rounded hover:opacity-90 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        {confirmDelete === user.id ? (
                          <>
                            <button onClick={() => handleDelete(user.id)} disabled={isPending} className="text-xs text-red-500 font-medium">Confirm</button>
                            <button onClick={() => setConfirmDelete(null)} className="text-xs text-[rgb(var(--text-3))]">Cancel</button>
                          </>
                        ) : (
                          <button onClick={() => setConfirmDelete(user.id)} className="text-xs text-[rgb(var(--text-3))] hover:text-red-500 transition-colors">Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All users */}
      {active.length > 0 && (
        <div>
          {pending.length > 0 && (
            <h2 className="text-sm font-semibold text-[rgb(var(--text-1))] mb-3">All users ({active.length})</h2>
          )}
          <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgb(var(--border))]">
                  {['Name / Email', 'Workspace', 'Role', 'Joined', 'Last sign in', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[rgb(var(--text-3))] uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(var(--border))]">
                {active.map(user => {
                  const st = STATUS_LABEL[user.status] ?? STATUS_LABEL.active
                  return (
                    <tr key={user.id} className="hover:bg-[rgb(var(--surface-2))] transition-colors">
                      <td className="px-4 py-3">
                        {user.fullName && <div className="font-medium text-[rgb(var(--text-1))]">{user.fullName}</div>}
                        <div className="text-xs text-[rgb(var(--text-3))]">{user.email ?? '—'}</div>
                      </td>
                      <td className="px-4 py-3">
                        {user.tenantSlug ? (
                          <a href={`/admin/tenants/${user.tenantSlug}`} className="text-[rgb(var(--color-primary))] hover:underline">
                            {user.tenantName}
                          </a>
                        ) : (
                          <span className="text-[rgb(var(--text-3))]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[rgb(var(--text-2))] capitalize">{user.role ?? '—'}</td>
                      <td className="px-4 py-3 text-[rgb(var(--text-3))] tabular-nums text-xs">{formatDate(user.createdAt)}</td>
                      <td className="px-4 py-3 text-[rgb(var(--text-3))] tabular-nums text-xs">{formatDate(user.lastSignInAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs ${st.cls}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {confirmDelete === user.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-[rgb(var(--text-2))]">Delete user?</span>
                            <button onClick={() => handleDelete(user.id)} disabled={isPending} className="text-xs text-red-500 font-medium hover:text-red-600 disabled:opacity-50">Yes</button>
                            <button onClick={() => setConfirmDelete(null)} className="text-xs text-[rgb(var(--text-3))]">No</button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDelete(user.id)} disabled={isPending} className="text-xs text-[rgb(var(--text-3))] hover:text-red-500 transition-colors disabled:opacity-50">Delete</button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {users.length === 0 && (
        <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg p-12 text-center">
          <p className="text-sm text-[rgb(var(--text-3))]">No users yet.</p>
        </div>
      )}
    </div>
  )
}
