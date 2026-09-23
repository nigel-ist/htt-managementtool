'use client'

/**
 * Workspace topbar — shows page title and user context.
 * On mobile, shows a hamburger button to open the sidebar drawer.
 */
import { usePathname } from 'next/navigation'

interface TopbarProps {
  tenantName: string
  tenantSlug: string
  isIlAdmin?: boolean
  onMenuOpen?: () => void
}

const PAGE_LABELS: Record<string, string> = {
  dashboard:      'Dashboard',
  products:       'Products',
  innovations:    'Innovations',
  staff:          'Staff Skills',
  'current-state':'Current State',
  'future-state': 'Future State',
  roles:          'Roles',
  htt:            'How to Think',
  invitations:    'Invitations',
  settings:       'Settings',
  ideas:          'Ideas',
  'market-intel': 'Market Intel',
  competition:    'Competition',
  finance:        'Finance',
  compensation:   'Compensation',
  surveys:        'Surveys',
  board:          'Board Management',
  relationships:  'Relationship Network',
  downloads:      'Downloads',
}

function getPageTitle(pathname: string, tenantSlug: string): string {
  const after = pathname.replace(`/${tenantSlug}`, '').replace(/^\//, '')
  const segment = after.split('/')[0]
  return PAGE_LABELS[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
}

export default function Topbar({ tenantName, tenantSlug, isIlAdmin, onMenuOpen }: TopbarProps) {
  const pathname = usePathname()
  const title = getPageTitle(pathname, tenantSlug)

  return (
    <header className="h-12 flex items-center justify-between px-4 border-b border-[rgb(var(--border))] bg-[rgb(var(--surface))] flex-shrink-0">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          type="button"
          className="lg:hidden p-1.5 rounded text-[rgb(var(--text-3))] hover:text-[rgb(var(--text-1))] hover:bg-[rgb(var(--surface-2))] transition-colors"
          onClick={onMenuOpen}
          aria-label="Open navigation"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <span className="text-sm font-medium text-[rgb(var(--text-1))]">{title}</span>
      </div>

      <div className="flex items-center gap-3">
        {isIlAdmin && (
          <span className="text-xs text-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary)/0.1)] px-2 py-0.5 rounded font-medium hidden sm:inline">
            IL Admin
          </span>
        )}
      </div>
    </header>
  )
}
