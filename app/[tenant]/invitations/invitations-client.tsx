'use client'

/**
 * Client component for the Invitations page.
 * Handles the invite form, accept-link copy, and revoke confirmation.
 */
import { useState, useTransition, useRef } from 'react'
import type { MemberRole } from '@/lib/types/database'
import type { Invitation } from './types'

interface InvitationRole {
  value: MemberRole
  label: string
  description: string
}

interface Props {
  tenantSlug: string
  invitations: Invitation[]
  invitationRoles: InvitationRole[]
  sendInvitation: (slug: string, fd: FormData) => Promise<{ error?: string; acceptLink?: string }>
  revokeInvitation: (slug: string, id: string) => Promise<void>
}

function relativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

function isExpired(iso: string) {
  return new Date(iso).getTime() < Date.now()
}

function roleBadgeClass(role: MemberRole) {
  switch (role) {
    case 'owner':   return 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
    case 'admin':   return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
    case 'editor':  return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
    default:        return 'bg-[rgb(var(--surface-2))] text-[rgb(var(--text-2))]'
  }
}

export default function InvitationsClient({
  tenantSlug,
  invitations,
  invitationRoles,
  sendInvitation,
  revokeInvitation,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const [acceptLink, setAcceptLink] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [revokeId, setRevokeId] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<MemberRole>('editor')
  const formRef = useRef<HTMLFormElement>(null)

  const pending = invitations.filter(i => !i.accepted_at && !isExpired(i.expires_at))
  const accepted = invitations.filter(i => i.accepted_at)
  const expired = invitations.filter(i => !i.accepted_at && isExpired(i.expires_at))

  function handleSend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError(null)
    setAcceptLink(null)

    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await sendInvitation(tenantSlug, fd)
      if (result.error) {
        setFormError(result.error)
      } else if (result.acceptLink) {
        setAcceptLink(result.acceptLink)
        formRef.current?.reset()
        setSelectedRole('editor')
      }
    })
  }

  function handleCopyLink() {
    if (!acceptLink) return
    navigator.clipboard.writeText(acceptLink).then(() => {
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    })
  }

  function handleRevoke(id: string) {
    setRevokeId(null)
    startTransition(async () => {
      await revokeInvitation(tenantSlug, id)
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-[rgb(var(--text-1))]">Invitations</h1>
        <p className="mt-1 text-sm text-[rgb(var(--text-3))]">
          Invite people to join your workspace. They'll receive an email with a login link.
        </p>
      </div>

      {/* Invite form */}
      <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg p-5">
        <h2 className="text-sm font-semibold text-[rgb(var(--text-1))] mb-4">Send an invitation</h2>

        <form ref={formRef} onSubmit={handleSend} className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-[rgb(var(--text-2))] mb-1.5">
                Email address
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="colleague@example.com"
                className="w-full px-3 py-2 text-sm bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded text-[rgb(var(--text-1))] placeholder:text-[rgb(var(--text-3))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.4)] focus:border-[rgb(var(--color-primary))]"
              />
            </div>

            <div className="w-36">
              <label className="block text-xs font-medium text-[rgb(var(--text-2))] mb-1.5">
                Role
              </label>
              <select
                name="role"
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value as MemberRole)}
                className="w-full px-3 py-2 text-sm bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded text-[rgb(var(--text-1))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.4)] focus:border-[rgb(var(--color-primary))]"
              >
                {invitationRoles.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Role description */}
          <p className="text-xs text-[rgb(var(--text-3))]">
            {invitationRoles.find(r => r.value === selectedRole)?.description}
          </p>

          {formError && (
            <div className="px-3 py-2.5 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-300">
              {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2 px-4 text-sm font-medium text-white bg-[rgb(var(--color-primary))] rounded hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Sending…' : 'Send invitation'}
          </button>
        </form>

        {/* Accept link */}
        {acceptLink && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded space-y-2">
            <p className="text-xs font-medium text-green-800 dark:text-green-200">
              ✓ Invitation sent! Share this backup link if the email doesn't arrive:
            </p>
            <div className="flex gap-2">
              <input
                readOnly
                value={acceptLink}
                className="flex-1 px-2 py-1.5 text-xs font-mono bg-white dark:bg-green-900 border border-green-200 dark:border-green-700 rounded text-green-900 dark:text-green-100 truncate"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 transition-colors whitespace-nowrap"
              >
                {copiedLink ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pending invitations */}
      {pending.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[rgb(var(--text-1))] mb-3">
            Pending ({pending.length})
          </h2>
          <div className="divide-y divide-[rgb(var(--border))] border border-[rgb(var(--border))] rounded-lg overflow-hidden">
            {pending.map(inv => (
              <div key={inv.id} className="flex items-center gap-3 px-4 py-3 bg-[rgb(var(--surface))]">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[rgb(var(--text-1))] truncate">{inv.email}</div>
                  <div className="text-xs text-[rgb(var(--text-3))] mt-0.5">
                    Sent {relativeDate(inv.created_at)} · expires {new Date(inv.expires_at).toLocaleDateString()}
                  </div>
                </div>
                <span className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium capitalize ${roleBadgeClass(inv.role)}`}>
                  {inv.role}
                </span>

                {revokeId === inv.id ? (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-[rgb(var(--text-2))]">Revoke?</span>
                    <button
                      onClick={() => handleRevoke(inv.id)}
                      className="text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setRevokeId(null)}
                      className="text-xs text-[rgb(var(--text-3))] hover:text-[rgb(var(--text-2))]"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setRevokeId(inv.id)}
                    className="flex-shrink-0 text-xs text-[rgb(var(--text-3))] hover:text-red-600 transition-colors"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Accepted invitations */}
      {accepted.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[rgb(var(--text-1))] mb-3">
            Accepted ({accepted.length})
          </h2>
          <div className="divide-y divide-[rgb(var(--border))] border border-[rgb(var(--border))] rounded-lg overflow-hidden">
            {accepted.map(inv => (
              <div key={inv.id} className="flex items-center gap-3 px-4 py-3 bg-[rgb(var(--surface))]">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[rgb(var(--text-1))] truncate">{inv.email}</div>
                  <div className="text-xs text-[rgb(var(--text-3))] mt-0.5">
                    Joined {inv.accepted_at ? relativeDate(inv.accepted_at) : ''}
                  </div>
                </div>
                <span className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium capitalize ${roleBadgeClass(inv.role)}`}>
                  {inv.role}
                </span>
                <span className="flex-shrink-0 text-xs text-green-600 dark:text-green-400 font-medium">
                  ✓ Joined
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Expired invitations */}
      {expired.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[rgb(var(--text-3))] mb-3">
            Expired ({expired.length})
          </h2>
          <div className="divide-y divide-[rgb(var(--border))] border border-[rgb(var(--border))] rounded-lg overflow-hidden opacity-60">
            {expired.map(inv => (
              <div key={inv.id} className="flex items-center gap-3 px-4 py-3 bg-[rgb(var(--surface))]">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-[rgb(var(--text-2))] truncate">{inv.email}</div>
                  <div className="text-xs text-[rgb(var(--text-3))] mt-0.5">
                    Expired {relativeDate(inv.expires_at)}
                  </div>
                </div>
                <span className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium capitalize ${roleBadgeClass(inv.role)}`}>
                  {inv.role}
                </span>
                <button
                  onClick={() => handleRevoke(inv.id)}
                  className="flex-shrink-0 text-xs text-[rgb(var(--text-3))] hover:text-red-600 transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {invitations.length === 0 && (
        <div className="text-center py-12 text-[rgb(var(--text-3))] text-sm">
          No invitations yet. Send one above to get started.
        </div>
      )}
    </div>
  )
}
