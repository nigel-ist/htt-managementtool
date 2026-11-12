'use client'

/**
 * Client component for the Invitations page.
 * Sections: invite by email | invite codes | pending approval | all invitations
 */
import { useState, useTransition, useRef } from 'react'
import type { MemberRole } from '@/lib/types/database'
import type { Invitation } from './types'
import type { InviteCodeRow, PendingMemberRow } from './invite-codes-actions'

interface InvitationRole { value: MemberRole; label: string; description: string }

interface Props {
  tenantSlug: string
  invitations: Invitation[]
  invitationRoles: InvitationRole[]
  inviteCodes: InviteCodeRow[]
  pendingMembers: PendingMemberRow[]
  sendInvitation: (slug: string, fd: FormData) => Promise<{ error?: string; acceptLink?: string }>
  revokeInvitation: (slug: string, id: string) => Promise<void>
  createInviteCode: (slug: string, opts: { defaultRole: MemberRole; requiresValidation: boolean; maxUses?: number | null; expiresAt?: string | null }) => Promise<{ error?: string; code?: string }>
  toggleInviteCode: (slug: string, id: string, active: boolean) => Promise<{ error?: string }>
  deleteInviteCode: (slug: string, id: string) => Promise<{ error?: string }>
  validateMember: (slug: string, userId: string) => Promise<{ error?: string }>
  rejectPendingMember: (slug: string, userId: string) => Promise<{ error?: string }>
}

function relativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

function isExpired(iso: string) { return new Date(iso).getTime() < Date.now() }

function roleBadgeClass(role: MemberRole) {
  switch (role) {
    case 'owner':  return 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
    case 'admin':  return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
    case 'editor': return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
    default:       return 'bg-[rgb(var(--surface-2))] text-[rgb(var(--text-2))]'
  }
}

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try { await navigator.clipboard.writeText(text) } catch { /* noop */ }
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="text-xs text-[rgb(var(--color-primary))] hover:underline flex-shrink-0">
      {copied ? '✓ Copied' : label}
    </button>
  )
}

export default function InvitationsClient({
  tenantSlug, invitations, invitationRoles, inviteCodes, pendingMembers,
  sendInvitation, revokeInvitation, createInviteCode, toggleInviteCode, deleteInviteCode,
  validateMember, rejectPendingMember,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const [acceptLink, setAcceptLink] = useState<string | null>(null)
  const [revokeId, setRevokeId] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<MemberRole>('editor')
  const formRef = useRef<HTMLFormElement>(null)

  function handleSend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setFormError(null); setAcceptLink(null)
    const fd = new FormData(e.currentTarget); fd.set('role', selectedRole)
    startTransition(async () => {
      const result = await sendInvitation(tenantSlug, fd)
      if (result.error) setFormError(result.error)
      else { setAcceptLink(result.acceptLink ?? null); formRef.current?.reset() }
    })
  }

  function handleRevoke(id: string) {
    startTransition(async () => { await revokeInvitation(tenantSlug, id); setRevokeId(null) })
  }

  const [codeError, setCodeError] = useState<string | null>(null)
  const [newCodeRole, setNewCodeRole] = useState<MemberRole>('viewer')
  const [newCodeRequiresValidation, setNewCodeRequiresValidation] = useState(true)
  const [createdCode, setCreatedCode] = useState<string | null>(null)
  const [codesPending, startCodeTransition] = useTransition()

  function handleCreateCode(e: React.FormEvent) {
    e.preventDefault(); setCodeError(null); setCreatedCode(null)
    startCodeTransition(async () => {
      const result = await createInviteCode(tenantSlug, { defaultRole: newCodeRole, requiresValidation: newCodeRequiresValidation })
      if (result.error) setCodeError(result.error)
      else setCreatedCode(result.code ?? null)
    })
  }

  const [validatePending, startValidateTransition] = useTransition()

  const pending = invitations.filter(i => !i.accepted_at && !isExpired(i.expires_at))
  const accepted = invitations.filter(i => !!i.accepted_at)
  const expired = invitations.filter(i => !i.accepted_at && isExpired(i.expires_at))
  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <div className="space-y-10 max-w-2xl">

      {/* 1. Send invitation */}
      <section>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-[rgb(var(--text-1))]">Invite by email</h2>
          <p className="text-sm text-[rgb(var(--text-3))] mt-0.5">Send an invitation directly to someone's email address.</p>
        </div>
        <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg p-5">
          <form ref={formRef} onSubmit={handleSend} className="space-y-4">
            <div className="flex gap-3">
              <input name="email" type="email" required placeholder="colleague@example.com"
                className="flex-1 px-3 py-2 text-sm bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded text-[rgb(var(--text-1))] placeholder:text-[rgb(var(--text-3))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.4)]" />
              <select value={selectedRole} onChange={e => setSelectedRole(e.target.value as MemberRole)}
                className="px-3 py-2 text-sm bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded text-[rgb(var(--text-1))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.4)]">
                {invitationRoles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <button type="submit" disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-[rgb(var(--color-primary))] rounded hover:opacity-90 disabled:opacity-50 whitespace-nowrap">
                {isPending ? 'Sending…' : 'Send invite'}
              </button>
            </div>
            {formError && <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>}
            {acceptLink && (
              <div className="flex items-center gap-2 px-3 py-2 bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded text-xs">
                <span className="text-[rgb(var(--text-3))]">Invite sent! Backup link:</span>
                <span className="font-mono text-[rgb(var(--text-2))] truncate flex-1">{acceptLink}</span>
                <CopyButton text={acceptLink} label="Copy link" />
              </div>
            )}
          </form>
        </div>
      </section>

      {/* 2. Invite codes */}
      <section>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-[rgb(var(--text-1))]">Invite codes</h2>
          <p className="text-sm text-[rgb(var(--text-3))] mt-0.5">Share a code so people can register themselves. New members via code require admin approval by default.</p>
        </div>
        {inviteCodes.length > 0 && (
          <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg divide-y divide-[rgb(var(--border))] mb-4">
            {inviteCodes.map(c => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3 flex-wrap">
                <span className={`font-mono text-sm font-semibold ${c.isActive ? 'text-[rgb(var(--text-1))]' : 'text-[rgb(var(--text-3))] line-through'}`}>{c.code}</span>
                <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-xs capitalize ${roleBadgeClass(c.defaultRole)}`}>{c.defaultRole}</span>
                {c.requiresValidation && (
                  <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-xs bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">Needs approval</span>
                )}
                <span className="text-xs text-[rgb(var(--text-3))] flex-shrink-0">{c.usesCount} use{c.usesCount !== 1 ? 's' : ''}{c.maxUses !== null ? ` / ${c.maxUses}` : ''}</span>
                <div className="flex-1" />
                <CopyButton text={`${origin}/${tenantSlug}/join?code=${c.code}`} label="Copy link" />
                <button onClick={() => startCodeTransition(async () => { await toggleInviteCode(tenantSlug, c.id, !c.isActive) })} disabled={codesPending}
                  className="text-xs text-[rgb(var(--text-2))] hover:text-[rgb(var(--text-1))] disabled:opacity-50">{c.isActive ? 'Disable' : 'Enable'}</button>
                <button onClick={() => startCodeTransition(async () => { await deleteInviteCode(tenantSlug, c.id) })} disabled={codesPending}
                  className="text-xs text-red-500 hover:text-red-600 disabled:opacity-50">Delete</button>
              </div>
            ))}
          </div>
        )}
        <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg p-5">
          <form onSubmit={handleCreateCode} className="space-y-3">
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-[rgb(var(--text-2))] mb-1">Default role</label>
                <select value={newCodeRole} onChange={e => setNewCodeRole(e.target.value as MemberRole)}
                  className="px-3 py-2 text-sm bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded text-[rgb(var(--text-1))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.4)]">
                  {invitationRoles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-[rgb(var(--text-2))] pb-2 cursor-pointer">
                <input type="checkbox" checked={newCodeRequiresValidation} onChange={e => setNewCodeRequiresValidation(e.target.checked)}
                  className="h-4 w-4 rounded border-[rgb(var(--border))] text-[rgb(var(--color-primary))]" />
                Require admin approval
              </label>
              <button type="submit" disabled={codesPending}
                className="px-4 py-2 text-sm font-medium text-white bg-[rgb(var(--color-primary))] rounded hover:opacity-90 disabled:opacity-50">
                {codesPending ? 'Creating…' : 'Generate code'}
              </button>
            </div>
            {codeError && <p className="text-sm text-red-600 dark:text-red-400">{codeError}</p>}
            {createdCode && (
              <div className="flex items-center gap-2 px-3 py-2 bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded">
                <span className="text-xs text-[rgb(var(--text-3))]">New code:</span>
                <span className="font-mono font-semibold text-sm text-[rgb(var(--text-1))]">{createdCode}</span>
                <div className="flex-1" />
                <CopyButton text={`${origin}/${tenantSlug}/join?code=${createdCode}`} label="Copy join link" />
              </div>
            )}
          </form>
        </div>
      </section>

      {/* 3. Pending approval */}
      {pendingMembers.length > 0 && (
        <section>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-[rgb(var(--text-1))]">Awaiting approval ({pendingMembers.length})</h2>
            <p className="text-sm text-[rgb(var(--text-3))] mt-0.5">These users signed up with an invite code and are waiting for access.</p>
          </div>
          <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg divide-y divide-[rgb(var(--border))]">
            {pendingMembers.map(m => (
              <div key={m.userId} className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                    {(m.fullName ?? m.email).charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  {m.fullName && <div className="text-sm font-medium text-[rgb(var(--text-1))] truncate">{m.fullName}</div>}
                  <div className="text-xs text-[rgb(var(--text-3))] truncate">{m.email}</div>
                </div>
                <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-xs capitalize ${roleBadgeClass(m.role)}`}>{m.role}</span>
                <span className="text-xs text-[rgb(var(--text-3))] flex-shrink-0">{relativeDate(m.joinedAt)}</span>
                <button onClick={() => startValidateTransition(async () => { await validateMember(tenantSlug, m.userId) })} disabled={validatePending}
                  className="flex-shrink-0 px-3 py-1 text-xs font-medium text-white bg-[rgb(var(--color-accent))] rounded hover:opacity-90 disabled:opacity-50">
                  Approve
                </button>
                <button onClick={() => startValidateTransition(async () => { await rejectPendingMember(tenantSlug, m.userId) })} disabled={validatePending}
                  className="flex-shrink-0 px-3 py-1 text-xs font-medium text-[rgb(var(--text-2))] bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded hover:bg-[rgb(var(--border))] disabled:opacity-50">
                  Reject
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. All invitations */}
      <section>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-[rgb(var(--text-1))]">Email invitations</h2>
        </div>
        {invitations.length === 0 ? (
          <p className="text-sm text-[rgb(var(--text-3))]">No invitations sent yet.</p>
        ) : (
          <div className="space-y-4">
            {pending.length > 0 && (
              <div>
                <p className="text-xs font-medium text-[rgb(var(--text-3))] uppercase tracking-wide mb-2">Pending</p>
                <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg divide-y divide-[rgb(var(--border))]">
                  {pending.map(inv => (
                    <div key={inv.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-[rgb(var(--text-1))] truncate">{inv.email}</div>
                        <div className="text-xs text-[rgb(var(--text-3))]">Expires {relativeDate(inv.expires_at)}</div>
                      </div>
                      <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-xs capitalize ${roleBadgeClass(inv.role as MemberRole)}`}>{inv.role}</span>
                      {revokeId === inv.id ? (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-[rgb(var(--text-2))]">Revoke?</span>
                          <button onClick={() => handleRevoke(inv.id)} disabled={isPending} className="text-xs text-red-500 font-medium disabled:opacity-50">Yes</button>
                          <button onClick={() => setRevokeId(null)} className="text-xs text-[rgb(var(--text-3))]">No</button>
                        </div>
                      ) : (
                        <button onClick={() => setRevokeId(inv.id)} className="flex-shrink-0 text-xs text-[rgb(var(--text-3))] hover:text-red-500 transition-colors">Revoke</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {accepted.length > 0 && (
              <div>
                <p className="text-xs font-medium text-[rgb(var(--text-3))] uppercase tracking-wide mb-2">Accepted</p>
                <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg divide-y divide-[rgb(var(--border))]">
                  {accepted.map(inv => (
                    <div key={inv.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-[rgb(var(--text-1))] truncate">{inv.email}</div>
                        <div className="text-xs text-[rgb(var(--text-3))]">Accepted {relativeDate(inv.accepted_at!)}</div>
                      </div>
                      <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-xs capitalize ${roleBadgeClass(inv.role as MemberRole)}`}>{inv.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {expired.length > 0 && (
              <div>
                <p className="text-xs font-medium text-[rgb(var(--text-3))] uppercase tracking-wide mb-2">Expired</p>
                <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg divide-y divide-[rgb(var(--border))]">
                  {expired.map(inv => (
                    <div key={inv.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-[rgb(var(--text-3))] truncate">{inv.email}</div>
                      </div>
                      <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-xs capitalize ${roleBadgeClass(inv.role as MemberRole)}`}>{inv.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
