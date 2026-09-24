'use client'

/**
 * Tenant workspace sidebar.
 *
 * Visibility is controlled by two mechanisms:
 *  - `moduleKey`  — the server layout pre-computes which modules this user
 *                   can access (role defaults + user overrides) and passes
 *                   the set as `accessibleModules`. Items with a moduleKey
 *                   are hidden if the key isn't in that set.
 *  - `minRole`    — hardcoded permission gate for admin-only items
 *                   (Settings, Invitations) that aren't content modules.
 */
import { usePathname } from 'next/navigation'
import type { MemberRole } from '@/lib/types/database'

interface SidebarProps {
  tenantSlug: string
  tenantName: string
  userRole?: MemberRole
  isIlAdmin?: boolean
  accessibleModules: string[]
}

interface NavItem {
  href: string
  label: string
  icon: string
  moduleKey?: string   // gates by module access (computed server-side)
  minRole?: MemberRole // gates by role regardless of module config
  group?: string       // optional visual grouping label
}

function buildNavItems(slug: string): NavItem[] {
  return [
    {
      href: `/${slug}/dashboard`,
      label: 'Dashboard',
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    },
    // Core
    {
      href: `/${slug}/products`,
      label: 'Products',
      moduleKey: 'products',
      group: 'Core',
      icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    },
    {
      href: `/${slug}/innovations`,
      label: 'Innovations',
      moduleKey: 'innovations',
      icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
    },
    {
      href: `/${slug}/staff`,
      label: 'Staff Skills',
      moduleKey: 'staff_skills',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    },
    {
      href: `/${slug}/htt`,
      label: 'How to Think',
      moduleKey: 'htt',
      icon: 'M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.311a14.974 14.974 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18',
    },
    // Strategy
    {
      href: `/${slug}/current-state`,
      label: 'Current State',
      moduleKey: 'current_state',
      group: 'Strategy',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    },
    {
      href: `/${slug}/future-state`,
      label: 'Future State',
      moduleKey: 'future_state',
      icon: 'M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122',
    },
    {
      href: `/${slug}/roles`,
      label: 'Roles',
      moduleKey: 'structure',
      icon: 'M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0',
    },
    {
      href: `/${slug}/ideas`,
      label: 'Ideas',
      moduleKey: 'ideas',
      icon: 'M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z',
    },
    // Market
    {
      href: `/${slug}/market-intel`,
      label: 'Market Intel',
      moduleKey: 'market_intel',
      group: 'Market',
      icon: 'M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6.75v6.75',
    },
    {
      href: `/${slug}/competition`,
      label: 'Competition',
      moduleKey: 'competition',
      icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
    },
    {
      href: `/${slug}/surveys`,
      label: 'Surveys',
      moduleKey: 'surveys',
      icon: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z',
    },
    {
      href: `/${slug}/relationships`,
      label: 'Relationships',
      moduleKey: 'relationship_network',
      icon: 'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z',
    },
    // Operations
    {
      href: `/${slug}/finance`,
      label: 'Finance',
      moduleKey: 'finance',
      group: 'Operations',
      icon: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 01-.75.75h-.75m-6-1.5H4.5m0 0l-.75.375M4.5 18.75l-1.5.75',
    },
    {
      href: `/${slug}/compensation`,
      label: 'Compensation',
      moduleKey: 'compensation',
      icon: 'M15 8.25H9m6 3H9m3 6l-3-3h1.5a3 3 0 100-6M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      href: `/${slug}/board`,
      label: 'Board Meetings',
      moduleKey: 'bod_management',
      icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z',
    },
    {
      href: `/${slug}/downloads`,
      label: 'Downloads',
      moduleKey: 'downloads',
      icon: 'M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3',
    },
    // Admin
    {
      href: `/${slug}/invitations`,
      label: 'Invitations',
      minRole: 'admin',
      group: 'Admin',
      icon: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75',
    },
    {
      href: `/${slug}/settings`,
      label: 'Settings',
      minRole: 'admin',
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    },
  ]
}

export default function Sidebar({ tenantSlug, tenantName, userRole, isIlAdmin, accessibleModules }: SidebarProps) {
  const pathname = usePathname()
  const navItems = buildNavItems(tenantSlug)
  const moduleSet = new Set(accessibleModules)

  function isVisible(item: NavItem): boolean {
    if (isIlAdmin) return true

    // Module gate — server computed
    if (item.moduleKey && !moduleSet.has(item.moduleKey)) return false

    // Role gate — hardcoded for admin-only UI items
    if (item.minRole) {
      const roleOrder: MemberRole[] = ['viewer', 'editor', 'admin', 'owner']
      const userIdx = roleOrder.indexOf(userRole ?? 'viewer')
      const minIdx = roleOrder.indexOf(item.minRole)
      if (userIdx < minIdx) return false
    }

    return true
  }

  function isActive(href: string): boolean {
    return pathname === href || (href !== `/${tenantSlug}/dashboard` && pathname.startsWith(href))
  }

  const visibleItems = navItems.filter(isVisible)
  const seenGroups = new Set<string>()

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
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        {visibleItems.map(item => {
          const showGroupLabel = item.group != null && !seenGroups.has(item.group)
          if (item.group != null) seenGroups.add(item.group)

          return (
            <div key={item.href}>
              {showGroupLabel && (
                <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[rgb(var(--text-3))]">
                  {item.group}
                </p>
              )}
              <a
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
            </div>
          )
        })}
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
