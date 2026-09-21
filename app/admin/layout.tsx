/**
 * IL Admin layout — wraps all /admin/* pages.
 *
 * Verifies the user is an Innovation Lab administrator.
 * Non-IL-admins are redirected to their own tenant or the login page.
 */
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerJWTClaims } from '@/lib/supabase/server'

interface AdminLayoutProps {
  children: React.ReactNode
}

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/admin/tenants', label: 'Tenants', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { href: '/admin/users', label: 'Users', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { href: '/admin/invitations', label: 'Invitations', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
]

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const claims = await getServerJWTClaims()

  if (!claims) {
    redirect('/login?redirect=/admin')
  }

  if (!claims.is_il_admin) {
    redirect('/')
  }

  return (
    <div className="flex h-screen bg-[rgb(var(--bg))] overflow-hidden">
      {/* Admin sidebar */}
      <aside className="w-56 flex-shrink-0 bg-[rgb(var(--surface))] border-r border-[rgb(var(--border))] flex flex-col">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-[rgb(var(--border))]">
          <div className="font-heading text-lg text-[rgb(var(--text-1))]">
            The Innovation<span className="text-[rgb(var(--color-primary))]">Lab</span>
          </div>
          <div className="text-xs text-[rgb(var(--text-3))] mt-0.5">IL Admin Console</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-[rgb(var(--text-2))] rounded-md hover:bg-[rgb(var(--surface-2))] hover:text-[rgb(var(--text-1))] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="flex-shrink-0">
                <path d={item.icon} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[rgb(var(--border))]">
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="text-xs text-[rgb(var(--text-3))] hover:text-[rgb(var(--text-2))] transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-12 flex items-center px-6 border-b border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
          <span className="text-xs font-medium text-[rgb(var(--text-3))] uppercase tracking-wider">
            IL Admin
          </span>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
