'use client'

/**
 * Client component for Settings > Members.
 * Shows all members with role-change, validate, delete, and module-override navigation.
 */
import { useState, useTransition } from 'react'
import Link from 'next/link'
import type { MemberRole } from '@/lib/types/database'
import type { MemberRow } from './actions'

const ROLE_BADGE: Record<string, string> = {
  owner:  'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  admin:  'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  editor: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  viewer: 'bg-[rgb(var(--surface-2))] text-[rgb(var(--text-2))]',
}

const ROLES: { value: MemberRole; label: string }[] = [
  { value: 'owner',  label: 'Owner' },
  { value: 'admin',  label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Viewer' },
]

interface Props {
  tenantSlug: string
  members: MemberRow[]
  changeRole: (slug: string, userId: string, role: MemberRole) => Promise<{ error?: string }>
  validateMember: (slug: string, userId: string) => Promise<{ error?: string }>
  deleteMember: (slug: string, userId: string) => Promise<{ error?: string }>
}

export default function MembersClient({ tenantSlug, members, changeRole, validateMember, deleteMember }: Props) {
  const [isPending, startTransition] = useTransition()
  const [actionError, setActionError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const active = members.filter(m => m.status === 'active')
  const pending = members.filter(m => m.status === 'pending_validation')

  function handleRoleChange(userId: string, newRole: MemberRole) {
    setActionError(null)
    startTransition(async () => {
      const result = await changeRole(tenantSlug, userId, newRole)
      if (result.error) setActionError(result.error)
    })
  }

  function handleValidate(userId: string) {
    setActionError(null)
    startTransition(async () => {
      const result = await validateMember(tenantSlug, userId)
      if (result.error) setActionError(result.error)
    })
  }

  function handleDelete(userId: string) {
    setActionError(null)
    startTransition(async () => {
      const result = await deleteMember(tenantSlug, userId)
      if (result.error) setActionError(result.error)
      else setConfirmDelete(null)
    })
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-[rgb(var(--text-3))]">
        No members found.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-[rgb(var(--text-2))]">
        Manage roles, approve pending members, or click a member to set per-user module overrides.
      </p>

      {actionError && (
        <div className="px-3 py-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-300">
          {actionError}
        </div>
      )}

      {/* Pending validation */}
      {pending.length > 0 && (
        <div>
          <p className="text-xs font-medium text-[rgb(var(--text-3))] uppercase tracking-wide mb-2">
            Awaiting approval ({pending.length})
          </p>
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg overflow-hidden divide-y divide-amber-200 dark:divide-amber-800">
            {pending.map(m => (
              <div key={m.userId} className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                    {(m.fullName ?? m.email).charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  {m.fullName && (
                    <div className="text-sm font-medium text-[rgb(var(--text-1))] truncate">{m.fullName}</div>
                  )}
                  <div className="text-xs text-[rgb(var(--text-3))] truncate">{m.email}</div>
                </div>
                <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-xs capitalize ${ROLE_BADGE[m.role] ?? ROLE_BADGE.viewer}`}>
                  {m.role}
                </span>
                <button
                  onClick={() => handleValidate(m.userId)}
                  disabled={isPending}
                  className="flex-shrink-0 px-3 py-1 text-xs font-medium text-white bg-[rgb(var(--color-accent))] rounded hover:opacity-90 disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => setConfirmDelete(m.userId)}
                  disabled={isPending}
                  className="flex-shrink-0 text-xs text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active members */}
      {active.length > 0 && (
        <div>
          {pending.length > 0 && (
            <p className="text-xs font-medium text-[rgb(var(--text-3))] uppercase tracking-wide mb-2">
              Active members ({active.length})
            </p>
          )}
          <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg overflow-hidden divide-y divide-[rgb(var(--border))]">
            {active.map(m => (
              <div key={m.userId} className="flex items-center gap-3 px-4 py-3 group">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-[rgb(var(--color-primary)/0.1)] flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-[rgb(var(--color-primary))]">
                    {(m.fullName ?? m.email).charAt(0).toUpperCase()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  {m.fullName && (
                    <div className="text-sm font-medium text-[rgb(var(--text-1))] truncate">{m.fullName}</div>
                  )}
                  <div className="text-xs text-[rgb(var(--text-3))] truncate">{m.email}</div>
                </div>

                {/* Role selector */}
                <select
                  defaultValue={m.role}
                  onChange={e => handleRoleChange(m.userId, e.target.value as MemberRole)}
                  disabled={isPending}
                  className="flex-shrink-0 px-2 py-1 text-xs bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded text-[rgb(var(--text-1))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.4)] disabled:opacity-50 capitalize"
                >
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>

                {/* Module overrides link */}
                <Link
                  href={`/${tenantSlug}/settings/members/${m.userId}`}
                  className="flex-shrink-0 text-xs text-[rgb(var(--text-3))] hover:text-[rgb(var(--text-1))] transition-colors opacity-0 group-hover:opacity-100"
                >
                  Modules →
                </Link>

                {/* Delete */}
                {confirmDelete === m.userId ? (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-[rgb(var(--text-2))]">Remove?</span>
                    <button
                      onClick={() => handleDelete(m.userId)}
                      disabled={isPending}
                      className="text-xs text-red-500 hover:text-red-600 font-medium disabled:opacity-50"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="text-xs text-[rgb(var(--text-3))] hover:text-[rgb(var(--text-2))]"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(m.userId)}
                    disabled={isPending}
                    className="flex-shrink-0 text-xs text-[rgb(var(--text-3))] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
