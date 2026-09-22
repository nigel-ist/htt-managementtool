import Link from 'next/link'
import { getMembers } from './actions'

export const metadata = { title: 'Members — Settings' }

interface Props { params: { tenant: string } }

const ROLE_BADGE: Record<string, string> = {
  owner:  'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  admin:  'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  editor: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  viewer: 'bg-[rgb(var(--surface-2))] text-[rgb(var(--text-2))]',
}

export default async function MembersPage({ params }: Props) {
  const { tenant: slug } = params
  const members = await getMembers(slug)

  if (members.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-[rgb(var(--text-3))]">
        No members found.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[rgb(var(--text-2))]">
        Click a member to set per-user module overrides. Overrides take precedence over role defaults.
      </p>

      <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg overflow-hidden divide-y divide-[rgb(var(--border))]">
        {members.map(m => (
          <Link
            key={m.userId}
            href={`/${slug}/settings/members/${m.userId}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-[rgb(var(--surface-2))] transition-colors group"
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-[rgb(var(--color-primary)/0.1)] flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-[rgb(var(--color-primary))]">
                {m.email.charAt(0).toUpperCase()}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-[rgb(var(--text-1))] truncate">{m.email}</div>
              {!m.isActive && (
                <div className="text-xs text-[rgb(var(--text-3))]">Inactive</div>
              )}
            </div>

            <span className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium capitalize ${ROLE_BADGE[m.role] ?? ROLE_BADGE.viewer}`}>
              {m.role}
            </span>

            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              className="flex-shrink-0 text-[rgb(var(--text-3))] group-hover:text-[rgb(var(--text-1))] transition-colors"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  )
}
