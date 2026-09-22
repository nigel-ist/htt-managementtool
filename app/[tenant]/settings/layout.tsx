/**
 * Tenant settings layout.
 * Guards to admin/owner; wraps children with a tab strip.
 */
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerJWTClaims } from '@/lib/supabase/server'

interface Props {
  children: React.ReactNode
  params: { tenant: string }
}

const TABS = [
  { href: (slug: string) => `/${slug}/settings/modules`, label: 'Module Access' },
  { href: (slug: string) => `/${slug}/settings/members`, label: 'Members' },
]

export default async function SettingsLayout({ children, params }: Props) {
  const { tenant: slug } = params
  const claims = await getServerJWTClaims()

  if (!claims) redirect(`/login?redirect=/${slug}/settings`)

  const isAdmin =
    claims.is_il_admin || claims.role === 'admin' || claims.role === 'owner'

  if (!isAdmin) redirect(`/${slug}/dashboard`)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[rgb(var(--text-1))]">Settings</h1>
        <p className="mt-1 text-sm text-[rgb(var(--text-3))]">
          Control which modules each role and individual member can access.
        </p>
      </div>

      {/* Tab strip */}
      <div className="flex gap-1 border-b border-[rgb(var(--border))] mb-6">
        {TABS.map(tab => {
          const href = tab.href(slug)
          return (
            <Link
              key={href}
              href={href}
              className="px-4 py-2 text-sm font-medium text-[rgb(var(--text-2))] hover:text-[rgb(var(--text-1))] border-b-2 border-transparent hover:border-[rgb(var(--border))] transition-colors [&.active]:text-[rgb(var(--color-primary))] [&.active]:border-[rgb(var(--color-primary))]"
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      {children}
    </div>
  )
}
