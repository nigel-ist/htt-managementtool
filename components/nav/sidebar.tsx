'use client'

/**
 * Tenant workspace sidebar.
 * Renders the nav links for the active tenant.
 * Links are determined by the user's role; IL admins see everything.
 */
import { usePathname } from 'next/navigation'
import type { MemberRole } from '@/lib/types/database'

interface SidebarProps {
  tenantSlug: string
  tenantName: string
  userRole?: MemberRole
  isIlAdmin?: boolean
}

interface NavItem {
  href: string
  label: string
  icon: string
  minRole?: MemberRole
}

function buildNavItems(slug: string): NavItem[] {
  return [
    {
      href: `/${slug}/dashboard`,
      label: 'Dashboard',
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    },
    {
      href: `/${slug}/products`,
      label: 'Products',
      icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    },
    {
      href: `/${slug}/innovations`,
      label: 'Innovations',
      icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
    },
    {
      href: `/${slug}/staff`,
      label: 'Staff Skills',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    },
    {
      href: `/${slug}/current-state`,
      label: 'Current State',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    },
    {
      href: `/${slug}/future-state`,
      label: 'Future State',
      icon: 'M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122',
    },
    {
      href: `/${slug}/roles`,
      label: 'Roles',
      icon: 'M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0',
    },
    {
      href: `/${slug}/invitations`,
      label: 'Invitations',
      icon: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75',
      minRole: 'admin' as MemberRole,
    },
    {
      href: `/${slug}/htt`,
      label: 'How to Think',
      icon: 'M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.311a14.974 14.974 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18',
    },
    {
      href: `/${slug}/settings`,
      label: 'Settings',
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
      minRole: 'admin',
    },
  ]
}

export default function Sidebar({ tenantSlug, tenantName, userRole, isIlAdmin }: SidebarProps) {
  const pathname = usePathname()
  const navItems = buildNavItems(tenantSlug)

  function isVisible(item: NavItem): boolean {
    if (isIlAdmin) return true
    if (!item.minRole) return true
    const roleOrder: MemberRole[] = ['viewer', 'editor', 'admin', 'owner']
    const userIdx = roleOrder.indexOf(userRole ?? 'viewer')
    const minIdx = roleOrder.indexOf(item.minRole)
    return userIdx >= minIdx
  }

  function isActive(href: string): boolean {
    return pathname === href || (href !== `/${tenantSlug}/dashboard` && pathname.startsWith(href))
  }

  return (
    <aside className="w-56 flex-shrink-0 bg-[rgb(var(--surface))] border-r border-[rgb(var(--border))] flex flex-col">
      {/* Logo / tenant name */}
      <div className="px-4 py-4 border-b border-[rgb(var(--border))]">
        <div className="font-heading text-lg text-[rgb(var(--text-1))] truncate">
          {tenantName}
        </div>
        <div className="text-xs text-[rgb(var(--text-3))] mt-0.5 flex items-center gap-1">
          {isIlAdmin && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary)/0.1)]">
              IL Admin
            </span>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.filter(isVisible).map(item => (
          <a
            key={item.href}
            href={item.href}
            className={[
              'flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors',
              isActive(item.href)
                ? 'bg-[rgb(var(--color-primary)/0.1)] text-[rgb(var(--color-primary))] font-medium'
                : 'text-[rgb(var(--text-2))] hover:bg-[rgb(var(--surface-2))] hover:text-[rgb(var(--text-1))]',
            ].join(' ')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="flex-shrink-0">
              <path d={item.icon} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {item.label}
          </a>
        ))}
      </nav>

      {/* IL admin back link */}
      {isIlAdmin && (
        <div className="px-4 py-3 border-t border-[rgb(var(--border))]">
          <a
            href="/admin/tenants"
            className="text-xs text-[rgb(var(--text-3))] hover:text-[rgb(var(--text-2))] transition-colors"
          >
            ← IL Admin console
          </a>
        </div>
      )}

      {/* Sign out */}
      {!isIlAdmin && (
        <div className="px-4 py-3 border-t border-[rgb(var(--border))]">
          <form action="/api/auth/signout" method="post">
            <button type="submit" className="text-xs text-[rgb(var(--text-3))] hover:text-[rgb(var(--text-2))] transition-colors">
              Sign out
            </button>
          </form>
        </div>
      )}
    </aside>
  )
}
